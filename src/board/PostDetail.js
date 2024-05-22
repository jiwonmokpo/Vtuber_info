import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../App';

const PostDetail = () => {
  const { id } = useParams();
  const { auth } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchPost();
    fetchComments();
    incrementViews(); // 첫 렌더링 시 조회수 증가
  }, [id]); // id가 변경될 때마다 호출

  const fetchPost = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };

  const incrementViews = async () => {
    try {
      await axios.post(`http://localhost:5000/posts/${id}/increment-views`);
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/posts/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/posts/${id}/comments`, { content: newComment }, { withCredentials: true });
      setNewComment('');
      fetchComments(); // Refresh comments after submission
    } catch (error) {
      console.error('Error adding comment:', error.response ? error.response.data : error.message);
    }
  };

  const handleLike = async () => {
    try {
      await axios.post(`http://localhost:5000/posts/${id}/like`, {}, { withCredentials: true });
      const updatedPost = { ...post, likes: post.likes + 1 };
      setPost(updatedPost); // Update the local state immediately
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <div>
      {post && (
        <div>
          <h1>{post.title}</h1>
          <p>{post.content}</p>
          <p>작성자: {post.username}</p>
          <p>작성일: {new Date(post.created_at).toLocaleString()}</p>
          <p>조회수: {post.views}</p>
          <p>추천수: {post.likes}</p>
          <button onClick={handleLike}>추천하기</button>
        </div>
      )}

      <div>
        <h2>댓글</h2>
        {comments.map((comment) => (
          <div key={comment.id}>
            <p>{comment.content}</p>
            <p>작성자: {comment.userId}</p>
            <p>작성일: {new Date(comment.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {auth.loggedIn && (
        <div>
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요"
            ></textarea>
            <button type="submit">댓글 작성</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
