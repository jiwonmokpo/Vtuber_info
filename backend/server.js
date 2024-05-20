const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto'); // crypto 모듈 추가

const app = express();
const port = 5000;

app.use(bodyParser.json());

// CORS 미들웨어 설정
app.use(cors({
  origin: 'http://localhost:3000', // React 앱의 주소
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));

// 오라클 데이터베이스 연결 설정
const dbConfig = {
  user: 'vtuber',
  password: '0000',
  connectString: 'localhost:1521/xe' // xe가 서비스 이름인 경우
};

oracledb.autoCommit = true;

// 비밀번호를 솔트와 함께 해시화하는 함수
const hashPassword = (password, salt) => {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

// 솔트 생성 함수
const generateSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

// 비밀번호와 솔트를 함께 저장하는 함수
const createPasswordHash = (password) => {
  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);
  return `${salt}$${hashedPassword}`;
};

// 저장된 비밀번호를 검증하는 함수
const verifyPassword = (password, storedHash) => {
  const [salt, hash] = storedHash.split('$');
  const inputHash = hashPassword(password, salt);
  return inputHash === hash;
};

app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const hashedPassword = createPasswordHash(password); // 비밀번호 해시화

    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO member (username, password, email) VALUES (:username, :password, :email)`,
      [username, hashedPassword, email] // 해시화된 비밀번호 사용
    );
    res.status(200).send('User registered successfully');
    await connection.close();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      error: 'Error registering user',
      details: err.message
    });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT username, password, email FROM member WHERE username = :username`,
      [username]
    );

    if (result.rows.length > 0) {
      const [dbUsername, dbPassword, dbEmail] = result.rows[0];
      if (verifyPassword(password, dbPassword)) {
        res.status(200).json({ username: dbUsername, email: dbEmail });
      } else {
        res.status(401).send('Invalid credentials');
      }
    } else {
      res.status(401).send('Invalid credentials');
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
