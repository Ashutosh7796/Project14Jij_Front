import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { useRoleBasePath } from "../../hooks/useRoleBasePath";
import { fetchDashboardCardMetrics } from "../../api/dashboardMetrics";
import { useAuth } from "../../context/AuthContext";
import {
  AdminDashboardAuthShell,
  StatCardsSkeleton,
  SummarySkeleton,
} from "./DashboardSkeletons";
import "./styles/AdminDashboards.css";

const StatCard = ({ label, value, icon }) => (
  <div className="stat-card-green">
    <div className="stat-main">
      <p>{label}</p>
      <h3>{value ?? "0"}</h3>
    </div>
    <div className="stat-icon-bg">{icon}</div>
  </div>
);

function ManagerDashboardContent() {
  const base = useRoleBasePath();
  const fetchMetrics = useCallback(() => fetchDashboardCardMetrics(), []);
  const { data: metrics, loading: metricsLoading } = useFetch(fetchMetrics);

  const m = metrics ?? { employees: 0 };
  const statCards = [
    {
      label: "Employees",
      value: m.employees,
      icon: "👩‍💻",
    },
  ];

  return (
    <div className="dashboard-wrapper">
      <div className="content-box" style={{ marginBottom: "18px" }}>
        <div className="box-header">
          <h2>Manager overview</h2>
        </div>
        <p style={{ margin: 0, color: "#4b5563", fontSize: "14px", lineHeight: 1.5 }}>
          You can manage employees, attendance, and leave requests. Product, order, and farmer
          admin tools are not available in this portal.
        </p>
      </div>

      <div className="stats-grid">
        {metricsLoading ? (
          <StatCardsSkeleton count={1} />
        ) : (
          statCards.map((c) => <StatCard key={c.label} {...c} />)
        )}
      </div>

      <div className="content-box" style={{ marginTop: "20px" }}>
        <div className="box-header">
          <h2>Quick actions</h2>
        </div>
        <div className="quick-actions-grid">
          <Link to={`${base}/employees`} className="quick-action-card">
            <span className="action-icon">👥</span>
            <span className="action-text">Manage employees</span>
          </Link>
          <Link to={`${base}/employees/add`} className="quick-action-card">
            <span className="action-icon">➕</span>
            <span className="action-text">Add employee</span>
          </Link>
          <Link to={`${base}/attendance`} className="quick-action-card">
            <span className="action-icon">📋</span>
            <span className="action-text">View attendance</span>
          </Link>
          <Link to={`${base}/leave-management`} className="quick-action-card">
            <span className="action-icon">🏖️</span>
            <span className="action-text">Leave requests</span>
          </Link>
        </div>
      </div>

      <div className="content-box" style={{ marginTop: "20px" }}>
        <div className="box-header">
          <h2>Summary</h2>
        </div>
        {metricsLoading ? (
          <SummarySkeleton />
        ) : (
          <div className="work-stats-panel">
            <div className="work-row">
              <div className="work-cell">
                Employees: <span className="val">{m.employees}</span>
              </div>
              <div className="work-cell">Use the sidebar for day-to-day HR tasks.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return <AdminDashboardAuthShell />;
  }

  return <ManagerDashboardContent />;
}
