import React, { useState } from 'react';
import axios from 'axios';
import '../css/Register.css'; // CSS 파일 임포트

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    setError('');
  };

  const handleUsernameBlur = async () => {
    if (!username) return;
    setIsCheckingUsername(true);
    try {
      const response = await axios.get(`http://localhost:5000/check-username?username=${username}`);
      if (!response.data.available) {
        setError('이미 사용 중인 아이디입니다.');
      }
    } catch (error) {
      console.error('Error while checking username:', error);
      setError('아이디 확인 중 오류가 발생했습니다.');
    }
    setIsCheckingUsername(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !email) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/register', {
        username,
        password,
        email
      });
      alert(response.data);
    } catch (error) {
      console.error('There was an error!', error);
      setError(error.response?.data?.details || '사용자 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="register-container">
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            onBlur={handleUsernameBlur}
          />
          {isCheckingUsername && <span>확인 중...</span>}
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit">회원가입</button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Register;
