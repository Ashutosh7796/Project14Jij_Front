import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, MapPin } from "lucide-react";
import { locationService } from "../../utils/locationService";
import { BASE_URL } from "../../config/api";
import "./Attendence.css";

export default function ViewAttendance() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summaryData, setSummaryData] = useState({ present: 0, leave: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        // 1. Fetch Monthly Summary (Table)
        const summaryRes = await fetch(
          `${BASE_URL}/api/v1/attendance/me/monthly-summary?month=${selectedMonth}&year=${selectedYear}`,
          { method: "GET", headers }
        );

        // 2. Fetch Monthly Report (Cards)
        const reportRes = await fetch(
          `${BASE_URL}/api/v1/attendance/me/monthly-report?month=${selectedMonth}&year=${selectedYear}`,
          { method: "GET", headers }
        );

        // --- HANDLE 404 SPECIFICALLY FOR THE REPORT ---
        if (reportRes.status === 404) {
          setSummaryData({ present: 0, leave: 0, absent: 0 });
        } else if (reportRes.ok) {
          const reportJson = await reportRes.json();
          const reportData = reportJson.data || reportJson;
          setSummaryData({
            present: reportData.presentCount || reportData.present || 0,
            leave: reportData.leaveCount || reportData.leave || 0,
            absent: reportData.absentCount || reportData.absent || 0,
          });
        }

        // --- HANDLE SUMMARY RESPONSE ---
        if (summaryRes.status === 404) {
           setAttendance([]); // Clear table if no data
        } else if (summaryRes.ok) {
          const summaryJson = await summaryRes.json();
          const finalSummaryData = summaryJson.data || summaryJson;
          setEmployee(finalSummaryData);
          setAttendance(finalSummaryData.records || []);
        } else if (summaryRes.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        } else {
          throw new Error("Failed to fetch records");
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate, selectedMonth, selectedYear]);

  const isMobile = windowWidth <= 768;

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
    <div className="attendance-page-main" style={{ padding: isMobile ? "10px" : "0" }}>
      <div className="back-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={isMobile ? 18 : 22} />
          <span>Back</span>
        </button>

        <div className="picker-container" style={{ display: 'flex', gap: '8px' }}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
            {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="attendance-page" style={{ padding: isMobile ? "15px" : "20px 24px" }}>
        {loading ? (
          <div style={{ display: 'flex', height: '400px', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <Loader2 className="animate-spin" size={40} color="#007bff" />
            <p>Syncing data...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <AlertCircle size={48} color="red" />
            <p>{error}</p>
            <button className="back-btn" onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <>
            <div className="employee-info">
              <div className="avatar">{employee?.employee?.firstName?.charAt(0) || "U"}</div>
              <div>
                <h2>{employee?.employee?.firstName || "User"} {employee?.employee?.lastName || ""}</h2>
                <p>{employee?.employee?.employeeCode || "ID: N/A"}</p>
              </div>
            </div>

            <h3 className="month-title">Summary for {months.find(m => m.val === selectedMonth).name} {selectedYear}</h3>

            <div className="summary-cards" style={{ flexDirection: isMobile ? "column" : "row", gap: "16px" }}>
              <div className="summary-card present"><span>Present</span><strong>{summaryData.present}</strong></div>
              <div className="summary-card leave"><span>Leave</span><strong>{summaryData.leave}</strong></div>
              <div className="summary-card absent"><span>Absent</span><strong>{summaryData.absent}</strong></div>
            </div>

            <h4 className="daily-heading">Daily Attendance</h4>
            <div className="attendance-table">
              <div style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ minWidth: "600px", width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Date</th><th>Day</th><th>Status</th><th>Check-in</th><th>Check-out</th><th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length > 0 ? (
                      attendance.map((item, index) => (
                        <tr key={index}>
                          <td>{item.date}</td>
                          <td>{item.day}</td>
                          <td><span className={`status ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                          <td>{item.checkInTime || item.checkIn || "-"}</td>
                          <td>{item.checkOutTime || item.checkOut || "-"}</td>
                          <td>
                            {item.location ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <MapPin size={14} />
                                <a 
                                  href={locationService.getMapLink(item.location.latitude, item.location.longitude)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#007bff', textDecoration: 'none' }}
                                  title={item.location.address || 'View on map'}
                                >
                                  View
                                </a>
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                          No attendance records found for this month.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
