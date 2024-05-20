const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const cors = require('cors');
require('dotenv').config();

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
  connectString: 'localhost:1521/xe'  // xe가 서비스 이름인 경우
};

oracledb.autoCommit = true;

app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO member (username, password, email) VALUES (:username, :password, :email)`,
      [username, password, email]
    );
    res.status(200).send('User registered successfully');
    await connection.close();
  } catch (err) {
    console.error('Database error:', err); // 더 자세한 오류 메시지 출력
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
      `SELECT * FROM member WHERE username = :username AND password = :password`,
      [username, password]
    );

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
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
