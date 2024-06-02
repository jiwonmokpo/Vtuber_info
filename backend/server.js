const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { permission } = require('process');
require('dotenv').config();

const app = express();
const port = 5000;

const profileImagePath = 'C:/Vtuber_imageDB/profile_image';
const defaultImagePath = 'C:/Vtuber_imageDB/profile_default';
const vtProfilePath = 'C:/Vtuber_imageDB/vt_profile';
const vtHeaderPath = 'C:/Vtuber_imageDB/vt_header';
const companyProfilePath = 'C:/Vtuber_imageDB/company_profile';
const companyHeaderPath = 'C:/Vtuber_imageDB/company_header';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'vtProfileImage') {
      cb(null, vtProfilePath);
    } else if (file.fieldname === 'vtHeaderImage') {
      cb(null, vtHeaderPath);
    } else if (file.fieldname === 'profileImage') {
      cb(null, profileImagePath);
    } else if (file.fieldname === 'companyProfileImage') {
      cb(null, companyProfilePath);
    } else if (file.fieldname === 'companyHeaderImage') {
      cb(null, companyHeaderPath);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 정적 파일 경로 설정
app.use('/uploads', express.static(profileImagePath));
app.use('/default', express.static(defaultImagePath));
app.use('/uploads', express.static(vtProfilePath));
app.use('/uploads', express.static(vtHeaderPath));
app.use('/uploads', express.static(companyProfilePath));
app.use('/uploads', express.static(companyHeaderPath));

app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

const dbConfig = {
  user: 'vtuber',
  password: '0000',
  connectString: 'localhost:1521/xe'
};

oracledb.autoCommit = true;

// 이메일 전송 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// 비밀번호 해시 생성 및 검증 함수
const hashPassword = (password, salt) => {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

const generateSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

const createPasswordHash = (password) => {
  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);
  return `${salt}$${hashedPassword}`;
};

const verifyPassword = (password, storedHash) => {
  const [salt, hash] = storedHash.split('$');
  const inputHash = hashPassword(password, salt);
  return inputHash === hash;
};

// 이메일 인증 링크 생성 함수
const generateEmailToken = (username) => {
  return crypto.createHash('sha256').update(username + process.env.SECRET_KEY).digest('hex');
};

// 인증 미들웨어
const authenticate = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// 회원가입
app.post('/register', async (req, res) => {
  const { username, password, email, gender, membermbti } = req.body;

  try {
    const hashedPassword = createPasswordHash(password);

    const connection = await oracledb.getConnection(dbConfig);

    // 이메일 중복 확인
    const emailCheckResult = await connection.execute(
      `SELECT email FROM member WHERE email = :email`,
      [email]
    );

    if (emailCheckResult.rows.length > 0) {
      res.status(400).send('이미 사용된 이메일입니다. 다른 이메일을 사용해주세요.');
      await connection.close();
      return;
    }

    await connection.execute(
      `INSERT INTO member (username, password, email, gender, membermbti, emailcheck) 
       VALUES (:username, :password, :email, :gender, :membermbti, 0)`,
      [username, hashedPassword, email, gender, membermbti]
    );

    // 이메일 인증 링크 전송
    const token = generateEmailToken(username);
    const verificationLink = `http://localhost:5000/verify-email?username=${username}&token=${token}`;
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: '이메일 인증',
      text: `이메일 인증을 위해 아래 링크를 클릭해주세요: ${verificationLink}`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      error: 'Error registering user',
      details: err.message
    });
  }
});

// 이메일 인증
app.get('/verify-email', async (req, res) => {
  const { username, token } = req.query;

  try {
    const expectedToken = generateEmailToken(username);
    if (token !== expectedToken) {
      res.status(400).send('잘못된 이메일 인증 링크입니다.');
      return;
    }

    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE member SET emailcheck = 1 WHERE username = :username`,
      [username]
    );

    res.status(200).send('이메일 인증이 완료되었습니다.');
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      error: 'Error verifying email',
      details: err.message
    });
  }
});

// 로그인
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT username, password, email, emailcheck FROM member WHERE username = :username`,
      [username]
    );

    if (result.rows.length > 0) {
      const [dbUsername, dbPassword, dbEmail, emailCheck] = result.rows[0];
      if (verifyPassword(password, dbPassword)) {
        if (emailCheck === 1) {
          req.session.user = { username: dbUsername, email: dbEmail }; // 세션 설정
          res.status(200).json({ message: '로그인 성공', username: dbUsername, email: dbEmail });
        } else {
          res.status(401).send('이메일 인증이 완료되지 않았습니다.');
        }
      } else {
        res.status(401).send('잘못된 비밀번호입니다.');
      }
    } else {
      res.status(401).send('사용자를 찾을 수 없습니다.');
    }

    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      error: 'Error logging in',
      details: err.message
    });
  }
});

// 아이디 중복 확인
app.get('/check-username', async (req, res) => {
  const { username } = req.query;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT username FROM member WHERE username = :username`,
      [username]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ available: false });
    } else {
      res.status(200).json({ available: true });
    }

    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      error: 'Error checking username availability',
      details: err.message
    });
  }
});

// 사용자 인증 상태 확인 엔드포인트
app.get('/check-auth', async (req, res) => {
  if (req.session.user) {
    try {
      const connection = await oracledb.getConnection(dbConfig);
      const result = await connection.execute(
        'SELECT id, username, email, permission FROM MEMBER WHERE username = :username',
        { username: req.session.user.username },
        { userid: req.session.user.id },
      );

      await connection.close();

      if (result.rows.length > 0) {
        const user = result.rows[0];
        res.status(200).json({
          authenticated: true,
          user: {
            id: user[0],
            username: user[1],
            email: user[2],
            permission: user[3]
          }
        });
      } else {
        res.status(401).json({ authenticated: false });
      }
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Error checking auth status', details: err.message });
    }
  } else {
    res.status(401).json({ authenticated: false });
  }
});


// 게시글 목록 조회
app.get('/posts', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT id, username, title, content, created_at, views, likes 
       FROM board 
       WHERE deletecheck = 1 
       ORDER BY created_at DESC 
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { offset, limit }
    );

    // 결과 객체를 순환 참조가 없는 평범한 객체로 변환
    const posts = await Promise.all(result.rows.map(async (row) => {
      const content = await readClob(row[3]);
      return {
        id: row[0],
        username: row[1],
        title: row[2],
        content,
        created_at: row[4],
        views: row[5],
        likes: row[6]
      };
    }));

    res.json(posts);
    await connection.close();
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Error fetching posts', details: err.message });
  }
});

// 게시글 상세 조회
app.get('/posts/:id', async (req, res) => {
  const postId = req.params.id;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT id, username, title, content, created_at, views, likes 
       FROM board 
       WHERE id = :id`,
      { id: postId }
    );

    const post = result.rows[0];

    res.json({
      id: post[0],
      username: post[1],
      title: post[2],
      content: await readClob(post[3]),
      created_at: post[4],
      views: post[5],
      likes: post[6]
    });

    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching post', details: err.message });
  }
});

// 조회수 증가
app.post('/posts/:id/increment-views', async (req, res) => {
  const postId = req.params.id;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // 조회수 증가
    await connection.execute(
      `UPDATE board SET views = views + 1 WHERE id = :id`,
      { id: postId }
    );

    res.status(200).json({ message: 'Views incremented successfully' });
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error incrementing views', details: err.message });
  }
});

// 좋아요 증가
app.post('/posts/:id/like', authenticate, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const username = req.session.user.username;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // 사용자가 이미 좋아요를 눌렀는지 확인
    const likeCheckResult = await connection.execute(
      `SELECT * FROM post_likes WHERE post_id = :post_id AND user_id = :user_id`,
      { post_id: postId, user_id: username }
    );

    if (likeCheckResult.rows.length > 0) {
      res.status(400).json({ error: '이미 좋아요를 누른 게시글입니다.' });
      await connection.close();
      return;
    }

    // 좋아요 추가
    await connection.execute(
      `INSERT INTO post_likes (post_id, user_id) VALUES (:post_id, :user_id)`,
      { post_id: postId, user_id: username }
    );

    // 게시글의 좋아요 수 증가
    await connection.execute(
      `UPDATE board SET likes = likes + 1 WHERE id = :id`,
      { id: postId }
    );

    res.status(200).json({ message: 'Liked successfully' });
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error liking post', details: err.message });
  }
});

// 댓글 작성
app.post('/posts/:id/comments', authenticate, async (req, res) => {
  const postId = req.params.id;
  const username = req.session.user.username;
  const { content, parentId } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    const binds = {
      post_id: postId,
      user_id: username,
      content,
      parent_id: parentId ? parseInt(parentId, 10) : null
    };

    await connection.execute(
      `INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (:post_id, :user_id, :content, :parent_id)`,
      binds
    );

    res.status(201).json({ message: 'Comment added successfully' });
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error adding comment', details: err.message });
  }
});

// 댓글 조회
app.get('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT id, user_id, content, created_at, parent_id 
       FROM comments 
       WHERE post_id = :post_id 
       ORDER BY created_at ASC`,
      { post_id: postId }
    );

    const comments = await Promise.all(result.rows.map(async (row) => {
      const content = await readClob(row[2]);
      return {
        id: row[0],
        userId: row[1],
        content,
        createdAt: row[3],
        parentId: row[4]
      };
    }));

    res.json(comments);
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching comments', details: err.message });
  }
});

// 게시글 작성
app.post('/posts', authenticate, async (req, res) => {
  const { title, content } = req.body;
  const username = req.session.user.username;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO board (username, title, content) VALUES (:username, :title, :content)`,
      { username, title, content }
    );
    res.status(201).json({ message: 'Post created successfully' });
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error creating post' });
  }
});
// 게시글 수정
app.put('/posts/:id', authenticate, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { title, content } = req.body;
  const username = req.session.user.username;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE board SET title = :title, content = :content WHERE id = :id AND username = :username`,
      { title, content, id: postId, username }
    );

    if (result.rowsAffected === 0) {
      res.status(403).json({ error: 'You can only edit your own posts' });
    } else {
      res.status(200).json({ message: 'Post updated successfully' });
    }

    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error updating post', details: err.message });
  }
});

// 게시글 삭제
app.delete('/posts/:id', authenticate, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const username = req.session.user.username;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE board SET deletecheck = 0 WHERE id = :id AND username = :username`,
      { id: postId, username }
    );

    if (result.rowsAffected === 0) {
      res.status(403).json({ error: 'You can only delete your own posts' });
    } else {
      res.status(200).json({ message: 'Post deleted successfully' });
    }

    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error deleting post', details: err.message });
  }
});

// 게시글 소유 여부 확인
app.get('/posts/:id/owner', authenticate, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const username = req.session.user.username;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT COUNT(*) AS isOwner FROM board WHERE id = :id AND username = :username`,
      { id: postId, username }
    );

    const isOwner = result.rows[0][0] > 0;

    res.status(200).json({ isOwner });
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      error: 'Error checking ownership',
      details: err.message
    });
  }
});

// 사용자가 작성한 게시물 가져오기
app.get('/users/:username/posts', async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 5 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT id, title, created_at, views, likes, content
       FROM board
       WHERE username = :username
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { username, offset: parseInt(offset), limit: parseInt(limit) }
    );

    const posts = await Promise.all(result.rows.map(async (row) => ({
      id: row[0],
      title: row[1],
      created_at: row[2],
      views: row[3],
      likes: row[4],
      content: await readClob(row[5])
    })));

    await connection.close();
    res.status(200).json(posts);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching user posts', details: err.message });
  }
});

// 사용자가 작성한 댓글 가져오기
app.get('/users/:username/comments', async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 5 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT c.id, c.content, c.created_at, b.title AS post_title, b.id AS post_id
       FROM comments c 
       JOIN board b ON c.post_id = b.id 
       WHERE c.user_id = :username
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { username, offset: parseInt(offset), limit: parseInt(limit) }
    );

    const comments = await Promise.all(result.rows.map(async (row) => ({
      id: row[0],
      content: await readClob(row[1]),
      created_at: row[2],
      post_title: row[3],
      post_id: row[4]
    })));

    await connection.close();
    res.status(200).json(comments);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching user comments', details: err.message });
  }
});

// 사용자가 좋아요한 게시물 가져오기
app.get('/users/:username/likes', async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 5 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT b.id, b.title, b.username, b.created_at, b.views, b.likes, b.content
       FROM post_likes pl
       JOIN board b ON pl.post_id = b.id
       WHERE pl.user_id = :username
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { username, offset: parseInt(offset), limit: parseInt(limit) }
    );

    const likedPosts = await Promise.all(result.rows.map(async (row) => ({
      id: row[0],
      title: row[1],
      username: row[2],
      created_at: row[3],
      views: row[4],
      likes: row[5],
      content: await readClob(row[6])
    })));

    await connection.close();
    res.status(200).json(likedPosts);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching liked posts', details: err.message });
  }
});

// 유틸리티 함수: CLOB 데이터를 읽어 문자열로 변환
async function readClob(clob) {
  return new Promise((resolve, reject) => {
    if (clob === null) {
      resolve(null);
      return;
    }
    let data = '';
    clob.setEncoding('utf8');
    clob.on('data', chunk => {
      data += chunk;
    });
    clob.on('end', () => {
      resolve(data);
    });
    clob.on('error', err => {
      reject(err);
    });
  });
}

// 유저 프로필 이미지 경로 가져오기 엔드포인트
app.get('/users/:username/profile-image-path', async (req, res) => {
  const { username } = req.params;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT profile_image_path FROM MEMBER WHERE username = :username`,
      { username }
    );

    if (result.rows.length > 0) {
      res.status(200).json({ profileImagePath: result.rows[0][0] });
    } else {
      res.status(404).json({ error: 'User not found' });
    }

    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: '프로필 이미지 경로를 가져오는 중 오류가 발생했습니다.', details: err.message });
  }
});

// 유저 정보 가져오기 엔드포인트
app.get('/users/:username/profile', async (req, res) => {
  const { username } = req.params;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT email FROM MEMBER WHERE username = :username`,
      { username }
    );

    if (result.rows.length > 0) {
      res.status(200).json({ email: result.rows[0][0] });
    } else {
      res.status(404).json({ error: 'User not found' });
    }

    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: '유저 정보를 가져오는 중 오류가 발생했습니다.', details: err.message });
  }
});

// 프로필 이미지 업데이트 엔드포인트
app.post('/profile/update-image', upload.single('profileImage'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const profileImage = req.file;
  const userId = req.body.userId; // 수정된 부분: req.user._id 대신 req.body.userId 사용

  console.log('Received request to update profile image for userId:', userId);

  if (!profileImage) {
    return res.status(400).json({ error: '이미지를 업로드해주세요.' });
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const imagePath = profileImage.path;
    const result = await connection.execute(
      'UPDATE MEMBER SET profile_image_path = :imagePath WHERE id = :userId',
      { imagePath, userId },
      { autoCommit: true }
    );

    console.log('Update result:', result);

    await connection.close();
    res.status(200).json({ message: '프로필 이미지가 성공적으로 업데이트되었습니다.' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: '프로필 이미지 업데이트 중 오류가 발생했습니다.', details: err.message });
  }
});

//Vtuber 등록
app.post('/vtuber_register', upload.fields([{ name: 'vtProfileImage', maxCount: 1 }, { name: 'vtHeaderImage', maxCount: 1 }]), async (req, res) => {
  const { category, company, vtubername, gender, age, mbti, platform, role, birthday, debutdate, youtubelink, platformlink, xlink } = req.body;
  const vtProfileImage = req.files.vtProfileImage ? req.files.vtProfileImage[0].filename : null;
  const vtHeaderImage = req.files.vtHeaderImage ? req.files.vtHeaderImage[0].filename : null;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `INSERT INTO vtinfo (category, company, vtubername, gender, age, mbti, platform, role, birthday, debutdate, youtubelink, platformlink, xlink, profile_image, header_image) 
       VALUES (:category, :company, :vtubername, :gender, :age, :mbti, :platform, :role, :birthday, :debutdate, :youtubelink, :platformlink, :xlink, :profile_image, :header_image)`,
      { category, company, vtubername, gender, age, mbti, platform, role, birthday, debutdate, youtubelink, platformlink, xlink, profile_image: vtProfileImage, header_image: vtHeaderImage }
    );

    await connection.close();

    res.status(200).json({ message: 'Vtuber 등록이 완료되었습니다.' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Vtuber 등록 중 오류가 발생했습니다.', details: err.message });
  }
});

// vtinfo 정보를 가져오는 엔드포인트
app.get('/vtinfo', async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute('SELECT * FROM vtinfo');

    await connection.close();

    if (result.rows.length > 0) {
      const vtubers = result.rows.map(row => ({
        id: row[0],
        category: row[1],
        company: row[2],
        vtubername: row[3],
        gender: row[4],
        age: row[5],
        mbti: row[6],
        platform: row[7],
        role: row[8],
        profile_image: row[9],
        header_image: row[10],
        birthday: row[11],
        debutdate: row[12],
        youtubelink: row[13],
        platformlink: row[14],
        xlink: row[15]
      }));
      res.status(200).json(vtubers);
    } else {
      res.status(404).json({ message: 'No vtubers found' });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching vtubers', details: err.message });
  }
});

// 특정 vtuber 정보를 가져오는 엔드포인트
app.get('/vtinfo/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      'SELECT * FROM vtinfo WHERE id = :id',
      { id }
    );

    await connection.close();

    if (result.rows.length > 0) {
      const vtuber = result.rows[0];
      res.status(200).json({
        id: vtuber[0],
        category: vtuber[1],
        company: vtuber[2],
        vtubername: vtuber[3],
        gender: vtuber[4],
        age: vtuber[5],
        mbti: vtuber[6],
        platform: vtuber[7],
        role: vtuber[8],
        profile_image: vtuber[9],
        header_image: vtuber[10],
        birthday: vtuber[11],
        debutdate: vtuber[12],
        youtubelink: vtuber[13],
        platformlink: vtuber[14],
        xlink: vtuber[15]
      });
    } else {
      res.status(404).json({ message: 'Vtuber not found' });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching vtuber', details: err.message });
  }
});

//생일 데이터
app.get('/birthdays/:month', async (req, res) => {
  const { month } = req.params;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT VTUBERNAME, TO_CHAR(BIRTHDAY, 'MM-DD') AS BIRTHDAY, PROFILE_IMAGE
       FROM VTINFO
       WHERE TO_CHAR(BIRTHDAY, 'MM') = :month`,
      [month]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

app.post('/company_register', upload.fields([{ name: 'companyProfileImage', maxCount: 1 }, { name: 'companyHeaderImage', maxCount: 1 }]), async (req, res) => {
  const { companyName, companyTag, companyYoutubeLink, fanClub } = req.body;
  const companyProfileImage = req.files.companyProfileImage ? req.files.companyProfileImage[0].filename : null;
  const companyHeaderImage = req.files.companyHeaderImage ? req.files.companyHeaderImage[0].filename : null;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    await connection.execute(
      `INSERT INTO CompanyInfo (CompanyName, CompanyTag, CompanyYoutubeLink, FanClub, CompanyProfile, CompanyHeader) 
       VALUES (:companyName, :companyTag, :companyYoutubeLink, :fanClub, :companyProfileImage, :companyHeaderImage)`,
      { companyName, companyTag, companyYoutubeLink, fanClub, companyProfileImage, companyHeaderImage }
    );

    await connection.close();
    res.status(200).json({ message: 'Company registered successfully.' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error registering company', details: err.message });
  }
});

app.get('/company_info', async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute('SELECT * FROM CompanyInfo');

    await connection.close();

    if (result.rows.length > 0) {
      const companies = result.rows.map(row => ({
        id: row[0],
        companyName: row[1],
        companyTag: row[2],
        companyYoutubeLink: row[3],
        fanClub: row[4],
        companyProfile: row[5],
        companyHeader: row[6]
      }));
      res.status(200).json(companies);
    } else {
      res.status(404).json({ message: 'No companies found' });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching companies', details: err.message });
  }
});

app.get('/company_info/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const companyResult = await connection.execute(
      'SELECT * FROM CompanyInfo WHERE CompanyID = :id',
      { id }
    );

    if (companyResult.rows.length === 0) {
      res.status(404).json({ message: 'Company not found' });
      await connection.close();
      return;
    }

    const company = companyResult.rows[0];

    const membersResult = await connection.execute(
      'SELECT * FROM VtInfo WHERE Company = :companyName',
      { companyName: company[1] }
    );

    await connection.close();

    const members = membersResult.rows.map(row => ({
      id: row[0],
      vtubername: row[3],
      debutdate: row[12],
      profile_image: row[9]
    }));

    res.status(200).json({
      company: {
        id: company[0],
        companyName: company[1],
        companyTag: company[2],
        companyYoutubeLink: company[3],
        fanClub: company[4],
        companyProfile: company[5],
        companyHeader: company[6]
      },
      members
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching company details', details: err.message });
  }
});

// 팔로우 엔드포인트
app.post('/follow', authenticate, async (req, res) => {
  const { vtuberId } = req.body;
  const username = req.session.user.username;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // 팔로우 추가
    await connection.execute(
      `INSERT INTO follows (username, vtuber_id) VALUES (:username, :vtuber_id)`,
      { username, vtuber_id: vtuberId }
    );

    await connection.close();
    res.status(200).json({ message: '팔로우 성공' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: '팔로우 중 오류가 발생했습니다.', details: err.message });
  }
});

// 팔로우 상태 가져오기 엔드포인트
app.get('/follow_status', authenticate, async (req, res) => {
  const username = req.session.user.username;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT vtuber_id FROM follows WHERE username = :username`,
      { username }
    );

    const followStatus = result.rows.map(row => row[0]);

    await connection.close();
    res.status(200).json(followStatus);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: '팔로우 상태 조회 중 오류가 발생했습니다.', details: err.message });
  }
});

// 언팔로우 엔드포인트
app.post('/unfollow', authenticate, async (req, res) => {
  const { vtuberId } = req.body;
  const username = req.session.user.username;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // 팔로우 삭제
    await connection.execute(
      `DELETE FROM follows WHERE username = :username AND vtuber_id = :vtuber_id`,
      { username, vtuber_id: vtuberId }
    );

    await connection.close();
    res.status(200).json({ message: '언팔로우 성공' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: '언팔로우 중 오류가 발생했습니다.', details: err.message });
  }
});

// 팔로우 목록 조회 엔드포인트
app.get('/follows', authenticate, async (req, res) => {
  const username = req.session.user.username;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT v.*, 1 as isFollowing FROM follows f JOIN vtinfo v ON f.vtuber_id = v.id WHERE f.username = :username`,
      { username }
    );

    const follows = result.rows.map(row => ({
      id: row[0],
      category: row[1],
      company: row[2],
      vtubername: row[3],
      gender: row[4],
      age: row[5],
      mbti: row[6],
      platform: row[7],
      role: row[8],
      profile_image: row[9],
      header_image: row[10],
      birthday: row[11],
      debutdate: row[12],
      youtubelink: row[13],
      platformlink: row[14],
      xlink: row[15],
      isFollowing: row[16]
    }));

    await connection.close();
    res.status(200).json(follows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: '팔로우 목록 조회 중 오류가 발생했습니다.', details: err.message });
  }
});

// 랜덤 버튜버 가져오기 엔드포인트
app.get('/random-vtubers', async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT * FROM (
         SELECT * FROM vtinfo
         ORDER BY DBMS_RANDOM.RANDOM
       ) WHERE ROWNUM <= 5`
    );

    const vtubers = result.rows.map(row => ({
      id: row[0],
      category: row[1],
      company: row[2],
      vtubername: row[3],
      gender: row[4],
      age: row[5],
      mbti: row[6],
      platform: row[7],
      role: row[8],
      profile_image: row[9],
      header_image: row[10],
      birthday: row[11],
      debutdate: row[12],
      youtubelink: row[13],
      platformlink: row[14],
      xlink: row[15]
    }));

    res.status(200).json(vtubers);
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching random vtubers', details: err.message });
  }
});

//MBTI 궁합도 점수
const calculateMbtiCompatibility = (userMbti, vtuberMbti) => {
  const compatibilityMatrix = {
    'INTJ': { 'INTJ': 70, 'INTP': 80, 'ENTJ': 85, 'ENTP': 75, 'INFJ': 90, 'INFP': 85, 'ENFJ': 65, 'ENFP': 70, 'ISTJ': 60, 'ISFJ': 65, 'ESTJ': 55, 'ESFJ': 50, 'ISTP': 75, 'ISFP': 70, 'ESTP': 65, 'ESFP': 60 },
    'INTP': { 'INTJ': 80, 'INTP': 70, 'ENTJ': 75, 'ENTP': 85, 'INFJ': 75, 'INFP': 90, 'ENFJ': 65, 'ENFP': 70, 'ISTJ': 65, 'ISFJ': 60, 'ESTJ': 55, 'ESFJ': 50, 'ISTP': 80, 'ISFP': 75, 'ESTP': 70, 'ESFP': 65 },
    'ENTJ': { 'INTJ': 85, 'INTP': 75, 'ENTJ': 70, 'ENTP': 80, 'INFJ': 65, 'INFP': 60, 'ENFJ': 90, 'ENFP': 85, 'ISTJ': 80, 'ISFJ': 75, 'ESTJ': 85, 'ESFJ': 70, 'ISTP': 65, 'ISFP': 60, 'ESTP': 75, 'ESFP': 70 },
    'ENTP': { 'INTJ': 75, 'INTP': 85, 'ENTJ': 80, 'ENTP': 70, 'INFJ': 65, 'INFP': 70, 'ENFJ': 85, 'ENFP': 90, 'ISTJ': 55, 'ISFJ': 60, 'ESTJ': 70, 'ESFJ': 75, 'ISTP': 80, 'ISFP': 85, 'ESTP': 90, 'ESFP': 65 },
    'INFJ': { 'INTJ': 90, 'INTP': 75, 'ENTJ': 65, 'ENTP': 65, 'INFJ': 70, 'INFP': 80, 'ENFJ': 85, 'ENFP': 75, 'ISTJ': 80, 'ISFJ': 85, 'ESTJ': 55, 'ESFJ': 60, 'ISTP': 70, 'ISFP': 75, 'ESTP': 50, 'ESFP': 55 },
    'INFP': { 'INTJ': 85, 'INTP': 90, 'ENTJ': 60, 'ENTP': 70, 'INFJ': 80, 'INFP': 70, 'ENFJ': 75, 'ENFP': 85, 'ISTJ': 65, 'ISFJ': 70, 'ESTJ': 50, 'ESFJ': 55, 'ISTP': 75, 'ISFP': 80, 'ESTP': 65, 'ESFP': 60 },
    'ENFJ': { 'INTJ': 65, 'INTP': 65, 'ENTJ': 90, 'ENTP': 85, 'INFJ': 85, 'INFP': 75, 'ENFJ': 70, 'ENFP': 80, 'ISTJ': 70, 'ISFJ': 75, 'ESTJ': 85, 'ESFJ': 80, 'ISTP': 60, 'ISFP': 65, 'ESTP': 75, 'ESFP': 85 },
    'ENFP': { 'INTJ': 70, 'INTP': 70, 'ENTJ': 85, 'ENTP': 90, 'INFJ': 75, 'INFP': 85, 'ENFJ': 80, 'ENFP': 70, 'ISTJ': 50, 'ISFJ': 55, 'ESTJ': 75, 'ESFJ': 85, 'ISTP': 65, 'ISFP': 60, 'ESTP': 90, 'ESFP': 80 },
    'ISTJ': { 'INTJ': 60, 'INTP': 65, 'ENTJ': 80, 'ENTP': 55, 'INFJ': 80, 'INFP': 65, 'ENFJ': 70, 'ENFP': 50, 'ISTJ': 70, 'ISFJ': 85, 'ESTJ': 85, 'ESFJ': 75, 'ISTP': 60, 'ISFP': 65, 'ESTP': 75, 'ESFP': 80 },
    'ISFJ': { 'INTJ': 65, 'INTP': 60, 'ENTJ': 75, 'ENTP': 60, 'INFJ': 85, 'INFP': 70, 'ENFJ': 75, 'ENFP': 55, 'ISTJ': 85, 'ISFJ': 70, 'ESTJ': 75, 'ESFJ': 80, 'ISTP': 65, 'ISFP': 80, 'ESTP': 70, 'ESFP': 85 },
    'ESTJ': { 'INTJ': 55, 'INTP': 55, 'ENTJ': 85, 'ENTP': 70, 'INFJ': 55, 'INFP': 50, 'ENFJ': 85, 'ENFP': 75, 'ISTJ': 85, 'ISFJ': 75, 'ESTJ': 70, 'ESFJ': 65, 'ISTP': 75, 'ISFP': 70, 'ESTP': 90, 'ESFP': 80 },
    'ESFJ': { 'INTJ': 50, 'INTP': 50, 'ENTJ': 70, 'ENTP': 75, 'INFJ': 60, 'INFP': 55, 'ENFJ': 80, 'ENFP': 85, 'ISTJ': 75, 'ISFJ': 80, 'ESTJ': 65, 'ESFJ': 70, 'ISTP': 70, 'ISFP': 85, 'ESTP': 80, 'ESFP': 90 },
    'ISTP': { 'INTJ': 75, 'INTP': 80, 'ENTJ': 65, 'ENTP': 80, 'INFJ': 70, 'INFP': 75, 'ENFJ': 60, 'ENFP': 65, 'ISTJ': 60, 'ISFJ': 65, 'ESTJ': 75, 'ESFJ': 70, 'ISTP': 70, 'ISFP': 85, 'ESTP': 90, 'ESFP': 80 },
    'ISFP': { 'INTJ': 70, 'INTP': 75, 'ENTJ': 60, 'ENTP': 85, 'INFJ': 75, 'INFP': 80, 'ENFJ': 65, 'ENFP': 60, 'ISTJ': 65, 'ISFJ': 80, 'ESTJ': 70, 'ESFJ': 85, 'ISTP': 85, 'ISFP': 70, 'ESTP': 80, 'ESFP': 90 },
    'ESTP': { 'INTJ': 65, 'INTP': 70, 'ENTJ': 75, 'ENTP': 90, 'INFJ': 50, 'INFP': 65, 'ENFJ': 75, 'ENFP': 90, 'ISTJ': 75, 'ISFJ': 70, 'ESTJ': 90, 'ESFJ': 80, 'ISTP': 90, 'ISFP': 80, 'ESTP': 70, 'ESFP': 85 },
    'ESFP': { 'INTJ': 60, 'INTP': 65, 'ENTJ': 70, 'ENTP': 80, 'INFJ': 55, 'INFP': 60, 'ENFJ': 85, 'ENFP': 80, 'ISTJ': 80, 'ISFJ': 85, 'ESTJ': 80, 'ESFJ': 90, 'ISTP': 80, 'ISFP': 90, 'ESTP': 85, 'ESFP': 70 }
  };

  if (compatibilityMatrix[userMbti] && compatibilityMatrix[userMbti][vtuberMbti] !== undefined) {
    return compatibilityMatrix[userMbti][vtuberMbti];
  }
  return 50; // 기본 궁합 점수
};


app.get('/recommend-vtubers', authenticate, async (req, res) => {
  const username = req.session.user.username;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // 사용자의 정보 가져오기
    const userResult = await connection.execute(
      'SELECT gender, membermbti FROM member WHERE username = :username',
      { username }
    );

    if (userResult.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const userGender = userResult.rows[0][0];
    const userMbti = userResult.rows[0][1];

    // 사용자가 팔로우한 버튜버 목록 가져오기
    const followResult = await connection.execute(
      'SELECT vtuber_id FROM follows WHERE username = :username',
      { username }
    );

    const followedVtubers = followResult.rows.map(row => row[0]);

    // 나와 맞는 버튜버 추천 로직
    const vtuberResult = await connection.execute('SELECT id, gender, mbti, profile_image, vtubername FROM vtinfo');
    const vtubers = vtuberResult.rows.map(row => ({
      id: row[0],
      gender: row[1],
      mbti: row[2],
      profile_image: row[3],
      vtubername: row[4],
      compatibility: calculateMbtiCompatibility(userMbti, row[2])
    }));

    // 팔로우 여부 점수 추가
    vtubers.forEach(vtuber => {
      if (followedVtubers.includes(vtuber.id)) {
        vtuber.compatibility += 100; // 팔로우한 버튜버에게 추가 점수 부여
      }
    });

    // 성별 점수 추가
    vtubers.forEach(vtuber => {
      if (vtuber.gender !== userGender) {
        vtuber.compatibility += 10; // 성별이 다르면 추가 점수 부여
      }
    });

    // 이미 팔로우한 버튜버는 제외
    const filteredVtubers = vtubers.filter(vtuber => !followedVtubers.includes(vtuber.id));

    // 점수에 따라 정렬 후 상위 5명의 버튜버를 추천
    filteredVtubers.sort((a, b) => b.compatibility - a.compatibility);
    const recommendedVtubers = filteredVtubers.slice(0, 5);

    await connection.close();
    res.status(200).json(recommendedVtubers);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: '추천 버튜버 조회 중 오류가 발생했습니다.', details: err.message });
  }
});

app.get('/vtubers/count', async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute('SELECT COUNT(*) AS count FROM vtinfo');
    const count = result.rows[0][0];
    res.status(200).json({ count });
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch VTuber count' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});