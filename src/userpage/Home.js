import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Home.css';

const Home = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [birthdays, setBirthdays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(day);
  const [dayOffset, setDayOffset] = useState(Math.floor((day - 1) / 14) * 14);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchBirthdays();
  }, [month, year]);

  const fetchBirthdays = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/birthdays/${month.toString().padStart(2, '0')}`);
      setBirthdays(response.data);
    } catch (error) {
      console.error('Error fetching birthdays:', error);
    }
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth);
    setDayOffset(0);
    setShowDropdown(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSelectedDay(today.getDate());
    setDayOffset(Math.floor((today.getDate() - 1) / 14) * 14);
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(month, year);
  const startDay = new Date(year, month - 1, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrevClick = () => {
    if (dayOffset - 14 < 0) {
      if (month === 1) {
        setMonth(12);
        setYear(year - 1);
        setDayOffset(getDaysInMonth(12, year - 1) - 14);
      } else {
        setMonth(month - 1);
        setDayOffset(getDaysInMonth(month - 1, year) - 14);
      }
    } else {
      setDayOffset(dayOffset - 14);
    }
  };

  const handleNextClick = () => {
    if (dayOffset + 14 >= daysInMonth) {
      if (month === 12) {
        setMonth(1);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
      setDayOffset(0);
    } else {
      setDayOffset(dayOffset + 14);
    }
  };

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  const visibleDays = [];
  for (let i = dayOffset; i < dayOffset + 14; i++) {
    if (i < daysInMonth) {
      const day = daysArray[i];
      const weekday = weekdays[(startDay + i) % 7];
      visibleDays.push({ day, weekday });
    } else {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonthDays = i - daysInMonth + 1;
      const nextMonthWeekday = weekdays[(startDay + i) % 7];
      visibleDays.push({ day: nextMonthDays, weekday: nextMonthWeekday, month: nextMonth, year: nextYear });
    }
  }

  const birthdaysForSelectedDay = birthdays.filter(birthday => {
    const [birthMonth, birthDay] = birthday[1].split('-');
    return parseInt(birthDay, 10) === selectedDay && parseInt(birthMonth, 10) === month;
  });

  return (
    <div className="home-container">
      <div className="header">
        <h1 onClick={() => setShowDropdown(!showDropdown)}>
          {month}월에 생일인 버튜버 🎂 <span className="dropdown-icon">▼</span>
        </h1>
        <button onClick={handleTodayClick}>오늘</button>
        {showDropdown && (
          <div className="dropdown">
            {[...Array(12)].map((_, i) => (
              <div
                key={i + 1}
                className="dropdown-item"
                onClick={() => handleMonthChange(i + 1)}
              >
                {i + 1}월 생일
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="month-selector">
        <button onClick={handlePrevClick}> &lt; </button>
        <div className="calendar">
          <div className="weekdays">
            {visibleDays.map(({ weekday }, index) => (
              <div key={index} className="weekday">{weekday}</div>
            ))}
          </div>
          <div className="days">
            {visibleDays.map(({ day, month: dayMonth }, index) => (
              <div 
                key={index} 
                className={`day ${selectedDay === day && month === (dayMonth || month) ? 'selected' : ''}`} 
                onClick={() => {
                  setSelectedDay(day);
                  if (dayMonth) {
                    setMonth(dayMonth);
                    setYear(year + (dayMonth === 1 && month === 12 ? 1 : 0));
                    setDayOffset(0);
                  }
                }}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleNextClick}> &gt; </button>
      </div>
      <div className="birthdays">
        {birthdaysForSelectedDay.length > 0 ? (
          birthdaysForSelectedDay.map(birthday => (
            <div className="birthday-card" key={birthday[0]}>
              <img src={`http://localhost:5000/uploads/${birthday[2]}`} alt={birthday[0]} />
              <p>{birthday[0]}님의 {birthday[1]} 생일을 축하합니다.</p>
            </div>
          ))
        ) : (
          <p>{month}월 {selectedDay}일에 생일을 맞이하는 버튜버가 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default Home;
