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
  const [follows, setFollows] = useState([]);
  const [postPage, setPostPage] = useState(1);
  const [commentPage, setCommentPage] = useState(1);
  const [likePage, setLikePage] = useState(1);
  const [followPage, setFollowPage] = useState(1);
  const [showFollows, setShowFollows] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [hasMoreLikes, setHasMoreLikes] = useState(true);
  const [hasMoreFollows, setHasMoreFollows] = useState(true);
  const [profileImagePath, setProfileImagePath] = useState('');
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (auth.user) {
      fetchUserPosts(postPage);
      fetchUserComments(commentPage);
      fetchLikedPosts(likePage);
      fetchFollows(followPage);
      fetchProfileImagePath();
    }
  }, [auth.user, postPage, commentPage, likePage, followPage]);

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

  const fetchFollows = async (page) => {
    try {
      const response = await axios.get('http://localhost:5000/follows', {
        withCredentials: true
      });
      setFollows(response.data);
      setHasMoreFollows(response.data.length === 5);
    } catch (error) {
      console.error('Error fetching follows:', error);
      setFollows([]);
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

  const handleFollow = async (vtuberId, isFollowing) => {
    try {
      if (isFollowing) {
        await axios.post('http://localhost:5000/unfollow', { vtuberId }, { withCredentials: true });
      } else {
        await axios.post('http://localhost:5000/follow', { vtuberId }, { withCredentials: true });
      }
      // Fetch follows again to update the follow status
      fetchFollows(followPage);
    } catch (error) {
      console.error('Error updating follow status:', error);
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
          <p onClick={() => setShowFollows(false)}>최근 작성글</p>
          <p onClick={() => setShowFollows(true)}>팔로우 목록</p>
        </div>
      </div>
      <div className="content">
        {!showFollows && (
          <>
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
                      <td colSpan="2">작성한 댓글이 없습니다.</td>
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
          </>
        )}
        {showFollows && (
          <div className="content-section">
            <h2>팔로우 목록</h2>
            <div className="vtuber-list">
              {follows.map(vtuber => (
                <div className="vtuber-card-container" key={vtuber.id}>
                  <Link to={`/vtuber/${vtuber.id}`} className="vtuber-card">
                    <img src={`http://localhost:5000/uploads/${vtuber.profile_image}`} alt={vtuber.vtubername} />
                    <div className="vtuber-info">
                      {vtuber.category === '기업세' && <p className="company">{vtuber.company}</p>}
                      <h2>{vtuber.vtubername}</h2>
                      <div className="vttags">
                        <span className={`tag ${vtuber.gender === '여성' ? 'vt_female' : 'vt_male'}`}>#{vtuber.gender}</span>
                        <span className={`tag ${vtuber.category === '기업세' ? 'vt_corporate' : 'vt_individual'}`}>#{vtuber.category}</span>
                      </div>
                    </div>
                  </Link>
                  <button
                    className={`vt-follow-button ${vtuber.isFollowing ? 'active' : ''}`}
                    onClick={() => handleFollow(vtuber.id, vtuber.isFollowing)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;