import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Hangul from 'hangul-js';
import '../css/VtSoloBoard.css';

const VtSoloBoard = () => {
  const [vtubers, setVtubers] = useState([]);
  const [followStatus, setFollowStatus] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [tempFilter, setTempFilter] = useState({ platform: '전체', category: '전체', gender: '전체', mbti: '전체' });
  const [appliedFilter, setAppliedFilter] = useState({ platform: '전체', category: '전체', gender: '전체', mbti: '전체' });
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [mbtiType, setMbtiType] = useState('');
  const [filterCount, setFilterCount] = useState(0);

  useEffect(() => {
    const fetchVtubers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/vtinfo', { withCredentials: true });
        const sortedVtubers = response.data.sort((a, b) => {
          if (/^[A-Za-z]/.test(a.vtubername.charAt(0))) {
            return a.vtubername.localeCompare(b.vtubername);
          }
          return a.vtubername.localeCompare(b.vtubername, 'ko-KR');
        });
        setVtubers(sortedVtubers);
        console.log('Fetched vtubers:', sortedVtubers); // 디버깅용 콘솔 출력
      } catch (error) {
        console.error('Error fetching vtubers:', error);
      }
    };

    const fetchFollowStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/follow_status', { withCredentials: true });
        setFollowStatus(response.data);
        console.log('Fetched follow status:', response.data); // 디버깅용 콘솔 출력
      } catch (error) {
        console.error('Error fetching follow status:', error);
      }
    };

    fetchVtubers();
    fetchFollowStatus();
  }, []);

  const handleTempFilterChange = (type, value) => {
    setTempFilter(prev => ({ ...prev, [type]: value }));
    if (type === 'mbti' && (value === 'E' || value === 'I')) {
      setMbtiType(value);
    }
  };

  const applyFilters = () => {
    setAppliedFilter(tempFilter);
    setShowFilterPopup(false);
    setMbtiType('');
    updateFilterCount();
  };

  const resetFilters = () => {
    setTempFilter({ platform: '전체', category: '전체', gender: '전체', mbti: '전체' });
    setAppliedFilter({ platform: '전체', category: '전체', gender: '전체', mbti: '전체' });
    setMbtiType('');
    setFilterCount(0);
  };

  const updateFilterCount = () => {
    const { platform, category, gender, mbti } = tempFilter;
    let count = 0;
    if (platform !== '전체') count++;
    if (category !== '전체') count++;
    if (gender !== '전체') count++;
    if (mbti !== '전체') count++;
    setFilterCount(count);
  };

  const handleFollow = async (vtuberId, isFollowing) => {
    try {
      if (isFollowing) {
        await axios.post('http://localhost:5000/unfollow', { vtuberId }, { withCredentials: true });
      } else {
        await axios.post('http://localhost:5000/follow', { vtuberId }, { withCredentials: true });
      }
      setFollowStatus(prevFollowStatus =>
        isFollowing
          ? prevFollowStatus.filter(id => id !== vtuberId)
          : [...prevFollowStatus, vtuberId]
      );
    } catch (error) {
      console.error('Error following/unfollowing vtuber:', error);
    }
  };

  const getChosung = (str) => {
    return Hangul.d(str).map(char => Hangul.isHangul(char) ? Hangul.d(char)[0] : char).join('');
  };

  const isValidChosungMatch = (searchChosung, targetChosung) => {
    let searchIndex = 0;
    let targetIndex = 0;

    while (searchIndex < searchChosung.length && targetIndex < targetChosung.length) {
      if (searchChosung[searchIndex] === targetChosung[targetIndex]) {
        searchIndex++;
      }
      targetIndex++;
    }

    return searchIndex === searchChosung.length;
  };

  const calculateChosungMatch = (searchChosung, targetChosung) => {
    let matchCount = 0;
    let targetIndex = 0;

    for (let i = 0; i < searchChosung.length; i++) {
      const searchChar = searchChosung[i];
      while (targetIndex < targetChosung.length && targetChosung[targetIndex] !== searchChar) {
        targetIndex++;
      }
      if (targetIndex < targetChosung.length && targetChosung[targetIndex] === searchChar) {
        matchCount++;
        targetIndex++;
      }
    }
    return matchCount / searchChosung.length;
  };

  const levenshteinDistance = (a, b) => {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) {
      return bn;
    }
    if (bn === 0) {
      return an;
    }
    const matrix = Array(an + 1).fill(null).map(() => Array(bn + 1).fill(null));
    for (let i = 0; i <= an; i += 1) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= bn; j += 1) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= an; i += 1) {
      for (let j = 1; j <= bn; j += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
          matrix[i - 1][j - 1] + indicator,
        );
      }
    }
    return matrix[an][bn];
  };

  const levenshteinSimilarity = (str1, str2) => {
    const maxLength = Math.max(str1.length, str2.length);
    const distance = levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  };

  const searchVtubers = (vtubers) => {
    if (!search) return vtubers;
    const searchChosung = getChosung(search.toLowerCase());
    return vtubers.map(vtuber => {
      const vtuberChosung = getChosung(vtuber.vtubername.toLowerCase());

      if (!isValidChosungMatch(searchChosung, vtuberChosung)) {
        return { ...vtuber, similarity: 0 };
      }

      const chosungMatch = calculateChosungMatch(searchChosung, vtuberChosung);
      const levenshteinSim = levenshteinSimilarity(searchChosung, vtuberChosung);
      const combinedSimilarity = (chosungMatch * 0.9) + (levenshteinSim * 0.1);

      return { ...vtuber, similarity: combinedSimilarity };
    })
    .filter(vtuber => vtuber.similarity > 0)
    .sort((a, b) => {
      if (a.similarity !== b.similarity) {
        return b.similarity - a.similarity;
      } else {
        return a.vtubername.length - b.vtubername.length;
      }
    });
  };

  const filterVtubers = (vtubers) => {
    return vtubers.filter(vtuber => {
      const { platform, category, gender, mbti } = appliedFilter;
      const extrovertMBTI = ['ESTP', 'ESTJ', 'ESFP', 'ESFJ', 'ENTP', 'ENTJ', 'ENFP', 'ENFJ'];
      const introvertMBTI = ['ISTP', 'ISTJ', 'ISFP', 'ISFJ', 'INTP', 'INTJ', 'INFP', 'INFJ'];

      const mbtiMatch = mbti === '전체' ||
                        (mbti === 'E' && extrovertMBTI.includes(vtuber.mbti)) ||
                        (mbti === 'I' && introvertMBTI.includes(vtuber.mbti)) ||
                        vtuber.mbti === mbti;

      return (
        (platform === '전체' || vtuber.platform === platform) &&
        (category === '전체' || vtuber.category === category) &&
        (gender === '전체' || vtuber.gender === gender) &&
        mbtiMatch
      );
    });
  };

  const sortVtubers = (vtubers) => {
    if (!filter) return vtubers;
    const koreanCharRange = {
      'ㄱ': /^[가-깋]/,
      'ㄴ': /^[나-닣]/,
      'ㄷ': /^[다-딯]/,
      'ㄹ': /^[라-맇]/,
      'ㅁ': /^[마-밓]/,
      'ㅂ': /^[바-빟]/,
      'ㅅ': /^[사-싷]/,
      'ㅇ': /^[아-잏]/,
      'ㅈ': /^[자-짛]/,
      'ㅊ': /^[차-칳]/,
      'ㅋ': /^[카-킿]/,
      'ㅌ': /^[타-팋]/,
      'ㅍ': /^[파-핗]/,
      'ㅎ': /^[하-힣]/
    };
    return vtubers.filter(vtuber => {
      const name = vtuber.vtubername;
      if (filter === 'A-Z') {
        return /^[A-Za-z]/.test(name.charAt(0));
      }
      return koreanCharRange[filter] ? koreanCharRange[filter].test(name.charAt(0)) : true;
    });
  };

  const combinedVtubers = () => {
    const searched = searchVtubers(vtubers);
    const filtered = filterVtubers(searched);
    return sortVtubers(filtered);
  };

  const filteredVtubers = combinedVtubers();

  const mbtiOptions = mbtiType ? (
    mbtiType === 'E' ? (
      <>
        <button className={tempFilter.mbti === 'ESTP' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ESTP')}>ESTP</button>
        <button className={tempFilter.mbti === 'ESTJ' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ESTJ')}>ESTJ</button>
        <button className={tempFilter.mbti === 'ESFP' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ESFP')}>ESFP</button>
        <button className={tempFilter.mbti === 'ESFJ' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ESFJ')}>ESFJ</button>
        <button className={tempFilter.mbti === 'ENTP' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ENTP')}>ENTP</button>
        <button className={tempFilter.mbti === 'ENTJ' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ENTJ')}>ENTJ</button>
        <button className={tempFilter.mbti === 'ENFP' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ENFP')}>ENFP</button>
        <button className={tempFilter.mbti === 'ENFJ' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ENFJ')}>ENFJ</button>
      </>
    ) : (
      <>
        <button className={tempFilter.mbti === 'ISTP' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ISTP')}>ISTP</button>
        <button className={tempFilter.mbti === 'ISTJ' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ISTJ')}>ISTJ</button>
        <button className={tempFilter.mbti === 'ISFP' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ISFP')}>ISFP</button>
        <button className={tempFilter.mbti === 'ISFJ' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'ISFJ')}>ISFJ</button>
        <button className={tempFilter.mbti === 'INTP' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'INTP')}>INTP</button>
        <button className={tempFilter.mbti === 'INTJ' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'INTJ')}>INTJ</button>
        <button className={tempFilter.mbti === 'INFP' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'INFP')}>INFP</button>
        <button className={tempFilter.mbti === 'INFJ' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'INFJ')}>INFJ</button>
      </>
    )
  ) : null;

  return (
    <div className="vt-solo-board">
      <h1>버튜버 도감</h1>
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="버튜버 검색" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>
      <div className="filter-bar">
        <button className="filter-button" onClick={() => setShowFilterPopup(!showFilterPopup)}>
          🔍 필터 {filterCount > 0 && <span className="filter-count">{filterCount}</span>}
        </button>
        <div className="filter-buttons">
          <button onClick={() => setFilter('')}>전체</button>
          {['A-Z', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'].map((char) => (
            <button key={char} className={filter === char ? 'vtselected' : ''} onClick={() => setFilter(char)}>{char}</button>
          ))}
        </div>
      </div>
      <div className="vtuber-list">
        {filteredVtubers.map(vtuber => (
          <div className="vtuber-card-container" key={vtuber.id}>
            <Link to={`/vtuber/${vtuber.id}`} className="vtuber-card">
              <div className={`vtuber-image-container ${vtuber.openLive ? 'channel_profile_is_live' : ''}`}>
                <img src={`http://localhost:5000/uploads/${vtuber.profile_image}`} alt={vtuber.vtubername} />
                {vtuber.openLive && <span className="live-badge">LIVE</span>}
              </div>
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
              className={`vt-follow-button ${followStatus.includes(vtuber.id) ? 'active' : ''}`} 
              onClick={() => handleFollow(vtuber.id, followStatus.includes(vtuber.id))}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      {showFilterPopup && (
        <div className="filter-popup">
          <h3>필터</h3>
          <div className="filter-section">
            <h4>방송 플랫폼</h4>
            {['전체', '치지직', '아프리카'].map(platform => (
              <button
                key={platform}
                className={tempFilter.platform === platform ? 'vtselected' : ''}
                onClick={() => handleTempFilterChange('platform', platform)}
              >
                {platform}
              </button>
            ))}
          </div>
          <div className="filter-section">
            <h4>소속</h4>
            {['전체', '기업세', '개인세'].map(category => (
              <button
                key={category}
                className={tempFilter.category === category ? 'vtselected' : ''}
                onClick={() => handleTempFilterChange('category', category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="filter-section">
            <h4>성별</h4>
            {['전체', '여성', '남성'].map(gender => (
              <button
                key={gender}
                className={tempFilter.gender === gender ? 'vtselected' : ''}
                onClick={() => handleTempFilterChange('gender', gender)}
              >
                {gender}
              </button>
            ))}
          </div>
          <div className="filter-section">
            <h4>MBTI</h4>
            <div className="mbti-options">
              <button className={tempFilter.mbti === '전체' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', '전체')} >
                전체
              </button>
              <button className={mbtiType === 'E' ? 'vtselected' : ''} onClick={() => setMbtiType('E')}>
                외향형
              </button>
              <button className={mbtiType === 'I' ? 'vtselected' : ''} onClick={() => setMbtiType('I')}>
                내향형
              </button>
              {mbtiOptions}
            </div>
          </div>
          <div className="filter-buttons">
            <button className="apply-filter-button" onClick={applyFilters}>적용</button>
            <button className="reset-filter-button" onClick={resetFilters}>초기화</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VtSoloBoard;
