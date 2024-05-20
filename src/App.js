import React, { createContext, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import Board from './pages/Board';
import Login from './pages/Login';
import Register from './pages/Register';
import MyPage from './pages/MyPage';
import './App.css';

export const AuthContext = createContext();

function App() {
  const [auth, setAuth] = useState({ loggedIn: false, user: null });

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      <Router>
        <div className="App">
          <nav className="navbar">
            <div className="navbar-left">
              <Link to="/">홈</Link>
              <Link to="/board">게시판</Link>
            </div>
            <div className="navbar-right">
              {auth.loggedIn ? (
                <>
                  <Link to="/mypage">마이페이지</Link>
                  <Link to="/" onClick={() => setAuth({ loggedIn: false, user: null })}>로그아웃</Link>
                </>
              ) : (
                <>
                  <Link to="/login">로그인</Link>
                  <Link to="/register">회원가입</Link>
                </>
              )}
            </div>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/board" element={<Board />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
