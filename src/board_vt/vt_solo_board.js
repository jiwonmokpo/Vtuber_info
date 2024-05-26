import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../css/VtSoloBoard.css';

const VtSoloBoard = () => {
  const [vtubers, setVtubers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchVtubers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/vtinfo');
        setVtubers(response.data);
      } catch (error) {
        console.error('Error fetching vtubers:', error);
      }
    };

    fetchVtubers();
  }, []);

  const filteredVtubers = vtubers.filter(vtuber => 
    vtuber.vtubername.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="vt-solo-board">
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="버튜버 검색" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>
      <div className="vtuber-list">
        {filteredVtubers.map(vtuber => (
          <Link to={`/vtuber/${vtuber.id}`} key={vtuber.id} className="vtuber-card">
            <img src={`http://localhost:5000/uploads/${vtuber.profile_image}`} alt={vtuber.vtubername} />
            <div className="vtuber-info">
              <h2>{vtuber.vtubername}</h2>
              <p>{vtuber.gender}</p>
              <p>{vtuber.company}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default VtSoloBoard;
