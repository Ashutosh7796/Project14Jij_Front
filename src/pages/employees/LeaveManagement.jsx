import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { BASE_URL } from '../../config/api';
import './LeaveManagement.css';

const LeaveManagement = () => {
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/v1/attendance/leave/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch leave requests');
      }

      const response = await res.json();
      
      // Handle different response formats
      let requests = [];
      if (response.data) {
        // If data has content (paginated response)
        if (response.data.content && Array.isArray(response.data.content)) {
          requests = response.data.content;
        } 
        // If data is directly an array
        else if (Array.isArray(response.data)) {
          requests = response.data;
        }
        // If data is an object with other structure
        else {
          requests = [];
        }
      } 
      // If response is directly an array
      else if (Array.isArray(response)) {
        requests = response;
      }
      
      setLeaveRequests(requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    setProcessingId(leaveId);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/v1/attendance/leave/approve/${leaveId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Failed to approve leave request');
      }

      success('Leave request approved successfully!');
      setShowDetailsModal(false);
      setSelectedRequest(null);
      fetchLeaveRequests();
    } catch (err) {
      showError(err.message || 'Failed to approve leave request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (leaveId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    if (reason === null) return; // User cancelled
    
    setProcessingId(leaveId);
    
    try {
      const token = localStorage.getItem('token');
      const reasonParam = encodeURIComponent(reason || 'No reason provided');
      const res = await fetch(`${BASE_URL}/api/v1/attendance/leave/reject/${leaveId}?reason=${reasonParam}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Failed to reject leave request');
      }

      success('Leave request rejected successfully');
      setShowDetailsModal(false);
      setSelectedRequest(null);
      fetchLeaveRequests();
    } catch (err) {
      showError(err.message || 'Failed to reject leave request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (filter === 'ALL') return true;
    return request.status === filter;
  });

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

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="leave-management-container">
      <div className="leave-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2>Leave Management</h2>
      </div>

      {/* Filter Tabs */}
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
                ? leaveRequests.length 
                : leaveRequests.filter(r => r.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={40} />
          <p>Loading leave requests...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchLeaveRequests}>Retry</button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">
          <p>No {filter.toLowerCase()} leave requests found</p>
        </div>
      ) : (
        <div className="leave-requests-grid">
          {filteredRequests.map((request) => (
            <div 
              key={request.leaveRequestId || request.id} 
              className="leave-card-compact"
              onClick={() => handleViewDetails(request)}
            >
              <div className="compact-header">
                <div className="employee-info-compact">
                  <h4>{request.employeeName || `Employee #${request.userId}`}</h4>
                  <span className="employee-id-compact">ID: {request.userId}</span>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="compact-body">
                <div className="info-row">
                  <span className="info-label">Type:</span>
                  <span className="info-value">{request.leaveType?.replace(/_/g, ' ')}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">
                    {request.totalDays || calculateDays(request.startDate, request.endDate)} day(s)
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Dates:</span>
                  <span className="info-value">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
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

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content-leave" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-leave">
              <div>
                <h2>Leave Request Details</h2>
                <p className="modal-subtitle">{selectedRequest.employeeName || `Employee #${selectedRequest.userId}`}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDetailsModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body-leave">
              <div className="detail-section">
                <div className="detail-row-modal">
                  <span className="detail-label-modal">Status:</span>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>

                <div className="detail-row-modal">
                  <span className="detail-label-modal">Employee ID:</span>
                  <span className="detail-value-modal">{selectedRequest.userId}</span>
                </div>

                <div className="detail-row-modal">
                  <span className="detail-label-modal">Leave Type:</span>
                  <span className="detail-value-modal">{selectedRequest.leaveType?.replace(/_/g, ' ')}</span>
                </div>

                <div className="detail-row-modal">
                  <span className="detail-label-modal">Duration:</span>
                  <span className="detail-value-modal">
                    {selectedRequest.totalDays || calculateDays(selectedRequest.startDate, selectedRequest.endDate)} day(s)
                  </span>
                </div>

                <div className="detail-row-modal">
                  <span className="detail-label-modal">Start Date:</span>
                  <span className="detail-value-modal">{new Date(selectedRequest.startDate).toLocaleDateString()}</span>
                </div>

                <div className="detail-row-modal">
                  <span className="detail-label-modal">End Date:</span>
                  <span className="detail-value-modal">{new Date(selectedRequest.endDate).toLocaleDateString()}</span>
                </div>

                <div className="detail-row-modal">
                  <span className="detail-label-modal">Requested On:</span>
                  <span className="detail-value-modal">
                    {selectedRequest.requestedAt 
                      ? new Date(selectedRequest.requestedAt).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>

                <div className="detail-row-modal full-width">
                  <span className="detail-label-modal">Reason:</span>
                  <p className="detail-reason-modal">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                  <div className="detail-row-modal full-width rejection-section">
                    <span className="detail-label-modal">Rejection Reason:</span>
                    <p className="detail-reason-modal rejection-text">{selectedRequest.rejectionReason}</p>
                  </div>
                )}
              </div>

              {selectedRequest.status === 'PENDING' && (
                <div className="modal-actions">
                  <button
                    className="modal-approve-btn"
                    onClick={() => handleApprove(selectedRequest.leaveRequestId || selectedRequest.id)}
                    disabled={processingId === (selectedRequest.leaveRequestId || selectedRequest.id)}
                  >
                    <CheckCircle size={18} />
                    {processingId === (selectedRequest.leaveRequestId || selectedRequest.id) ? 'Processing...' : 'Approve Request'}
                  </button>
                  <button
                    className="modal-reject-btn"
                    onClick={() => handleReject(selectedRequest.leaveRequestId || selectedRequest.id)}
                    disabled={processingId === (selectedRequest.leaveRequestId || selectedRequest.id)}
                  >
                    <XCircle size={18} />
                    {processingId === (selectedRequest.leaveRequestId || selectedRequest.id) ? 'Processing...' : 'Reject Request'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
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

export default LeaveManagement;
