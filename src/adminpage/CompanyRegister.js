import React, { useState, useRef } from 'react';
import axios from 'axios';

const CompanyRegister = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyTag: '',
    companyYoutubeLink: '',
    fanClub: '',
  });

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

  const handleProfileFileChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  const handleHeaderFileChange = (e) => {
    setHeaderImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('companyName', formData.companyName);
    data.append('companyTag', formData.companyTag);
    data.append('companyYoutubeLink', formData.companyYoutubeLink);
    data.append('fanClub', formData.fanClub);
    if (profileImage) {
      data.append('companyProfileImage', profileImage);
    }
    if (headerImage) {
      data.append('companyHeaderImage', headerImage);
    }

    try {
      const response = await axios.post('http://localhost:5000/company_register', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      if (response.status === 200) {
        alert('기업 등록이 완료되었습니다.');
        setFormData({
          companyName: '',
          companyTag: '',
          companyYoutubeLink: '',
          fanClub: '',
        });
        setProfileImage(null);
        setHeaderImage(null);
        profileFileInputRef.current.value = '';
        headerFileInputRef.current.value = '';
      } else {
        alert('기업 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error registering company:', error);
      alert('기업 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="company-register-container">
      <h1>기업 등록</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>기업 이름:</label>
          <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>기업 태그:</label>
          <input type="text" name="companyTag" value={formData.companyTag} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>유튜브 링크:</label>
          <input type="text" name="companyYoutubeLink" value={formData.companyYoutubeLink} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>팬클럽:</label>
          <input type="text" name="fanClub" value={formData.fanClub} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>기업 프로필 이미지:</label>
          <input type="file" name="companyProfileImage" ref={profileFileInputRef} onChange={handleProfileFileChange} />
        </div>
        <div className="form-group">
          <label>기업 헤더 이미지:</label>
          <input type="file" name="companyHeaderImage" ref={headerFileInputRef} onChange={handleHeaderFileChange} />
        </div>
        <button type="submit">등록</button>
      </form>
    </div>
  );
};

export default CompanyRegister;
