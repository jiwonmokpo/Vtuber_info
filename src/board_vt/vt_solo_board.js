import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../css/VtSoloBoard.css';

const VtSoloBoard = () => {
  const [vtubers, setVtubers] = useState([]);
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
        const response = await axios.get('http://localhost:5000/vtinfo');
        const sortedVtubers = response.data.sort((a, b) => {
          if (/^[A-Za-z]/.test(a.vtubername.charAt(0))) {
            return a.vtubername.localeCompare(b.vtubername);
          }
          return a.vtubername.localeCompare(b.vtubername, 'ko-KR');
        });
        setVtubers(sortedVtubers);
      } catch (error) {
        console.error('Error fetching vtubers:', error);
      }
    };

    fetchVtubers();
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

  const filteredVtubers = vtubers
    .filter(vtuber => 
      vtuber.vtubername && vtuber.vtubername.toLowerCase().includes(search.toLowerCase())
    )
    .filter(vtuber => {
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
    })
    .filter(vtuber => {
      if (!filter) return true;
      const name = vtuber.vtubername;
      if (filter === 'A-Z') {
        return /^[A-Za-z]/.test(name.charAt(0));
      }
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
      return koreanCharRange[filter] ? koreanCharRange[filter].test(name.charAt(0)) : true;
    });

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
          <Link to={`/vtuber/${vtuber.id}`} key={vtuber.id} className="vtuber-card">
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
            {['전체', '남성', '여성'].map(gender => (
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
            <div className="mbti-buttons">
              <button className={tempFilter.mbti === '전체' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', '전체')}>전체</button>
              <button className={tempFilter.mbti === 'E' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'E')}>E</button>
              <button className={tempFilter.mbti === 'I' ? 'vtselected' : ''} onClick={() => handleTempFilterChange('mbti', 'I')}>I</button>
            </div>
            {mbtiType && (
              <div className="mbti-buttons-expanded">
                {mbtiType === 'E' ? (
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
                )}
              </div>
            )}
          </div>
          <div className="filter-buttons">
            <button onClick={resetFilters} className="reset-button">🔄 되돌리기</button>
            <button onClick={applyFilters} className="apply-button">적용하기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VtSoloBoard;
