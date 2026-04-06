import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { BASE_URL } from '../../config/api';
import './MyLeaves.css';

const MyLeaves = () => {
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  
  const [myLeaves, setMyLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [requestingLeave, setRequestingLeave] = useState(false);
  const [leaveData, setLeaveData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    leaveType: 'SICK_LEAVE'
  });

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/v1/attendance/leave/my-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 404) {
          setMyLeaves([]);
          return;
        }
        throw new Error('Failed to fetch leave requests');
      }

      const response = await res.json();
      
      let leaves = [];
      if (response.data) {
        if (response.data.content && Array.isArray(response.data.content)) {
          leaves = response.data.content;
        } else if (Array.isArray(response.data)) {
          leaves = response.data;
        }
      } else if (Array.isArray(response)) {
        leaves = response;
      }
      
      setMyLeaves(leaves);
    } catch (err) {
      setError(err.message);
      showError(err.message || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLeave = async () => {
    setRequestingLeave(true);

    try {
      const userId = Number(localStorage.getItem("userId"));
      if (!userId) {
        throw new Error('User ID not found');
      }

      if (!leaveData.reason.trim()) {
        showError('Please provide a reason for leave');
        setRequestingLeave(false);
        return;
      }

      if (new Date(leaveData.endDate) < new Date(leaveData.startDate)) {
        showError('End date cannot be before start date');
        setRequestingLeave(false);
        return;
      }

      const token = localStorage.getItem('token');
      const payload = {
        userId,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason,
        leaveType: leaveData.leaveType,
        status: 'PENDING'
      };

      const res = await fetch(`${BASE_URL}/api/v1/attendance/leave/request`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Leave request failed");
      }

      success('Leave request submitted successfully! Admin will review your request.');
      
      setLeaveData({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        leaveType: 'SICK_LEAVE'
      });
      setShowRequestModal(false);
      fetchMyLeaves();
      
    } catch (err) {
      showError(err.message || 'Leave request failed');
    } finally {
      setRequestingLeave(false);
    }
  };

  const handleViewDetails = (leave) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: '#fff3cd', color: '#856404', icon: <Clock size={14} /> },
      APPROVED: { bg: '#d4edda', color: '#155724', icon: <CheckCircle size={14} /> },
      REJECTED: { bg: '#f8d7da', color: '#721c24', icon: <XCircle size={14} /> }
    };

    const style = styles[status] || styles.PENDING;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.icon}
        {status}
      </span>
    );
  };

  const filteredLeaves = myLeaves.filter(leave => {
    if (filter === 'ALL') return true;
    return leave.status === filter;
  });

  return (
    <div className="my-leaves-container">
      <div className="my-leaves-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2>My Leave Requests</h2>
        <button className="request-leave-btn" onClick={() => setShowRequestModal(true)}>
          + Request Leave
        </button>
      </div>

      <div className="filter-tabs">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status}
            <span className="count">
              {status === 'ALL' 
                ? myLeaves.length 
                : myLeaves.filter(l => l.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={40} />
          <p>Loading your leave requests...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchMyLeaves}>Retry</button>
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="empty-state">
          <Calendar size={64} color="#ccc" />
          <p>No {filter.toLowerCase()} leave requests found</p>
          <button onClick={() => setShowRequestModal(true)} className="empty-action-btn">
            Request Your First Leave
          </button>
        </div>
      ) : (
        <div className="leaves-grid">
          {filteredLeaves.map((leave) => (
            <div 
              key={leave.leaveRequestId || leave.id} 
              className="leave-card-compact"
              onClick={() => handleViewDetails(leave)}
            >
              <div className="compact-header">
                <div className="leave-type-compact">
                  <h4>{leave.leaveType?.replace(/_/g, ' ')}</h4>
                  <span className="leave-days-compact">{leave.totalDays || 1} day(s)</span>
                </div>
                {getStatusBadge(leave.status)}
              </div>

              <div className="compact-body">
                <div className="info-row">
                  <span className="info-label">From:</span>
                  <span className="info-value">{new Date(leave.startDate).toLocaleDateString()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">To:</span>
                  <span className="info-value">{new Date(leave.endDate).toLocaleDateString()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Requested:</span>
                  <span className="info-value">
                    {leave.requestedAt 
                      ? new Date(leave.requestedAt).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="compact-footer">
                <span className="view-details-text">Click to view details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LEAVE DETAILS MODAL */}
      {showDetailsModal && selectedLeave && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content-leave-details" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-leave">
              <div>
                <h3>Leave Request Details</h3>
                <p className="modal-subtitle">Request ID: #{selectedLeave.leaveRequestId || selectedLeave.id}</p>
              </div>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>

            <div className="modal-body-leave">
              {/* Status */}
              <div className="detail-section-leave">
                <div className="detail-label-leave">Status</div>
                <span className={`status-badge-large ${selectedLeave.status?.toLowerCase()}`}>
                  {selectedLeave.status}
                </span>
              </div>

              {/* Leave Type */}
              <div className="detail-section-leave">
                <div className="detail-label-leave">Leave Type</div>
                <div className="detail-value-leave">{selectedLeave.leaveType?.replace(/_/g, ' ')}</div>
              </div>

              {/* Duration */}
              <div className="detail-section-leave">
                <div className="detail-label-leave">Duration</div>
                <div className="duration-box">
                  <div className="duration-item">
                    <span className="duration-label">From</span>
                    <span className="duration-value">{selectedLeave.startDate}</span>
                  </div>
                  <span className="duration-arrow">→</span>
                  <div className="duration-item">
                    <span className="duration-label">To</span>
                    <span className="duration-value">{selectedLeave.endDate}</span>
                  </div>
                </div>
                <div className="total-days">
                  Total: <strong>{selectedLeave.totalDays || calculateDays(selectedLeave.startDate, selectedLeave.endDate)} days</strong>
                </div>
              </div>

              {/* Reason */}
              <div className="detail-section-leave">
                <div className="detail-label-leave">Reason</div>
                <div className="reason-box">{selectedLeave.reason || 'No reason provided'}</div>
              </div>

              {/* Admin Response */}
              {selectedLeave.adminResponse && (
                <div className="detail-section-leave">
                  <div className="detail-label-leave">Admin Response</div>
                  <div className="admin-response-box">{selectedLeave.adminResponse}</div>
                </div>
              )}

              {/* Dates */}
              <div className="detail-section-leave">
                <div className="detail-label-leave">Request Information</div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Requested On</span>
                    <span className="info-value">{selectedLeave.requestedDate || selectedLeave.createdAt || 'N/A'}</span>
                  </div>
                  {selectedLeave.approvedDate && (
                    <div className="info-item">
                      <span className="info-label">Processed On</span>
                      <span className="info-value">{selectedLeave.approvedDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
      </div>
    </div>
  );
};

export default MyLeaves;
