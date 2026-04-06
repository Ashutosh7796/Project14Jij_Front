import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
 
import { BsStopwatch } from "react-icons/bs";
import { SlCalender } from "react-icons/sl";
import { RiAccountBoxFill } from "react-icons/ri";
import { VscFileSubmodule } from "react-icons/vsc";
 
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
 
import { BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import "./styles/LabDashboard.css";
 
/* ================= STATIC DATA ================= */
const STATIC_CHART_DATA = [
  { name: "Completed", value: 100, color: "#6a5acd" },
];
 
const STATIC_TOTAL_REPORTS = 100;
const STATIC_PENDING_REPORTS = 0;

/* ================= Inner component — only mounted after auth is ready ================= */
function LabDashboardContent() {
  const navigate = useNavigate();
 
  /* ================= STATIC STATES ================= */
  const [attendanceStatus, setAttendanceStatus] = useState("PRESENT");
  const [chartData] = useState(STATIC_CHART_DATA);
  const [labReportCount] = useState(STATIC_TOTAL_REPORTS);
 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
 
  /* ================= RECENT FARMERS ================= */
  const [recentFarmers, setRecentFarmers] = useState([]);
 
  const userEmail = localStorage.getItem("userEmail");
  const userName = userEmail
    ? userEmail.split("@")[0].replace(".", " ").toUpperCase()
    : "LAB USER";
 
  const total = chartData.reduce((s, i) => s + i.value, 0);
  const renderLabel = ({ value }) =>
    `${total ? Math.round((value / total) * 100) : 0}%`;
 
  /* ================= FETCH LATEST 3 REPORTS ================= */
  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    // Cannot fetch employee surveys from Lab Role.
    // Set to empty list as there is no provided backend API to list reports.
    setRecentFarmers([]);
  };
 
  /* ================= UI ================= */
  return (
    <div className="lab-dashboard-content">
      {/* ================= TOP BAR ================= */}
      <div className="lab-top-bar">
        <div className="lab-date-box">
          <select
            className="lab-status-dropdown"
            value={attendanceStatus}
            onChange={(e) => setAttendanceStatus(e.target.value)}
          >
            <option value="PRESENT">Present</option>
            <option value="LEAVE">Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
 
          <span className="lab-dot"></span>
 
          <span className="lab-time-pill">
            <BsStopwatch />
            {new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
 
          <div
            className="lab-date-pill"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          >
            <SlCalender />
            {selectedDate.toLocaleDateString()}
          </div>
 
          {isCalendarOpen && (
            <div className="lab-datepicker-wrapper">
              <DatePicker
                inline
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setIsCalendarOpen(false);
                }}
              />
            </div>
          )}
        </div>
 
        <div className="lab-profile">
          <RiAccountBoxFill size={50} />
          <div>
            <strong>{userName}</strong>
            <br />
            <small>ID: {localStorage.getItem("userId")}</small>
          </div>
        </div>
      </div>
 
      {/* ================= CARDS ================= */}
      <div className="lab-stats-row">
        <div className="lab-stat-card">
          <div className="lab-card-left">
            <p>Total Reports</p>
            <VscFileSubmodule size={40} />
          </div>
          <h1>{labReportCount}</h1>
        </div>
 
        <div className="lab-stat-card">
          <div className="lab-card-left">
            <p>Reports Completed</p>
            <span style={{ fontSize: "38px" }}>📋</span>
          </div>
          <h1>100</h1>
        </div>
 
        <div className="lab-stat-card">
          <div className="lab-card-left">
            <p>Pending Reports</p>
            <span style={{ fontSize: "38px" }}>🔄</span>
          </div>
          <h1>{STATIC_PENDING_REPORTS}</h1>
        </div>
 
        <div className="lab-quick-box">
          <h4>Quick Actions</h4>
          <button onClick={() => navigate("/lab/report")}>
            📄 Lab Reports
          </button>
        </div>
      </div>
 
      {/* ================= RECENT FARMERS TABLE ================= */}
      <div className="lab-table-box">
        <h3>Recent Farmers</h3>
 
        <div className="lab-table-scroll">
          <table>
            <thead>
              <tr>
                <th>FORM NUMBER</th>
                <th>FARMER NAME</th>
                <th>MOBILE</th>
                <th>LAND AREA</th>
                <th>ADDRESS</th>
                <th>FORM STATUS</th>
              </tr>
            </thead>
 
            <tbody>
              {recentFarmers.length > 0 ? (
                recentFarmers.map((r) => (
                  <tr key={r.surveyId}>
                    <td>{r.formNumber || `FORM-${r.surveyId}`}</td>
                    <td>{r.farmerName || "N/A"}</td>
                    <td>{r.farmerMobile || "N/A"}</td>
                    <td>{r.landArea ?? "0"}</td>
                    <td>{r.address || r.village || "N/A"}</td>
                    <td>
                      <span className="status-text complete">
                        {r.status || "Complete"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", color: "#888" }}
                  >
                    No recent farmers available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
 
      {/* ================= CHART ================= */}
      <div className="lab-chart-box">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={0}
              label={renderLabel}
            >
              {chartData.map((item, index) => (
                <Cell key={index} fill={item.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Outer shell — shows spinner until AuthContext finishes bootstrapping,
// then mounts LabDashboardContent which fires API calls with a guaranteed token.
export default function LabDashboard() {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return <LabDashboardContent />;
}
 