import React, { useState, useRef } from 'react';
import axios from 'axios';
import '../css/VtuberRegister.css';

const VtuberRegister = () => {
  const [formData, setFormData] = useState({
    category: '',
    company: '',
    vtubername: '',
    gender: '',
    age: '',
    mbti: '',
    platform: '',
    role: '맴버',
    birthday: '',
    debutdate: '',
    youtubelink: '',
    platformlink: '',
    xlink: ''
  });

  const [mbtiType, setMbtiType] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [headerImage, setHeaderImage] = useState(null);
  const profileFileInputRef = useRef(null);
  const headerFileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCategoryChange = (value) => {
    setFormData({
      ...formData,
      category: value
    });
  };

  const handleGenderChange = (value) => {
    setFormData({
      ...formData,
      gender: value
    });
  };

  const handleMbtiTypeChange = (type) => {
    setMbtiType(type);
  };

  const handleMbtiChange = (value) => {
    setFormData({
      ...formData,
      mbti: value
    });
  };

  const handlePlatformChange = (value) => {
    setFormData({
      ...formData,
      platform: value
    });
  };

  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      role: value
    });
  };

  const handleProfileFileChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  const handleHeaderFileChange = (e) => {
    setHeaderImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('category', formData.category);
    data.append('company', formData.company);
    data.append('vtubername', formData.vtubername);
    data.append('gender', formData.gender);
    data.append('age', formData.age);
    data.append('mbti', formData.mbti);
    data.append('platform', formData.platform);
    data.append('role', formData.role);
    data.append('birthday', formData.birthday);
    data.append('debutdate', formData.debutdate);
    data.append('youtubelink', formData.youtubelink);
    data.append('platformlink', formData.platformlink);
    data.append('xlink', formData.xlink);
    if (profileImage) {
      data.append('vtProfileImage', profileImage);
    }
    if (headerImage) {
      data.append('vtHeaderImage', headerImage);
    }

    try {
      const response = await axios.post('http://localhost:5000/vtuber_register', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      if (response.status === 200) {
        alert('버튜버 등록이 완료되었습니다.');
        setFormData({
          category: '',
          company: '',
          vtubername: '',
          gender: '',
          age: '',
          mbti: '',
          platform: '',
          role: '맴버',
          birthday: '',
          debutdate: '',
          youtubelink: '',
          platformlink: '',
          xlink: ''
        });
        setProfileImage(null);
        setHeaderImage(null);
        profileFileInputRef.current.value = '';
        headerFileInputRef.current.value = '';
      } else {
        alert('버튜버 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error registering Vtuber:', error);
      alert('버튜버 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="vtuber-register-container">
      <h1>버튜버 등록</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category:</label>
          <div className="button-group">
            <button type="button" onClick={() => handleCategoryChange('기업세')} className={formData.category === '기업세' ? 'active' : ''}>기업세</button>
            <button type="button" onClick={() => handleCategoryChange('개인세')} className={formData.category === '개인세' ? 'active' : ''}>개인세</button>
          </div>
        </div>
        <div className="form-group">
          <label>Company:</label>
          <input type="text" name="company" value={formData.company} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Vtuber Name:</label>
          <input type="text" name="vtubername" value={formData.vtubername} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Gender:</label>
          <div className="button-group">
            <button type="button" onClick={() => handleGenderChange('여성')} className={formData.gender === '여성' ? 'active' : ''}>여성</button>
            <button type="button" onClick={() => handleGenderChange('남성')} className={formData.gender === '남성' ? 'active' : ''}>남성</button>
          </div>
        </div>
        <div className="form-group">
          <label>Age:</label>
          <input type="number" name="age" value={formData.age} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Birthday:</label>
          <input type="text" name="birthday" value={formData.birthday} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Debut Date:</label>
          <input type="text" name="debutdate" value={formData.debutdate} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>YouTube Link:</label>
          <input type="text" name="youtubelink" value={formData.youtubelink} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Platform Link:</label>
          <input type="text" name="platformlink" value={formData.platformlink} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>X Link:</label>
          <input type="text" name="xlink" value={formData.xlink} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>MBTI:</label>
          <div className="button-group">
            <button type="button" onClick={() => handleMbtiTypeChange('외향형')} className={mbtiType === '외향형' ? 'active' : ''}>외향형</button>
            <button type="button" onClick={() => handleMbtiTypeChange('내향형')} className={mbtiType === '내향형' ? 'active' : ''}>내향형</button>
          </div>
          {mbtiType === '외향형' && (
            <div className="button-group">
              <button type="button" onClick={() => handleMbtiChange('ENFJ')} className={formData.mbti === 'ENFJ' ? 'active' : ''}>ENFJ</button>
              <button type="button" onClick={() => handleMbtiChange('ENFP')} className={formData.mbti === 'ENFP' ? 'active' : ''}>ENFP</button>
              <button type="button" onClick={() => handleMbtiChange('ENTJ')} className={formData.mbti === 'ENTJ' ? 'active' : ''}>ENTJ</button>
              <button type="button" onClick={() => handleMbtiChange('ENTP')} className={formData.mbti === 'ENTP' ? 'active' : ''}>ENTP</button>
              <button type="button" onClick={() => handleMbtiChange('ESFJ')} className={formData.mbti === 'ESFJ' ? 'active' : ''}>ESFJ</button>
              <button type="button" onClick={() => handleMbtiChange('ESFP')} className={formData.mbti === 'ESFP' ? 'active' : ''}>ESFP</button>
              <button type="button" onClick={() => handleMbtiChange('ESTJ')} className={formData.mbti === 'ESTJ' ? 'active' : ''}>ESTJ</button>
              <button type="button" onClick={() => handleMbtiChange('ESTP')} className={formData.mbti === 'ESTP' ? 'active' : ''}>ESTP</button>
            </div>
          )}
          {mbtiType === '내향형' && (
            <div className="button-group">
              <button type="button" onClick={() => handleMbtiChange('INTJ')} className={formData.mbti === 'INTJ' ? 'active' : ''}>INTJ</button>
              <button type="button" onClick={() => handleMbtiChange('INTP')} className={formData.mbti === 'INTP' ? 'active' : ''}>INTP</button>
              <button type="button" onClick={() => handleMbtiChange('INFJ')} className={formData.mbti === 'INFJ' ? 'active' : ''}>INFJ</button>
              <button type="button" onClick={() => handleMbtiChange('INFP')} className={formData.mbti === 'INFP' ? 'active' : ''}>INFP</button>
              <button type="button" onClick={() => handleMbtiChange('ISTJ')} className={formData.mbti === 'ISTJ' ? 'active' : ''}>ISTJ</button>
              <button type="button" onClick={() => handleMbtiChange('ISTP')} className={formData.mbti === 'ISTP' ? 'active' : ''}>ISTP</button>
              <button type="button" onClick={() => handleMbtiChange('ISFJ')} className={formData.mbti === 'ISFJ' ? 'active' : ''}>ISFJ</button>
              <button type="button" onClick={() => handleMbtiChange('ISFP')} className={formData.mbti === 'ISFP' ? 'active' : ''}>ISFP</button>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Platform:</label>
          <div className="button-group">
            <button type="button" onClick={() => handlePlatformChange('치지직')} className={formData.platform === '치지직' ? 'active' : ''}>치지직</button>
            <button type="button" onClick={() => handlePlatformChange('아프리카')} className={formData.platform === '아프리카' ? 'active' : ''}>아프리카</button>
          </div>
        </div>
        <div className="form-group">
          <label>Role:</label>
          <div className="button-group">
            <button type="button" onClick={() => handleRoleChange('맴버')} className={formData.role === '맴버' ? 'active' : ''}>맴버</button>
            <button type="button" onClick={() => handleRoleChange('스태프')} className={formData.role === '스태프' ? 'active' : ''}>스태프</button>
            <button type="button" onClick={() => handleRoleChange('사장')} className={formData.role === '사장' ? 'active' : ''}>사장</button>
          </div>
        </div>
        <div className="form-group">
          <label>Profile Image:</label>
          <input type="file" name="vtProfileImage" ref={profileFileInputRef} onChange={handleProfileFileChange} />
        </div>
        <div className="form-group">
          <label>Header Image:</label>
          <input type="file" name="vtHeaderImage" ref={headerFileInputRef} onChange={handleHeaderFileChange} />
        </div>
        <button type="submit">등록</button>
      </form>
    </div>
  );
};

export default VtuberRegister;
