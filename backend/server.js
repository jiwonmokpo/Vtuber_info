const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const session = require('express-session');
require('dotenv').config();

const app = express();
const port = 5000;

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
  cookie: { secure: false } // In production, set to true if using https
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

// 유틸리티 함수: CLOB 데이터를 읽어 문자열로 변환
const readClob = async (clob) => {
  return new Promise((resolve, reject) => {
    let clobData = '';
    clob.setEncoding('utf8');

    clob.on('data', (chunk) => {
      clobData += chunk;
    });

    clob.on('end', () => {
      resolve(clobData);
    });

    clob.on('error', (err) => {
      reject(err);
    });
  });
};

// 회원가입
app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

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
      `INSERT INTO member (username, password, email, emailcheck) VALUES (:username, :password, :email, 0)`,
      [username, hashedPassword, email]
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

// 사용자 인증 상태 확인
app.get('/check-auth', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ authenticated: true, user: req.session.user });
  } else {
    res.status(200).json({ authenticated: false });
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
      `SELECT id, username, title, content, created_at 
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
        created_at: row[4]
      };
    }));

    res.json(posts);
    await connection.close();
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Error fetching posts', details: err.message });
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

// 게시글 삭제
app.delete('/posts/:id', authenticate, async (req, res) => {
  const postId = req.params.id;
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
    res.status(500).json({ error: 'Error deleting post' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
