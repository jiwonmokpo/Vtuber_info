const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');

const app = express();
const port = 5000;

app.use(bodyParser.json());

app.use(cors({
  origin: 'http://localhost:3000', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));

const dbConfig = {
  user: 'vtuber',
  password: '0000',
  connectString: 'localhost:1521/xe'
};

oracledb.autoCommit = true;

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

app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const hashedPassword = createPasswordHash(password);

    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO member (username, password, email) VALUES (:username, :password, :email)`,
      [username, hashedPassword, email]
    );
    res.status(200).send('회원가입에 성공했습니다.');
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
