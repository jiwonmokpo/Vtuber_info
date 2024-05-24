import React, { useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';

const ProfileUpdate = () => {
  const { auth } = useContext(AuthContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('프로필 이미지를 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', selectedFile);
    formData.append('userId', auth.user.id);
    
    try {
      const response = await axios.post('http://localhost:5000/profile/update-image', formData, {
        userId: auth.user.id, 
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      setSuccess(response.data.message);
    } catch (error) {
      console.error('Error updating profile image:', error);
      setError('프로필 이미지 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <h1>프로필 바꾸기</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>프로필 이미지 선택:</label>
          <input type="file" onChange={handleFileChange} />
        </div>
        <button type="submit">업로드</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default ProfileUpdate;