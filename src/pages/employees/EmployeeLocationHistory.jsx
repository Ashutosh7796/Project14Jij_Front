import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Clock, Loader2 } from "lucide-react";
import { locationService } from "../../utils/locationService";
import { adminApi } from "../../api/adminApi";
import { formatTo12Hour, formatTotalHours } from "../../utils/formatTime";
import { BASE_URL } from "../../config/api";
import "./EmployeeLocationHistory.css";

const EmployeeLocationHistory = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    fetchEmployeeData();
    fetchAttendanceHistory();
  }, [employeeId, selectedMonth, selectedYear]);

  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/v1/admin/users/employees/${employeeId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to fetch employee data");
      
      const data = await res.json();
      setEmployee(data);
    } catch (err) {
      // Silent fail
    }
  };

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await adminApi.getEmployeeAttendanceHistory(employeeId, selectedMonth, selectedYear);
      
      let records = [];
      
      if (Array.isArray(data)) {
        records = data;
      } else if (data && Array.isArray(data.records)) {
        records = data.records;
      } else if (data && data.attendanceRecords && Array.isArray(data.attendanceRecords)) {
        records = data.attendanceRecords;
      }
      
      setAttendanceRecords(records);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { val: "01", name: "January" }, { val: "02", name: "February" },
    { val: "03", name: "March" }, { val: "04", name: "April" },
    { val: "05", name: "May" }, { val: "06", name: "June" },
    { val: "07", name: "July" }, { val: "08", name: "August" },
    { val: "09", name: "September" }, { val: "10", name: "October" },
    { val: "11", name: "November" }, { val: "12", name: "December" }
  ];
  
  const years = ["2024", "2025", "2026"];

  return (
    <div className="location-history-container">
      {/* HEADER */}
      <div className="location-history-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="header-info">
          <h2>Employee Location History</h2>
          {employee && (
            <p>
              {employee.firstName} {employee.lastName} - {employee.employeeCode || `ID: ${employeeId}`}
            </p>
          )}
        </div>

        <div className="filter-controls">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-select"
          >
            {months.map(m => (
              <option key={m.val} value={m.val}>{m.name}</option>
            ))}
          </select>
          
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="year-select"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTENT */}
      <div className="location-history-content">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={40} />
            <p>Loading attendance records...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchAttendanceHistory}>Retry</button>
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} color="#ccc" />
            <p>No attendance records found for {months.find(m => m.val === selectedMonth)?.name} {selectedYear}</p>
          </div>
        ) : (
          <div className="records-grid">
            {attendanceRecords.map((record, index) => (
              <AttendanceCard key={index} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AttendanceCard = ({ record }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT': return '#28a745';
      case 'ABSENT': return '#dc3545';
      case 'LEAVE': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const location = record.checkInLocation || record.checkOutLocation;

  return (
    <>
      <div 
        className="attendance-card-compact" 
        onClick={() => setShowDetailModal(true)}
      >
        <div className="card-compact-header">
          <div className="date-badge">
            <Calendar size={14} />
            <span>{record.date}</span>
          </div>
          <span 
            className="status-badge-compact" 
            style={{ backgroundColor: getStatusColor(record.attendanceStatus || record.status) }}
          >
            {record.attendanceStatus || record.status}
          </span>
        </div>

        <div className="card-compact-body">
          <div className="day-label">{record.day}</div>
          
          <div className="time-compact-row">
            <div className="time-compact-item">
              <Clock size={12} />
              <span className="time-value">{formatTo12Hour(record.checkInTime)}</span>
            </div>
            <div className="time-separator">→</div>
            <div className="time-compact-item">
              <Clock size={12} />
              <span className="time-value">{formatTo12Hour(record.checkOutTime)}</span>
            </div>
          </div>

          {location && (
            <div className="location-compact">
              <MapPin size={12} color="#007bff" />
              <span>Location Available</span>
            </div>
          )}
        </div>

        <div className="card-compact-footer">
          <span className="click-hint">Click for details</span>
        </div>
      </div>

      {showDetailModal && (
        <DetailModal 
          record={record}
          location={location}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </>
  );
};

const DetailModal = ({ record, location, onClose }) => {
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT': return '#28a745';
      case 'ABSENT': return '#dc3545';
      case 'LEAVE': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-detailed" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-detailed">
          <div>
            <h3>Attendance Details</h3>
            <p className="modal-date">{record.date} - {record.day}</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body-detailed">
          {/* Status */}
          <div className="detail-section">
            <div className="detail-label">Status</div>
            <span 
              className="status-badge-large" 
              style={{ backgroundColor: getStatusColor(record.attendanceStatus || record.status) }}
            >
              {record.attendanceStatus || record.status}
            </span>
          </div>

          {/* Time Details */}
          <div className="detail-section">
            <div className="detail-label">Time Details</div>
            <div className="time-details-grid">
              <div className="time-detail-box">
                <Clock size={20} color="#28a745" />
                <div>
                  <div className="time-detail-label">Check In</div>
                  <div className="time-detail-value">{formatTo12Hour(record.checkInTime)}</div>
                </div>
              </div>
              <div className="time-detail-box">
                <Clock size={20} color="#dc3545" />
                <div>
                  <div className="time-detail-label">Check Out</div>
                  <div className="time-detail-value">{formatTo12Hour(record.checkOutTime)}</div>
                </div>
              </div>
            </div>
            {record.totalHours && (
              <div className="total-hours">
                Total Hours: <strong>{formatTotalHours(record.totalHours)}</strong>
              </div>
            )}
          </div>

          {/* Location Details */}
          {location && (
            <div className="detail-section">
              <div className="detail-label">
                <MapPin size={16} />
                Location Information
              </div>
              <div className="location-detail-box">
                <div className="location-detail-row">
                  <strong>Coordinates:</strong>
                  <span>{location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}</span>
                </div>
                {location.address && (
                  <div className="location-detail-row">
                    <strong>Address:</strong>
                    <span>{location.address}</span>
                  </div>
                )}
                <a
                  href={locationService.getMapLink(location.latitude, location.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link-button"
                >
                  <MapPin size={16} />
                  Open in Google Maps
                </a>
              </div>
            </div>
          )}

          {/* Remarks */}
          {record.remarks && (
            <div className="detail-section">
              <div className="detail-label">Remarks</div>
              <div className="remarks-box">{record.remarks}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LocationModal = ({ location, date, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <MapPin size={20} />
            Location Details
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="detail-row">
            <strong>Date:</strong>
            <span>{date}</span>
          </div>

          <div className="detail-row">
            <strong>Coordinates:</strong>
            <span>{location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}</span>
          </div>

          {location.address && (
            <div className="detail-row">
              <strong>Address:</strong>
              <span>{location.address}</span>
            </div>
          )}

          <a
            href={locationService.getMapLink(location.latitude, location.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-map-btn"
          >
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLocationHistory;
