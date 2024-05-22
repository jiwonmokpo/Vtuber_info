import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import axios from 'axios';
import Home from './userpage/Home';
import Login from './userpage/Login';
import Register from './userpage/Register';
import MyPage from './userpage/MyPage';
import Board from './board/Board';
import WritePost from './board/WritePost';
import PostDetail from './board/PostDetail'; // 게시글 상세 페이지 추가
import './App.css';

export const AuthContext = createContext();

function App() {
  const [auth, setAuth] = useState({ loggedIn: false, user: null });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/check-auth', { withCredentials: true });
        if (response.data.authenticated) {
          setAuth({ loggedIn: true, user: response.data.user });
        } else {
          setAuth({ loggedIn: false, user: null });
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      <Router>
        <div className="App">
          <aside className="sidebar">
            <nav className="nav">
              <Link to="/">홈</Link>
              <Link to="/board">게시판</Link>
              {auth.loggedIn ? (
                <>
                  <Link to="/mypage">마이페이지</Link>
                  <Link to="/" onClick={() => setAuth({ loggedIn: false, user: null })}>로그아웃</Link>
                  <Link to="/write">글쓰기</Link> {/* 글쓰기 버튼 */}
                </>
              ) : (
                <>
                  <Link to="/login">로그인</Link>
                  <Link to="/register">회원가입</Link>
                </>
              )}
            </nav>
          </aside>
          <div className="main-content">
            <header className="header">
              {auth.loggedIn && (
                <div className="user-info">
                  <img src="user-profile-image-url" alt="User" />
                  <span className="username">{auth.user.username}</span>
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
                <Route path="/write" element={<WritePost />} /> {/* WritePost 컴포넌트 라우트 */}
                <Route path="/posts/:id" element={<PostDetail />} /> {/* PostDetail 컴포넌트 라우트 */}
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
