import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../css/CompanyBoard.css';

const CompanyBoard = () => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('http://localhost:5000/company_info');
        setCompanies(response.data);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div className="CompanyBoard-container">
      <h1>버튜버 회사 목록</h1>
      <div className="CompanyBoard-list">
        {companies.map(company => (
          <Link to={`/company/${company.id}`} key={company.id} className="CompanyBoard-card">
            <img src={`http://localhost:5000/uploads/${company.companyHeader}`} alt={`${company.companyName} header`} className="CompanyBoard-header-image" />
            <img src={`http://localhost:5000/uploads/${company.companyProfile}`} alt={`${company.companyName} profile`} className="CompanyBoard-profile-image" />
            <div className="CompanyBoard-info">
              <h2>{company.companyName}</h2>
              <p>{company.companyTag}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CompanyBoard;
