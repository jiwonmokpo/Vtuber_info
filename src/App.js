import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, } from 'react-router-dom';
import axios from 'axios';
import Home from './userpage/Home';
import Login from './userpage/Login';
import Register from './userpage/Register';
import MyPage from './userpage/MyPage';
import ProfileUpdate from './userpage/ProfileUpdate';
import Board from './board/Board';
import WritePost from './board/WritePost';
import PostDetail from './board/PostDetail';
import EditPost from './board/EditPost';
import VtuberRegister from './adminpage/VtuberRegister';
import VtSoloBoard from './board_vt/vt_solo_board';
import VtuberDetail from './board_vt/VtuberDetail';

// CSS
import './css/App.css';
import userIcon from './image/user.png';

export const AuthContext = createContext();

function App() {
  const [auth, setAuth] = useState({ loggedIn: false, user: null });
  const [profileImagePath, setProfileImagePath] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/check-auth', { withCredentials: true });
        if (response.data.authenticated) {
          setAuth({ loggedIn: true, user: response.data.user });
          fetchProfileImagePath(response.data.user.username);
        } else {
          setAuth({ loggedIn: false, user: null });
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };
    useEffect(() => {
    checkAuth();
  }, []);

  const fetchProfileImagePath = async (username) => {
    try {
      const response = await axios.get(`http://localhost:5000/users/${username}/profile-image-path`, {
        withCredentials: true
      });
      setProfileImagePath(response.data.profileImagePath);
    } catch (error) {
      console.error('Error fetching profile image path:', error);
      setProfileImagePath('');
    }
  };

  const profileImage = profileImagePath ? `http://localhost:5000/uploads/${profileImagePath.split('\\').pop()}` : userIcon;

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    setAuth({ loggedIn: false, user: null });
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, checkAuth }}>
      <Router>
        <div className="App">
          <aside className="sidebar">
            <nav className="nav">
              <Link to="/">홈</Link>
              <Link to="/board">게시판</Link>
              <Link to="/vt_solo_board">버튜버 도감</Link>
            </nav>
          </aside>
          <div className="main-content">
            <header className="header">
              {auth.loggedIn ? (
                <div className="user-info">
                  <img src={profileImage} alt="User" className="user-icon" />
                  <span className="username" onClick={toggleDropdown}>{auth.user.username}</span>
                  {dropdownOpen && (
                    <div className="dropdown-menu">
                      <Link to="/mypage">마이페이지</Link>
                      {console.log('User permission:', auth.user.permission)}
                      {auth.user.permission === 'admin' && (
                        <Link to="/vtuber_register">버튜버 등록</Link>
                      )}
                      <Link to="/" onClick={handleLogout}>로그아웃</Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="login-link">
                  <Link to="/login">로그인</Link>
                  <Link to="/register">회원가입</Link>
                </div>
              )}
            </header>
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/board" element={<Board />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/write" element={<WritePost />} />
                <Route path="/posts/:id" element={<PostDetail />} />
                <Route path="/edit-post/:id" element={<EditPost />} />
                <Route path="/profile/update" element={<ProfileUpdate />} />
                <Route path="/vtuber_register" element={<VtuberRegister/>}/>
                <Route path="/vt_solo_board" element={<VtSoloBoard/>}/>
                <Route path="/vtuber/:id" element={<VtuberDetail />} /> 
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
