import React from 'react';
import { Link } from 'react-router-dom';
import './EmployeeSidebar.css';

const EmployeeSidebar = () => {
  return (
    <div className="employee-sidebar">
      <h2>Employee Module</h2>
      <ul>
        <li>
          <Link to="/employee/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/employee/farmers">Farmers</Link>
        </li>
        <li>
          <Link to="/employee/surveys">Surveys</Link>
        </li>
        <li>
          <Link to="/employee/reports">Reports</Link>
        </li>
        <li>
        </li>
      </ul>
    </div>
  );
};

export default EmployeeSidebar;