import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { adminApi } from '../../api/adminApi';
import {
  CACHE_TAGS,
  SWR_FRESH_MS,
  SWR_STALE_MS,
  cacheKeyDashboardMetrics,
  cacheKeyAdminRecentFarmers,
} from '../../cache/cacheKeys';
import { fetchDashboardCardMetrics } from '../../api/dashboardMetrics';
import { useAuth } from '../../context/AuthContext';
import {
  AdminDashboardAuthShell,
  StatCardsSkeleton,
  OrderTrackSkeleton,
  SummarySkeleton,
  FarmersTableSkeleton,
} from './DashboardSkeletons';
import './styles/AdminDashboards.css';

/* ─── helpers ─────────────────────────────────────────────── */

const STATUS_CLASS = {
  ACTIVE:   'status-active',
  PENDING:  'status-pending',
  DONE:     'status-done',
  COMPLETE: 'status-done',
};

function statusClass(val = '') {
  return STATUS_CLASS[val.toUpperCase()] ?? '';
}

const GRAPH_DATA = [
  { label: 'Wk 1', actual: 60, plan: 90 },
  { label: 'Wk 2', actual: 80, plan: 85 },
  { label: 'Wk 3', actual: 40, plan: 95 },
  { label: 'Wk 4', actual: 70, plan: 88 },
  { label: 'Wk 5', actual: 75, plan: 92 },
  { label: 'Wk 6', actual: 65, plan: 80 },
  { label: 'Wk 7', actual: 30, plan: 85 },
  { label: 'Wk 8', actual: 85, plan: 95 },
];

/* ─── reusable sub-components ─────────────────────────────── */

const StatCard = ({ label, value, icon }) => (
  <div className="stat-card-green">
    <div className="stat-main">
      <p>{label}</p>
      <h3>{value ?? '0'}</h3>
    </div>
    <div className="stat-icon-bg">{icon}</div>
  </div>
);

/** Friendly empty / unavailable state — no red, no alarm */
const EmptyState = ({ icon, title, subtitle }) => (
  <div className="dash-empty-state">
    <div className="dash-empty-icon">{icon}</div>
    <p className="dash-empty-title">{title}</p>
    {subtitle && <p className="dash-empty-sub">{subtitle}</p>}
  </div>
);

/* ─── main component ──────────────────────────────────────── */

// Inner component — only mounted after auth is confirmed ready.
// Cached fetches share the request cache (SWR + dedupe + tag invalidation).
const DashboardContent = () => {
  const fetchMetrics = useCallback(() => fetchDashboardCardMetrics(), []);
  const fetchOrders = useCallback(() => adminApi.getAllFarmers(0, 5), []);

  const metricsCacheOpts = useMemo(
    () => ({
      swr: true,
      freshMs: SWR_FRESH_MS,
      staleMs: SWR_STALE_MS,
      tags: [CACHE_TAGS.ADMIN_DASHBOARD_METRICS],
    }),
    []
  );
  const farmersCacheOpts = useMemo(
    () => ({
      swr: true,
      freshMs: SWR_FRESH_MS,
      staleMs: SWR_STALE_MS,
      tags: [CACHE_TAGS.ADMIN_RECENT_FARMERS],
    }),
    []
  );

  const { data: metrics, loading: metricsLoading } = useCachedFetch(
    cacheKeyDashboardMetrics('admin'),
    fetchMetrics,
    metricsCacheOpts
  );
  const { data: ordersData, loading: ordersLoading } = useCachedFetch(
    cacheKeyAdminRecentFarmers(0, 5),
    fetchOrders,
    farmersCacheOpts
  );

  const m = useMemo(
    () =>
      metrics ?? {
        totalUsers: 0,
        employees: 0,
        products: 0,
        orders: 0,
        orderTrack: null,
      },
    [metrics]
  );

  const graphData = useMemo(() => {
    if (metricsLoading) return [];
    const raw = metrics?.orderTrack;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((p) => ({
        label: p.label || 'Wk',
        plan: Number(p.plan) || 0,
        actual: Number(p.actual) || 0,
      }));
    }
    return GRAPH_DATA;
  }, [metricsLoading, metrics]);

  const graphPeak = useMemo(
    () => Math.max(1, ...graphData.map((d) => Math.max(d.plan, d.actual))),
    [graphData]
  );

  const statCards = [
    { label: 'Total Users',  value: m.totalUsers,  icon: '👤' },
    { label: 'Employees',    value: m.employees,   icon: '👩‍💻' },
    { label: 'Products',     value: m.products,    icon: '📦' },
    { label: 'Total Orders', value: m.orders,      icon: '🛍️' },
  ];

  const ordersList = (() => {
    if (!ordersData) return [];
    if (Array.isArray(ordersData)) return ordersData;
    if (Array.isArray(ordersData.content)) return ordersData.content;
    if (Array.isArray(ordersData.data?.content)) return ordersData.data.content;
    if (Array.isArray(ordersData.data)) return ordersData.data;
    return [];
  })();

  return (
    <div className="dashboard-wrapper">

      {/* ── STAT CARDS ── */}
      <div className="stats-grid">
        {metricsLoading ? (
          <StatCardsSkeleton />
        ) : (
          statCards.map((c) => <StatCard key={c.label} {...c} />)
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="content-box" style={{ marginTop: '20px' }}>
        <div className="box-header"><h2>Quick Actions</h2></div>
        <div className="quick-actions-grid">
          <Link to="/admin/employees/add"    className="quick-action-card"><span className="action-icon">➕</span><span className="action-text">Add Employee</span></Link>
          <Link to="/admin/attendance"       className="quick-action-card"><span className="action-icon">📋</span><span className="action-text">View Attendance</span></Link>
          <Link to="/admin/leave-management" className="quick-action-card"><span className="action-icon">🏖️</span><span className="action-text">Leave Requests</span></Link>
          <Link to="/admin/employees"        className="quick-action-card"><span className="action-icon">👥</span><span className="action-text">Manage Employees</span></Link>
        </div>
      </div>

      {/* ── RECENT FARMERS / ORDERS ── */}
      <div className="content-box">
        <div className="box-header"><h2>Recent Farmers / Orders</h2></div>
        {ordersLoading ? (
          <FarmersTableSkeleton rows={5} />
        ) : ordersList.length === 0 ? (
          <EmptyState
            icon="🌾"
            title="No farmer records yet"
            subtitle="Registered farmers will appear here once surveys are submitted."
          />
        ) : (
          <div className="table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th><th>NAME</th><th>MOBILE</th><th>DISTRICT</th><th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {ordersList.map((row, i) => (
                  <tr key={row.id ?? row.surveyId ?? i}>
                    <td>{row.id ?? row.surveyId ?? '—'}</td>
                    <td>{row.farmerName ?? row.name ?? '—'}</td>
                    <td>{row.farmerMobile ?? row.mobile ?? '—'}</td>
                    <td>{row.district ?? '—'}</td>
                    <td className={statusClass(row.status ?? '')}>{row.status ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="see-more-link">
          <Link to="/admin/farmers">See More &raquo;</Link>
        </div>
      </div>

      {/* ── GRAPH + SUMMARY ── */}
      <div className="middle-grid">
        <div className="content-box">
          <div className="box-header">
            <h2>Order Track</h2>
            <div className="chart-legend">
              <span className="legend-item"><i className="legend-dot plan"></i> Plan</span>
              <span className="legend-item"><i className="legend-dot actual"></i> Actual</span>
            </div>
          </div>
          {metricsLoading ? (
            <OrderTrackSkeleton />
          ) : (
            <div className="graph-container">
              <div className="y-axis">
                <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
              </div>
              <div className="bars-wrapper">
                {graphData.map((d) => (
                  <div key={d.label} className="bar-group">
                    <div className="bar-stacked">
                      <div
                        className="bar-plan"
                        style={{ height: `${(d.plan / graphPeak) * 100}%` }}
                      />
                      <div
                        className="bar-actual"
                        style={{ height: `${(d.actual / graphPeak) * 100}%` }}
                      />
                    </div>
                    <span className="bar-label">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="chart-footer-months">
            <span>8 weeks ago</span><span>4 weeks ago</span><span>This week</span>
          </div>
        </div>

        <div className="content-box">
          <div className="box-header"><h2>Summary</h2></div>
          {metricsLoading ? (
            <SummarySkeleton />
          ) : (
            <div className="work-stats-panel">
              <div className="work-row">
                <div className="work-cell">Total Users: <span className="val">{m.totalUsers}</span></div>
                <div className="work-cell">Employees: <span className="val">{m.employees}</span></div>
              </div>
              <div className="work-row">
                <div className="work-cell">Products: <span className="val-green">{m.products}</span></div>
                <div className="work-cell">Orders: <span className="val-green">{m.orders}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

// Outer shell — shows spinner until AuthContext finishes bootstrapping,
// then mounts DashboardContent which fires API calls with a guaranteed token.
const Dashboard = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return <AdminDashboardAuthShell />;
  }

  return <DashboardContent />;
};

export default Dashboard;
