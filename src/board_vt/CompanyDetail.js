import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../css/CompanyDetail.css';
import youtubeIcon from '../image/youtube.svg';
import cafeIcon from '../image/cafe.svg';

const CompanyDetail = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [members, setMembers] = useState([]);
  const [staffs, setStaffs] = useState([]);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/company_info/${id}`);
        const companyData = response.data.company;
        setCompany(companyData);

        const allMembersResponse = await axios.get('http://localhost:5000/vtinfo');
        const allMembers = allMembersResponse.data;

        const companyMembers = allMembers.filter(member => member.company === companyData.companyName);

        setMembers(companyMembers.filter(member => member.role === '멤버'));
        setStaffs(companyMembers.filter(member => member.role === '사장' || member.role === '스태프'));
      } catch (error) {
        console.error('Error fetching company details:', error);
      }
    };

    fetchCompanyData();
  }, [id]);

  const calculateDebutDays = (debutDate) => {
    const debut = new Date(debutDate);
    const today = new Date();
    const diffTime = Math.abs(today - debut);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!company) {
    return <div>Loading...</div>;
  }

  return (
    <div className="CompanyDetail-container">
      <div className="CompanyDetail-header">
        <img src={`http://localhost:5000/uploads/${company.companyHeader}`} alt={`${company.companyName} header`} className="CompanyDetail-header-image" />
        <div className="CompanyDetail-profile-image">
          <img src={`http://localhost:5000/uploads/${company.companyProfile}`} alt={`${company.companyName} profile`} />
        </div>
      </div>
      <div className="CompanyDetail-info">
        <div className="CompanyDetail-tags">
          <p className='CompanyDetail-p-companyname'>{company.companyTag}</p>
        </div>
        <h1 className='CompanyDetail-h1-companyname'>{company.companyName}</h1>
        <div className="CompanyDetail-channels">
          <div className="CompanyDetail-channel-box">
            <a href={company.companyYoutubeLink} target="_blank" rel="noopener noreferrer">
              <img src={youtubeIcon} alt="YouTube" />
              <p className='CompanyDetail-p-link'>유튜브 바로가기</p>
            </a>
          </div>
          <div className="CompanyDetail-channel-box">
            <a href={company.fanClub} target="_blank" rel="noopener noreferrer">
              <img src={cafeIcon} alt="팬클럽" />
              <p className='CompanyDetail-p-link'>팬클럽 바로가기</p>
            </a>
          </div>
        </div>
      </div>
      <div className="CompanyDetail-members">
        <h2 className='CompanyDetail-h2'>멤버들</h2>
        <div className="CompanyDetail-members-list">
          {members.map(member => (
            <Link to={`/vtuber/${member.id}`} key={member.id} className="CompanyDetail-member-card">
              <img src={`http://localhost:5000/uploads/${member.profile_image}`} alt={member.vtubername} className="CompanyDetail-member-image" />
              <div className="CompanyDetail-member-info">
                <h3 className='CompanyDetail-h3'>{member.vtubername}</h3>
                <p className='CompanyDetail-p-date'>D+{calculateDebutDays(member.debutdate)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="CompanyDetail-staffs">
        <h2 className='CompanyDetail-h2'>주요 스태프</h2>
        <div className="CompanyDetail-staffs-list">
          {staffs.map(staff => (
            <Link to={`/vtuber/${staff.id}`} key={staff.id} className="CompanyDetail-staff-card">
              <img src={`http://localhost:5000/uploads/${staff.profile_image}`} alt={staff.vtubername} className="CompanyDetail-staff-image" />
              <div className="CompanyDetail-staff-info">
                <h3 className='CompanyDetail-h3-staff'>{staff.vtubername}</h3>
                <p className='CompanyDetail-p-date'>D+{calculateDebutDays(staff.debutdate)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;
