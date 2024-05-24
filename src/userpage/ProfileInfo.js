import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';

const ProfileInfo = () => {
  const { auth } = useContext(AuthContext);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (auth.user) {
      fetchUserInfo();
    }
  }, [auth.user]);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/users/${auth.user.username}/profile`);
      setEmail(response.data.email);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!newUsername) {
      setMessage('아이디를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/profile/update-info', {
        userId: auth.user.id,
        newUsername
      });
      setMessage(response.data.message);
    } catch (error) {
      console.error('Error updating username:', error);
      setMessage('아이디 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setMessage('비밀번호를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/profile/update-info', {
        userId: auth.user.id,
        newPassword
      });
      setMessage(response.data.message);
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage('비밀번호 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <h1>내 정보</h1>
      <p>아이디: {auth.user.username}</p>
      <p>이메일: {email}</p>

      <div>
        <button onClick={() => setIsEditingUsername(!isEditingUsername)}>아이디 변경</button>
        {isEditingUsername && (
          <form onSubmit={handleUsernameSubmit}>
            <div>
              <label>새 아이디:</label>
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            </div>
            <button type="submit">아이디 변경</button>
          </form>
        )}
      </div>

      <div>
        <button onClick={() => setIsEditingPassword(!isEditingPassword)}>비밀번호 변경</button>
        {isEditingPassword && (
          <form onSubmit={handlePasswordSubmit}>
            <div>
              <label>새 비밀번호:</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <button type="submit">비밀번호 변경</button>
          </form>
        )}
      </div>

      {message && <p>{message}</p>}
    </div>
  );
};

export default ProfileInfo;
