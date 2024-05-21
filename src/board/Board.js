import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Board = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    axios.get(`http://localhost:5000/posts?page=${page}`)
      .then(response => {
        setPosts(response.data);
      })
      .catch(error => {
        console.error('Error fetching posts:', error);
      });
  }, [page]);

  return (
    <div>
      <h2>글 목록</h2>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <Link to={`/post/${post.id}`}>{post.title}</Link>
          </li>
        ))}
      </ul>
      <div>
        <button onClick={() => setPage(prevPage => prevPage - 1)}>이전 페이지</button>
        <button onClick={() => setPage(prevPage => prevPage + 1)}>다음 페이지</button>
      </div>
      <Link to="/write">글쓰기</Link>
    </div>
  );
};

export default Board;
