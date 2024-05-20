const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const session = require('express-session');
const postsRouter = require('./routes/posts');

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
  saveUninitialized: true,
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

// 회원가입 엔드포인트
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

// 이메일 인증 엔드포인트
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

// 로그인 엔드포인트
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
          // 로그인 성공
          req.session.username = dbUsername; // 세션 설정
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

// 아이디 중복 확인 엔드포인트
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});