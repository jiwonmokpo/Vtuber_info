// src/pages/WritePost.js
import React, { useContext, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

const WritePost = () => {
  const { auth } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/posts', { title, content }, { withCredentials: true });
      navigate('/board');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div>
      <h1>글쓰기</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>작성자: {auth.user && auth.user.username}</label>
        </div>
        <div>
          <label>제목:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label>내용:</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}></textarea>
        </div>
        <button type="submit">작성</button>
      </form>
    </div>
  );
};

export default WritePost;