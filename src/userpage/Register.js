import React, { useState } from 'react';
import axios from 'axios';
import '../css/Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [membermbti, setMemberMbti] = useState('');
  const [error, setError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [mbtiType, setMbtiType] = useState('');

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

  const handleGenderChange = (value) => {
    setGender(value);
  };

  const handleMbtiTypeChange = (type) => {
    setMbtiType(prevType => (prevType === type ? '' : type));
    setMemberMbti('');
  };

  const handleMbtiChange = (value) => {
    setMemberMbti(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !email || !gender || !membermbti) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/register', {
        username,
        password,
        email,
        gender,
        membermbti
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
          <label>아이디</label>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            onBlur={handleUsernameBlur}
          />
          {isCheckingUsername && <span>확인 중...</span>}
        </div>
        <div>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>성별</label>
          <div className="button-group horizontal">
            <button type="button" onClick={() => handleGenderChange('남성')} className={gender === '남성' ? 'active' : ''}>남성</button>
            <button type="button" onClick={() => handleGenderChange('여성')} className={gender === '여성' ? 'active' : ''}>여성</button>
          </div>
        </div>
        <div>
          <label>MBTI</label>
          <div className="button-group horizontal">
            <button type="button" onClick={() => handleMbtiTypeChange('E')} className={mbtiType === 'E' ? 'active' : ''}>E</button>
            <button type="button" onClick={() => handleMbtiTypeChange('I')} className={mbtiType === 'I' ? 'active' : ''}>I</button>
          </div>
          {mbtiType === 'E' && (
            <div className="button-group vertical">
              <button type="button" onClick={() => handleMbtiChange('ENFJ')} className={membermbti === 'ENFJ' ? 'active' : ''}>ENFJ</button>
              <button type="button" onClick={() => handleMbtiChange('ENFP')} className={membermbti === 'ENFP' ? 'active' : ''}>ENFP</button>
              <button type="button" onClick={() => handleMbtiChange('ENTJ')} className={membermbti === 'ENTJ' ? 'active' : ''}>ENTJ</button>
              <button type="button" onClick={() => handleMbtiChange('ENTP')} className={membermbti === 'ENTP' ? 'active' : ''}>ENTP</button>
              <button type="button" onClick={() => handleMbtiChange('ESFJ')} className={membermbti === 'ESFJ' ? 'active' : ''}>ESFJ</button>
              <button type="button" onClick={() => handleMbtiChange('ESFP')} className={membermbti === 'ESFP' ? 'active' : ''}>ESFP</button>
              <button type="button" onClick={() => handleMbtiChange('ESTJ')} className={membermbti === 'ESTJ' ? 'active' : ''}>ESTJ</button>
              <button type="button" onClick={() => handleMbtiChange('ESTP')} className={membermbti === 'ESTP' ? 'active' : ''}>ESTP</button>
            </div>
          )}
          {mbtiType === 'I' && (
            <div className="button-group vertical">
              <button type="button" onClick={() => handleMbtiChange('INFJ')} className={membermbti === 'INFJ' ? 'active' : ''}>INFJ</button>
              <button type="button" onClick={() => handleMbtiChange('INFP')} className={membermbti === 'INFP' ? 'active' : ''}>INFP</button>
              <button type="button" onClick={() => handleMbtiChange('INTJ')} className={membermbti === 'INTJ' ? 'active' : ''}>INTJ</button>
              <button type="button" onClick={() => handleMbtiChange('INTP')} className={membermbti === 'INTP' ? 'active' : ''}>INTP</button>
              <button type="button" onClick={() => handleMbtiChange('ISFJ')} className={membermbti === 'ISFJ' ? 'active' : ''}>ISFJ</button>
              <button type="button" onClick={() => handleMbtiChange('ISFP')} className={membermbti === 'ISFP' ? 'active' : ''}>ISFP</button>
              <button type="button" onClick={() => handleMbtiChange('ISTJ')} className={membermbti === 'ISTJ' ? 'active' : ''}>ISTJ</button>
              <button type="button" onClick={() => handleMbtiChange('ISTP')} className={membermbti === 'ISTP' ? 'active' : ''}>ISTP</button>
            </div>
          )}
        </div>
        <button type="submit">회원가입</button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Register;
