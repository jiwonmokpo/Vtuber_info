import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import '../css/Board.css';  

const Board = () => {
  const { auth } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/posts?page=${page}`);
      if (response.data.length < 10) {
        setHasMore(false);
      }
      setPosts((prevPosts) => {
        const newPosts = response.data.filter(
          (newPost) => !prevPosts.some((post) => post.id === newPost.id)
        );
        return [...prevPosts, ...newPosts];
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`http://localhost:5000/posts/${postId}`, { withCredentials: true });
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <div className="container">
      <div className="bbsheader">
        <h1>게시판</h1>
        {auth.loggedIn && (
          <div className="write-button">
            <Link to="/write">글쓰기</Link>
          </div>
        )}
      </div>
      <div>
        {posts.map((post) => (
          <div key={post.id} className="post">
            <div className="post-header">
              <h2>
                <Link to={`/posts/${post.id}`}>{post.title}</Link>
              </h2>
              <div className="post-info">
                <span className="author">{post.username}</span>
                <span className="date">{new Date(post.created_at).toLocaleString()}</span>
              </div>
            </div>
            <p>{post.content}</p>
            {auth.user && auth.user.username === post.username && (
              <>
                {/* Add edit and delete buttons here */}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="pagination">
        {page > 1 && <button onClick={() => setPage(page - 1)}>이전</button>}
        {hasMore && <button onClick={() => setPage(page + 1)}>다음</button>}
      </div>
    </div>
  );
};

export default Board;
