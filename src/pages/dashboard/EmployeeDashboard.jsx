import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BsStopwatch } from "react-icons/bs";
import { SlCalender } from "react-icons/sl";
import { RiAccountBoxFill } from "react-icons/ri";
import { VscFileSubmodule } from "react-icons/vsc";
import { locationService } from "../../utils/locationService";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { formatTo12Hour } from "../../utils/formatTime";
import { BASE_URL } from "../../config/api";
import { authenticatedFetch } from "../../utils/auth";
import { useAuth } from "../../context/AuthContext";
import { useCachedFetch } from "../../hooks/useCachedFetch";
import {
  CACHE_TAGS,
  SWR_FRESH_MS,
  SWR_STALE_MS,
  cacheKeyEmployeeAttendanceMe,
  cacheKeyEmployeeSurveyStatusCountMe,
  cacheKeyEmployeeSurveyMeStatus,
  cacheKeyEmployeeRecentSurveys,
} from "../../cache/cacheKeys";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

import "./styles/EmployeeDashboard.css";
import "./styles/AdminDashboards.css";
import {
  EmployeeDashboardAuthShell,
  EmployeeFarmersTableSkeleton,
  PieChartAreaSkeleton,
  StatCardsSkeleton,
} from "./DashboardSkeletons";


// Inner component — only mounted after auth is confirmed ready.
function EmployeeDashboardContent() {
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [requestingLeave, setRequestingLeave] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState(null);
  const [locationAction, setLocationAction] = useState(''); // 'checkin' or 'checkout'
  const [leaveData, setLeaveData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    leaveType: 'SICK_LEAVE'
  });

  const swrOpts = useMemo(
    () => ({
      swr: true,
      freshMs: SWR_FRESH_MS,
      staleMs: SWR_STALE_MS,
    }),
    []
  );

  const dashTags = useMemo(
    () => [CACHE_TAGS.EMPLOYEE_DASHBOARD],
    []
  );

  const fetchTodayAttendance = useCallback(async () => {
    const res = await authenticatedFetch(
      `${BASE_URL}/api/v1/attendance/me`,
      { method: "GET" },
      { skipGetRetry: true }
    );
    if (!res.ok) return null;
    const response = await res.json();
    return response.data || response;
  }, []);

  const { data: todayAttendance, loading: attLoading, refetch: refetchAttendance } = useCachedFetch(
    cacheKeyEmployeeAttendanceMe(),
    fetchTodayAttendance,
    { ...swrOpts, tags: [...dashTags, CACHE_TAGS.EMPLOYEE_ATTENDANCE] }
  );

  const fetchSurveyStatusCount = useCallback(async () => {
    const res = await authenticatedFetch(
      `${BASE_URL}/api/v1/employeeFarmerSurveys/status-count/me`,
      { method: "GET" },
      { skipGetRetry: true }
    );
    if (!res.ok) return null;
    return res.json();
  }, []);

  const { data: surveyStatusCount, loading: statusLoading } = useCachedFetch(
    cacheKeyEmployeeSurveyStatusCountMe(),
    fetchSurveyStatusCount,
    { ...swrOpts, tags: [...dashTags, CACHE_TAGS.EMPLOYEE_SURVEYS] }
  );

  const fetchStatusTotal = useCallback(async (status) => {
    const res = await authenticatedFetch(
      `${BASE_URL}/api/v1/employeeFarmerSurveys/me/status/${status}`,
      {},
      { skipGetRetry: true }
    );
    if (res.status === 404) return 0;
    if (!res.ok) return 0;
    const json = await res.json();
    return json?.totalElements ?? json?.data?.totalElements ?? 0;
  }, []);

  const fetchActivePie = useCallback(() => fetchStatusTotal("ACTIVE"), [fetchStatusTotal]);
  const fetchInactivePie = useCallback(() => fetchStatusTotal("INACTIVE"), [fetchStatusTotal]);

  const { data: activePieCount, loading: activeLoading } = useCachedFetch(
    cacheKeyEmployeeSurveyMeStatus("ACTIVE"),
    fetchActivePie,
    { ...swrOpts, tags: [...dashTags, CACHE_TAGS.EMPLOYEE_SURVEYS] }
  );
  const { data: inactivePieCount, loading: inactiveLoading } = useCachedFetch(
    cacheKeyEmployeeSurveyMeStatus("INACTIVE"),
    fetchInactivePie,
    { ...swrOpts, tags: [...dashTags, CACHE_TAGS.EMPLOYEE_SURVEYS] }
  );

  const fetchRecentFarmers = useCallback(async () => {
    const res = await authenticatedFetch(
      `${BASE_URL}/api/v1/employeeFarmerSurveys/my`,
      { method: "GET" },
      { skipGetRetry: true }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data?.content ?? [];
    return [...data].sort((a, b) => b.surveyId - a.surveyId).slice(0, 3);
  }, []);

  const { data: recentFarmers = [], loading: recentLoading } = useCachedFetch(
    cacheKeyEmployeeRecentSurveys(),
    fetchRecentFarmers,
    { ...swrOpts, tags: [...dashTags, CACHE_TAGS.EMPLOYEE_SURVEYS] }
  );

  const chartData = useMemo(
    () => [
      { name: "Active", value: activePieCount ?? 0, color: "#6a5acd" },
      { name: "Inactive", value: inactivePieCount ?? 0, color: "#ff9800" },
    ],
    [activePieCount, inactivePieCount]
  );

  const dashboardLoading =
    attLoading && statusLoading && activeLoading && inactiveLoading && recentLoading;

  const total = chartData.reduce((sum, item) => sum + item.value, 0) || 0;

  const userEmail = localStorage.getItem("userEmail");

  const userName = userEmail
    ? userEmail.split("@")[0].replace(".", " ").toUpperCase()
    : "EMPLOYEE";

  const handleFillSurvey = () => navigate("/employee/fill-farmer-survey");
  const handleUpdateData = () => navigate("/employee/update-farmer");
  const handleViewHistory = () => navigate("/employee/farmer-history");

  const renderLabel = ({ value }) => {
    const percent = ((value / total) * 100).toFixed(0);
    return `${percent}%`;
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    setAttendanceError('');

    try {
      if (todayAttendance && (todayAttendance.checkInTime || todayAttendance.checkedIn)) {
        showError('You have already checked in for today!');
        setCheckingIn(false);
        return;
      }

      const location = await locationService.getCurrentLocation();
      
      setCapturedLocation(location);
      setLocationAction('checkin');
      setShowLocationModal(true);
      
    } catch (err) {
      if (err.message.includes('Location') || err.message.includes('permission')) {
        showError('Please enable location access to check in. Go to your browser settings and allow location permission.');
      } else {
        showError(err.message || 'Check-in failed');
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const confirmCheckIn = async () => {
    setCheckingIn(true);
    
    try {
      const userId = Number(localStorage.getItem("userId"));
      if (!userId) {
        throw new Error('User ID not found');
      }

      const payload = {
        userId,
        date: new Date().toISOString().split("T")[0],
        attendanceStatus: "PRESENT",
        location: {
          latitude: capturedLocation.latitude,
          longitude: capturedLocation.longitude,
          address: capturedLocation.address
        }
      };

      const res = await authenticatedFetch(
        `${BASE_URL}/api/v1/attendance/mark`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Check-in failed");
      }
      
      success('Check-in successful! Your attendance has been recorded.');
      
      setShowLocationModal(false);
      setCapturedLocation(null);
      await refetchAttendance();
      
    } catch (err) {
      setAttendanceError(err.message || 'Check-in failed');
      setShowLocationModal(false);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    setAttendanceError('');

    try {
      if (!todayAttendance || (!todayAttendance.checkInTime && !todayAttendance.checkedIn)) {
        showError('You must check in first!');
        setCheckingOut(false);
        return;
      }

      if (todayAttendance.checkOutTime || todayAttendance.checkedOut) {
        showError('You have already checked out today!');
        setCheckingOut(false);
        return;
      }

      const location = await locationService.getCurrentLocation();
      
      setCapturedLocation(location);
      setLocationAction('checkout');
      setShowLocationModal(true);
      
    } catch (err) {
      if (err.message.includes('Location') || err.message.includes('permission')) {
        showError('Please enable location access to check out.');
      } else {
        showError(err.message || 'Check-out failed');
      }
    } finally {
      setCheckingOut(false);
    }
  };

  const confirmCheckOut = async () => {
    setCheckingOut(true);
    
    try {
      const userId = Number(localStorage.getItem("userId"));

      const payload = {
        userId,
        date: new Date().toISOString().split("T")[0],
        checkOut: true,
        location: {
          latitude: capturedLocation.latitude,
          longitude: capturedLocation.longitude,
          address: capturedLocation.address
        }
      };

      const res = await authenticatedFetch(
        `${BASE_URL}/api/v1/attendance/checkout`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Check-out failed");
      }
      
      success('Check-out successful! Have a great day!');
      
      setShowLocationModal(false);
      setCapturedLocation(null);
      await refetchAttendance();
      
    } catch (err) {
      setAttendanceError(err.message || 'Check-out failed');
      setShowLocationModal(false);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleRequestLeave = async () => {
    setRequestingLeave(true);
    setAttendanceError('');

    try {
      const userId = Number(localStorage.getItem("userId"));
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Validation
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

      const payload = {
        userId,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason,
        leaveType: leaveData.leaveType,
        status: 'PENDING'
      };

      const res = await authenticatedFetch(
        `${BASE_URL}/api/v1/attendance/leave/request`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Leave request failed");
      }

      success('Leave request submitted successfully! Admin will review your request.');
      
      // Reset form and close modal
      setLeaveData({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        leaveType: 'SICK_LEAVE'
      });
      setShowLeaveModal(false);
      
    } catch (err) {
      showError(err.message || 'Leave request failed');
    } finally {
      setRequestingLeave(false);
    }
  };

  return (
    <div className="employee-dashboard-content">
      {/* TOAST NOTIFICATIONS */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      
      <div className="top-bar dashboard-top-bar">
        <div className="date-box">
          {/* ATTENDANCE CHECK IN/OUT BUTTONS */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* If no attendance record exists, show check-in button */}
            {!todayAttendance ? (
              // NOT CHECKED IN - Show Check In Button
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                style={{
                  padding: '10px 20px',
                  backgroundColor: checkingIn ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: checkingIn ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>📍</span>
                {checkingIn ? 'Checking In...' : 'Check In'}
              </button>
            ) : (
              // ATTENDANCE RECORD EXISTS - User has checked in
              // Show status and checkout button
              <>
                <div style={{
                  padding: '10px 16px',
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>✓</span>
                  Checked In: {formatTo12Hour(todayAttendance.checkInTime) || 'Today'}
                </div>
                
                {/* CHECKOUT BUTTON - Always show if attendance exists and not checked out */}
                {!todayAttendance.checkOutTime && !todayAttendance.checkedOut && (
                  <button
                    onClick={handleCheckOut}
                    disabled={checkingOut}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: checkingOut ? '#ccc' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: checkingOut ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>🚪</span>
                    {checkingOut ? 'Checking Out...' : 'Check Out'}
                  </button>
                )}
                
                {/* CHECKED OUT STATUS - Show if checked out */}
                {(todayAttendance.checkOutTime || todayAttendance.checkedOut) && (
                  <div style={{
                    padding: '10px 16px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>✓</span>
                    Checked Out: {formatTo12Hour(todayAttendance.checkOutTime) || 'Today'}
                  </div>
                )}
              </>
            )}
            
            {/* LEAVE REQUEST BUTTON */}
            <button
              onClick={() => setShowLeaveModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ffc107',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>🏖️</span>
              Request Leave
            </button>
          </div>

          <span className="dot"></span>

          <span className="time-pill">
            <BsStopwatch />
            {new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          <div className="date-pill">
            <SlCalender />
            {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="profile">
          <RiAccountBoxFill size={50} />
          <div>
            <strong>{userName}</strong>
            <br />
            <small>ID: {localStorage.getItem("userId")}</small>
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {attendanceError && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #f5c6cb',
          fontSize: '14px'
        }}>
          {attendanceError}
        </div>
      )}

      <div className={`stats-row${dashboardLoading ? " dash-sk-employee-stats" : ""}`}>
        {dashboardLoading ? (
          <StatCardsSkeleton count={3} />
        ) : (
          <>
            <div className="stat-card total_data">
              <div className="card-left">
                <p>Total Data</p>
                <VscFileSubmodule size={40} />
              </div>
              <h1>{total}</h1>
            </div>

            <div
              className="stat-card surveys clickable"
              onClick={handleViewHistory}
            >
              <div className="card-left">
                <p>Surveys Completed</p>
                <span style={{ fontSize: "38px" }}>📋</span>
              </div>
              <h1>{surveyStatusCount?.completedCount ?? 0}</h1>
            </div>

            <div className="stat-card pending clickable" onClick={handleUpdateData}>
              <div className="card-left">
                <p>Pending Sync</p>
                <span style={{ fontSize: "38px" }}>🔄</span>
              </div>
              <h1>{surveyStatusCount?.pendingCount ?? 0}</h1>
            </div>
          </>
        )}
      </div>

      {/* QUICK ACTIONS - Now below stat cards */}
      <div className="quick-actions-section">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={handleFillSurvey}>
            <span className="action-icon">➕</span>
            <span className="action-text">Fill Farmer Survey</span>
          </button>
          <button className="quick-action-card" onClick={handleUpdateData}>
            <span className="action-icon">✏️</span>
            <span className="action-text">Update Farmer Data</span>
          </button>
          <button className="quick-action-card" onClick={handleViewHistory}>
            <span className="action-icon">📜</span>
            <span className="action-text">Farmer History</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/employee/my-leaves')}>
            <span className="action-icon">🏖️</span>
            <span className="action-text">My Leaves</span>
          </button>
        </div>
      </div>

      <div className="table-box">
        <h3>Recent Farmers</h3>
        {dashboardLoading ? (
          <EmployeeFarmersTableSkeleton rows={3} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>FARMER</th>
                  <th>VILLAGE</th>
                  <th>ACTION</th>
                  <th>DATE</th>
                </tr>
              </thead>

              <tbody>
                {recentFarmers.map((item, index) => (
                  <tr key={item.surveyId || index}>
                    <td data-label="Farmer">{item.farmerName || "N/A"}</td>
                    <td data-label="Village">
                      <span className="village-text">{item.village || "N/A"}</span>
                    </td>

                    <td data-label="Action">
                      {item.formStatus === "ACTIVE"
                        ? "SURVEY FILLED"
                        : "PENDING DATA"}
                    </td>
                    <td data-label="Date">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}

                {recentFarmers.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", color: "#888" }}
                    >
                      No recent farmers available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="chart-box">
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#333' }}>Farmer Survey Status</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Distribution of active and inactive farmer surveys</p>
        </div>
        {dashboardLoading ? (
          <PieChartAreaSkeleton height={300} />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                label={renderLabel}
                labelLine={true}
              >
                {chartData.map((item, index) => (
                  <Cell key={index} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="horizontal" verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* LOCATION CONFIRMATION MODAL */}
      {showLocationModal && capturedLocation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
                📍 Confirm Your Location
              </h2>
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setCapturedLocation(null);
                  setLocationAction('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                {locationAction === 'checkin' 
                  ? 'You are checking in from this location:' 
                  : 'You are checking out from this location:'}
              </p>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#555' }}>Coordinates:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#333' }}>
                    {capturedLocation.latitude.toFixed(6)}, {capturedLocation.longitude.toFixed(6)}
                  </p>
                </div>

                {capturedLocation.address && (
                  <div>
                    <strong style={{ color: '#555' }}>Address:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#333' }}>
                      {capturedLocation.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Map Link */}
              <a
                href={locationService.getMapLink(capturedLocation.latitude, capturedLocation.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}
              >
                🗺️ View on Google Maps
              </a>

              <p style={{ 
                fontSize: '13px', 
                color: '#856404', 
                backgroundColor: '#fff3cd', 
                padding: '12px', 
                borderRadius: '6px',
                margin: '16px 0 0 0'
              }}>
                ⚠️ This location will be recorded for attendance tracking. Please ensure you are at the correct location.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setCapturedLocation(null);
                  setLocationAction('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={locationAction === 'checkin' ? confirmCheckIn : confirmCheckOut}
                disabled={checkingIn || checkingOut}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (checkingIn || checkingOut) ? '#ccc' : (locationAction === 'checkin' ? '#28a745' : '#dc3545'),
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (checkingIn || checkingOut) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {checkingIn || checkingOut 
                  ? 'Processing...' 
                  : locationAction === 'checkin' 
                    ? '✓ Confirm Check In' 
                    : '✓ Confirm Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE REQUEST MODAL */}
      {showLeaveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
                🏖️ Request Leave
              </h2>
              <button
                onClick={() => setShowLeaveModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                Leave Type <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={leaveData.leaveType}
                onChange={(e) => setLeaveData({ ...leaveData, leaveType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              >
                <option value="SICK_LEAVE">Sick Leave</option>
                <option value="CASUAL_LEAVE">Casual Leave</option>
                <option value="EARNED_LEAVE">Earned Leave</option>
                <option value="UNPAID_LEAVE">Unpaid Leave</option>
                <option value="EMERGENCY_LEAVE">Emergency Leave</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                Start Date <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                value={leaveData.startDate}
                onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                End Date <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                value={leaveData.endDate}
                onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                min={leaveData.startDate}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                Reason <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={leaveData.reason}
                onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                placeholder="Please provide a reason for your leave request..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLeaveModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestLeave}
                disabled={requestingLeave}
                style={{
                  padding: '10px 20px',
                  backgroundColor: requestingLeave ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: requestingLeave ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {requestingLeave ? 'Submitting...' : 'Submit Request'}
              </button>
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
}

// Outer shell — shows spinner until AuthContext finishes bootstrapping,
// then mounts EmployeeDashboardContent which fires API calls with a guaranteed token.
export default function EmployeeDashboard() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (authLoading) {
    return <EmployeeDashboardAuthShell />;
  }

  if (!isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  return <EmployeeDashboardContent />;
}
