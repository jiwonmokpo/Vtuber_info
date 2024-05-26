import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { Link } from 'react-router-dom';
import '../css/MyPage.css';
import userIcon from '../image/user.png';

const MyPage = () => {
  const { auth, dispatch } = useContext(AuthContext);
  const [userPosts, setUserPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [postPage, setPostPage] = useState(1);
  const [commentPage, setCommentPage] = useState(1);
  const [likePage, setLikePage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [hasMoreLikes, setHasMoreLikes] = useState(true);
  const [profileImagePath, setProfileImagePath] = useState('');
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (auth.user) {
      fetchUserPosts(postPage);
      fetchUserComments(commentPage);
      fetchLikedPosts(likePage);
      fetchProfileImagePath();
    }
  }, [auth.user, postPage, commentPage, likePage]);

  const fetchUserPosts = async (page) => {
    try {
      const response = await axios.get(`http://localhost:5000/users/${auth.user.username}/posts`, {
        params: { page, limit: 5 },
        withCredentials: true
      });
      setUserPosts(response.data);
      setHasMorePosts(response.data.length === 5);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setUserPosts([]);
    }
  };

  const fetchUserComments = async (page) => {
    try {
      const response = await axios.get(`http://localhost:5000/users/${auth.user.username}/comments`, {
        params: { page, limit: 5 },
        withCredentials: true
      });
      setUserComments(response.data);
      setHasMoreComments(response.data.length === 5);
    } catch (error) {
      console.error('Error fetching user comments:', error);
      setUserComments([]);
    }
  };

  const fetchLikedPosts = async (page) => {
    try {
      const response = await axios.get(`http://localhost:5000/users/${auth.user.username}/likes`, {
        params: { page, limit: 5 },
        withCredentials: true
      });
      setLikedPosts(response.data);
      setHasMoreLikes(response.data.length === 5);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      setLikedPosts([]);
    }
  };

  const fetchProfileImagePath = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/users/${auth.user.username}/profile-image-path`, {
        withCredentials: true
      });
      setProfileImagePath(response.data.profileImagePath);
    } catch (error) {
      console.error('Error fetching profile image path:', error);
      setProfileImagePath('');
    }
  };

  const handleFileChange = (event) => {
    setIsImageUploaded(true);
  };

  const updateUserProfileImage = async (file) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    return await axios.post('http://localhost:5000/profile/update-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true
    });
  };

  const handleAddProfileImgSubmit = async (event) => {
    event.preventDefault();

    try {
      if (isImageUploaded) {
        const file = fileInputRef.current.files[0];
        const response = await updateUserProfileImage(file);
        console.log(response.data);
        fetchProfileImagePath(); // 상태를 업데이트하여 프로필 이미지 경로를 다시 가져옴
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (!auth.user) {
    return <div>Loading...</div>;
  }

  const profileImage = profileImagePath ? `http://localhost:5000/uploads/${profileImagePath.split('\\').pop()}` : userIcon;

  return (
    <div className="mypage-container">
      <div className="sidebar-mypage">
        <img src={profileImage} alt="User" className="user-icon" />
        <h2>{auth.user.username}</h2>
        <p>{auth.user.email}</p>
        <div className="sidebar-menu">
          <Link to="/profile/update"><p>프로필 바꾸기</p></Link>
        </div>
      </div>
      <div className="content">
        <div className="content-section">
          <h2>작성한 글</h2>
          <table className="table">
            <thead>
              <tr>
                <th>제목</th>
                <th>작성일</th>
                <th>조회수</th>
                <th>추천수</th>
              </tr>
            </thead>
            <tbody>
              {userPosts && userPosts.length > 0 ? (
                userPosts.map(post => (
                  <tr key={post.id}>
                    <td><Link to={`/posts/${post.id}`}>{post.title}</Link></td>
                    <td>{new Date(post.created_at).toLocaleString()}</td>
                    <td>{post.views}</td>
                    <td>{post.likes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">작성한 글이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="pagination">
            <button disabled={postPage === 1} onClick={() => setPostPage(postPage - 1)}>이전</button>
            <button disabled={!hasMorePosts} onClick={() => setPostPage(postPage + 1)}>다음</button>
          </div>
        </div>
        <div className="content-section">
          <h2>작성한 댓글</h2>
          <table className="table">
            <thead>
              <tr>
                <th>댓글 내용</th>
                <th>작성일</th>
              </tr>
            </thead>
            <tbody>
              {userComments && userComments.length > 0 ? (
                userComments.map(comment => (
                  <tr key={comment.id}>
                    <td><Link to={`/posts/${comment.post_id}#${comment.id}`}>{comment.content}</Link></td>
                    <td>{new Date(comment.created_at).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">작성한 댓글이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="pagination">
            <button disabled={commentPage === 1} onClick={() => setCommentPage(commentPage - 1)}>이전</button>
            <button disabled={!hasMoreComments} onClick={() => setCommentPage(commentPage + 1)}>다음</button>
          </div>
        </div>
        <div className="content-section">
          <h2>좋아요 누른 글</h2>
          <table className="table">
            <thead>
              <tr>
                <th>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th>조회수</th>
                <th>추천수</th>
              </tr>
            </thead>
            <tbody>
              {likedPosts && likedPosts.length > 0 ? (
                likedPosts.map(post => (
                  <tr key={post.id}>
                    <td><Link to={`/posts/${post.id}`}>{post.title}</Link></td>
                    <td>{post.username}</td>
                    <td>{new Date(post.created_at).toLocaleString()}</td>
                    <td>{post.views}</td>
                    <td>{post.likes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">좋아요 누른 글이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="pagination">
            <button disabled={likePage === 1} onClick={() => setLikePage(likePage - 1)}>이전</button>
            <button disabled={!hasMoreLikes} onClick={() => setLikePage(likePage + 1)}>다음</button>
          </div>
        </div>
        <div className="content-section" style={{ display: 'none' }}>
          <h2>프로필 사진 변경</h2>
          <form onSubmit={handleAddProfileImgSubmit}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} />
            <button type="submit">프로필 사진 업로드</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyPage;