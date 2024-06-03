import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import '../css/VtuberDetail.css';
import youtubeIcon from '../image/youtube.svg';
import afreecaIcon from '../image/afreeca.svg';
import chzzkIcon from '../image/chzzk.svg';
import xIcon from '../image/x.svg';

const VtuberDetail = () => {
  const { id } = useParams();
  const { auth } = useContext(AuthContext);
  const [vtuber, setVtuber] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFullHeader, setShowFullHeader] = useState(false);
  const [latestVideos, setLatestVideos] = useState([]);
  const [musicVideos, setMusicVideos] = useState([]);

  const decodeHtmlEntity = (str) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  };

  useEffect(() => {
    const fetchVtuber = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/vtinfo/${id}`, { withCredentials: true });
        setVtuber(response.data);
        const followResponse = await axios.get('http://localhost:5000/follow_status', { withCredentials: true });
        const isFollowed = followResponse.data.includes(Number(id));
        setIsFollowing(isFollowed);
        
        const videoResponse = await axios.get(`http://localhost:5000/vtuber/${id}/latest-videos`);
        setLatestVideos(videoResponse.data);

        const musicVideoResponse = await axios.get(`http://localhost:5000/vtuber/${id}/music-videos`);
        setMusicVideos(musicVideoResponse.data);
      } catch (error) {
        console.error('Error fetching Vtuber:', error);
      }
    };

    fetchVtuber();
  }, [id, auth.isAuthenticated]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await axios.post('http://localhost:5000/unfollow', { vtuberId: id }, { withCredentials: true });
      } else {
        await axios.post('http://localhost:5000/follow', { vtuberId: id }, { withCredentials: true });
      }

      const followResponse = await axios.get('http://localhost:5000/follow_status', { withCredentials: true });
      const isFollowed = followResponse.data.includes(Number(id));
      setIsFollowing(isFollowed);
    } catch (error) {
      console.error('Error following/unfollowing vtuber:', error);
    }
  };

  const handleToggleHeader = () => {
    setShowFullHeader(!showFullHeader);
  };

  if (!vtuber) {
    return <div>Loading...</div>;
  }

  const calculateDebutDays = (debutDate) => {
    const debut = new Date(debutDate);
    const today = new Date();
    const diffTime = Math.abs(today - debut);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case '치지직':
        return chzzkIcon;
      case '아프리카':
        return afreecaIcon;
      default:
        return null;
    }
  };

  return (
    <div className="vtuber-detail-container">
      <div className="vtuber-header">
        <div className={`header-image ${showFullHeader ? 'full' : 'half'}`}>
          <img src={`http://localhost:5000/uploads/${vtuber.header_image}`} alt={`${vtuber.vtubername} header`} />
          <button onClick={handleToggleHeader} className="toggle-button">
            {showFullHeader ? '간략히 보기' : '전체 보기'}
          </button>
        </div>
        <div className="profile-image">
          <img src={`http://localhost:5000/uploads/${vtuber.profile_image}`} alt={`${vtuber.vtubername} profile`} />
        </div>
      </div>
      <div className="vtuber-info">
        <div className="tags">
          <span className={`tag ${vtuber.gender === '여성' ? 'tag-female' : 'tag-male'}`}>#{vtuber.gender}</span>
          <span className={`tag ${vtuber.category === '개인세' ? 'tag-individual' : 'tag-company'}`}>#{vtuber.category}</span>
        </div>
        <h1>
          {vtuber.vtubername}
          <button className="follow-button" onClick={handleFollow}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isFollowing ? "red" : "gray"}
              width="24px"
              height="24px"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </h1>
        <div className="dates">
          <div className="date-box">
            <h3>데뷔일</h3>
            <p>D+{calculateDebutDays(vtuber.debutdate)}</p>
          </div>
          <div className="date-box">
            <h3>생일</h3>
            <p>{new Date(vtuber.birthday).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</p>
          </div>
        </div>
        <h2>채널</h2>
        <div className="channels">
          <div className="channel-box">
            <a href={vtuber.youtubelink} target="_blank" rel="noopener noreferrer">
              <img src={youtubeIcon} alt="YouTube" />
              <p>바로가기</p>
            </a>
          </div>
          <div className="channel-box">
            <a href={vtuber.platformlink} target="_blank" rel="noopener noreferrer">
              <img src={getPlatformIcon(vtuber.platform)} alt={vtuber.platform} />
              <p>바로가기</p>
            </a>
          </div>
          <div className="channel-box">
            <a href={vtuber.xlink} target="_blank" rel="noopener noreferrer">
              <img src={xIcon} alt="X" />
              <p>바로가기</p>
            </a>
          </div>
        </div>
        <div className='VtdetailMedia'>미디어</div>
        <div className="media">
          {latestVideos.map((video, index) => (
            video.snippet && video.snippet.thumbnails && video.snippet.thumbnails.medium ? (
              <div className="video-box" key={video.id.videoId || index}>
                <a href={`https://www.youtube.com/watch?v=${video.id.videoId}`} target="_blank" rel="noopener noreferrer">
                  <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} />
                </a>
                <p>{decodeHtmlEntity(video.snippet.title)}</p>
              </div>
            ) : null
          ))}
        </div>
        <div className='VtdetailMusic'>음악</div>
        <div className="music">
          {musicVideos.map((video, index) => (
            video.snippet && video.snippet.thumbnails && video.snippet.thumbnails.medium ? (
              <div className="video-box" key={video.id.videoId || index}>
                <a href={`https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`} target="_blank" rel="noopener noreferrer">
                  <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} />
                </a>
                <p>{decodeHtmlEntity(video.snippet.title)}</p>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  );
};

export default VtuberDetail;