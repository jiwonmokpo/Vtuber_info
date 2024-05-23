import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { FaHeart, FaCommentDots, FaReply, FaEdit, FaTrashAlt } from 'react-icons/fa';
import DOMPurify from 'dompurify';
// CSS 관련 import
import userIcon from '../image/user.png';
import '../css/PostDetail.css';

const PostDetail = () => {
  const { id } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyComment, setReplyComment] = useState({});
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
    incrementViews();
    checkOwnership();
  }, [id]);

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

  const checkOwnership = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/posts/${id}/owner`, { withCredentials: true });
      setIsOwner(response.data.isOwner);
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const handleCommentSubmit = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyComment[parentId] : newComment;
    try {
      await axios.post(`http://localhost:5000/posts/${id}/comments`, { content, parentId }, { withCredentials: true });
      setNewComment('');
      setReplyComment({ ...replyComment, [parentId]: '' });
      fetchComments();
      // 대댓글 작성 완료 후 폼 닫기
      if (parentId) {
        setReplyComment((prevState) => ({
          ...prevState,
          [parentId]: '',
          [`open-${parentId}`]: false,
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error.response ? error.response.data : error.message);
    }
  };

  const handleLike = async () => {
    try {
      await axios.post(`http://localhost:5000/posts/${id}/like`, {}, { withCredentials: true });
      const updatedPost = { ...post, likes: post.likes + 1 };
      setPost(updatedPost);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.error);
      } else {
        console.error('Error liking post:', error);
      }
    }
  };

  const handleEdit = () => {
    navigate(`/edit-post/${id}`);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/posts/${id}`, { withCredentials: true });
      alert('게시글이 삭제되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const toggleReply = (commentId) => {
    setReplyComment((prevState) => ({
      ...prevState,
      [`open-${commentId}`]: !prevState[`open-${commentId}`],
    }));
  };

  const handleReplyChange = (e, commentId) => {
    setReplyComment({ ...replyComment, [commentId]: e.target.value });
  };

  const renderComments = (comments, parentId = null) => {
    return comments
      .filter(comment => comment.parentId === parentId)
      .map(comment => (
        <div key={comment.id} className="comment" style={{ marginLeft: parentId ? '40px' : '0px' }}>
          <img src={userIcon} alt="User" className="comment-user-image" />
          <div className="comment-content">
            <span>{comment.userId}</span>
            <p>{comment.content}</p>
            <div className="comment-actions">
              <span>{new Date(comment.createdAt).toLocaleString()}</span>
              {auth.loggedIn && (
                <button onClick={() => toggleReply(comment.id)} className="reply-button">
                  <FaReply /> 답글쓰기
                </button>
              )}
            </div>
            {replyComment[`open-${comment.id}`] && (
              <form onSubmit={(e) => handleCommentSubmit(e, comment.id)} className="reply-form">
                <textarea
                  value={replyComment[comment.id]}
                  onChange={(e) => handleReplyChange(e, comment.id)}
                  placeholder="답글을 입력하세요"
                ></textarea>
                <button type="submit">답글 작성</button>
              </form>
            )}
            {renderComments(comments, comment.id)}
          </div>
        </div>
      ));
  };

  return (
    <div className="post-detail">
      {post && (
        <>
          <div className="post-header">
            <img src={userIcon} alt="User" />
            <div className="post-user-info">
              <span>{post.username}</span>
              <span>{new Date(post.created_at).toLocaleString()}</span>
            </div>
          </div>
          <div className="post-content">
            <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}></p>
          </div>
          <div className="post-actions">
            <span><FaCommentDots /> 조회수: {post.views}</span>
            <span><FaHeart /> 추천수: {post.likes}</span>
            <button onClick={handleLike} className="like-button"><FaHeart /> 좋아요</button>
            {isOwner && (
              <>
                <button onClick={handleEdit} className="edit-button"><FaEdit /> 수정</button>
                <button onClick={handleDelete} className="delete-button"><FaTrashAlt /> 삭제</button>
              </>
            )}
          </div>
        </>
      )}

      <div className="comments">
        <h2>댓글</h2>
        {renderComments(comments)}
      </div>

      {auth.loggedIn && (
        <form onSubmit={(e) => handleCommentSubmit(e)}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="comment-textarea"
          ></textarea>
          <button type="submit" className="comment-submit-button">댓글 작성</button>
        </form>
      )}
    </div>
  );
};

export default PostDetail;