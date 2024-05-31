import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../css/VtuberDetail.css';
import youtubeIcon from '../image/youtube.svg';
import afreecaIcon from '../image/afreeca.svg';
import chzzkIcon from '../image/chzzk.svg';
import xIcon from '../image/x.svg';

const VtuberDetail = () => {
  const { id } = useParams();
  const [vtuber, setVtuber] = useState(null);
  const [showFullHeader, setShowFullHeader] = useState(false);

  useEffect(() => {
    const fetchVtuber = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/vtinfo/${id}`);
        setVtuber(response.data);
      } catch (error) {
        console.error('Error fetching Vtuber:', error);
      }
    };

    fetchVtuber();
  }, [id]);

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
          <button onClick={() => setShowFullHeader(!showFullHeader)} className="toggle-button">
            {showFullHeader ? '간략히 보기' : '전체 보기'}
          </button>
        </div>
        <div className="profile-image">
          <img src={`http://localhost:5000/uploads/${vtuber.profile_image}`} alt={`${vtuber.vtubername} profile`} />
        </div>
      </div>
      <div className="vtuber-info">
        <div className="tags">
          <span className={`tag ${vtuber.gender === '여성' ? 'tag-female' : 'tag-male'}`}>{vtuber.gender}</span>
          <span className={`tag ${vtuber.category === '개인세' ? 'tag-individual' : 'tag-company'}`}>{vtuber.category}</span>
        </div>
        <h1>{vtuber.vtubername}</h1>
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
      </div>
    </div>
  );
};

export default VtuberDetail;
