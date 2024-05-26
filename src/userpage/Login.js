import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { Navigate } from 'react-router-dom';
import '../css/Login.css'; // CSS 파일 import

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState('');
  const { setAuth, checkAuth  } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', { username, password }, { withCredentials: true });
      if (response.status === 200) {
        await checkAuth();
        setAuth({ loggedIn: true, user: response.data });
        setRedirect(true);
      } else {
        console.error('Login failed:', response.data);
        setError('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid credentials');
    }
  };

  if (redirect) {
    return (
      <Navigate
        to="/"
        replace={true}
        state={{ from: 'login' }}
      />
    );
  }

  return (
    <div className="login-container">
      <h1>로그인</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit">로그인</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
};

export default Login;
