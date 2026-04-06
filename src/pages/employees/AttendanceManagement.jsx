import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Calendar, Users } from "lucide-react";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { BASE_URL } from "../../config/api";
import "./AttendanceManagement.css";

const AttendanceManagement = () => {
  const navigate = useNavigate();
  const { toasts, removeToast, error: showError } = useToast();
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/v1/employees/getUsers`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to fetch employees");
      
      const response = await res.json();
      
      let data = response.data || response;
      
      if (data.content && Array.isArray(data.content)) {
        data = data.content;
      }
      
      const employeeList = Array.isArray(data) ? data : [];
      
      setEmployees(employeeList);
    } catch (err) {
      setError(err.message);
      showError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = (employeeId) => {
    navigate(`/admin/attendance/employee/${employeeId}`);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === "" || 
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.userId?.toString().includes(searchTerm) ||
      employee.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="attendance-mgmt-container">
      {/* HEADER */}
      <div className="attendance-mgmt-header">
        <div className="attendance-mgmt-title">
          <h2>Attendance Management</h2>
          <p>View employee attendance records</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="attendance-mgmt-filters">
        <input 
          className="attendance-mgmt-input" 
          placeholder="Search by name, email or ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <button className="attendance-mgmt-clear-btn" onClick={handleClearFilters}>
          Clear
        </button>
      </div>

      {/* TABLE */}
      <div className="attendance-mgmt-table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <Loader2 className="spinner" size={40} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px', color: '#666' }}>Loading employees...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#dc3545" }}>
            <p>{error}</p>
            <button 
              onClick={fetchEmployees}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            <Users size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <p>No employees found</p>
            {searchTerm ? (
              <button 
                onClick={handleClearFilters}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Clear Search
              </button>
            ) : null}
          </div>
        ) : (
          <table className="attendance-mgmt-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.userId}>
                  <td>{employee.employeeCode || `EMP${employee.userId}`}</td>
                  <td>{employee.name || 'N/A'}</td>
                  <td>{employee.email}</td>
                  <td>{employee.mobile || '-'}</td>
                  <td>
                    <span className={`attendance-mgmt-status ${!employee.accountLocked ? 'active' : 'inactive'}`}>
                      {!employee.accountLocked ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td className="attendance-mgmt-actions">
                    <button
                      className="attendance-mgmt-view-btn"
                      onClick={() => handleViewAttendance(employee.userId)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Calendar size={16} />
                      View Attendance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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

export default AttendanceManagement;
 