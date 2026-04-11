import React from 'react';

/** Shared pulse / shimmer for dashboard placeholders */
function ShimmerBlock({ className = '', style = {} }) {
  return <div className={`dash-sk-block ${className}`.trim()} style={style} />;
}

export function StatCardsSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="dash-sk-stat-card" aria-hidden>
          <div className="dash-sk-stat-text">
            <ShimmerBlock className="dash-sk-line dash-sk-line--title" />
            <ShimmerBlock className="dash-sk-line dash-sk-line--value" />
          </div>
          <ShimmerBlock className="dash-sk-stat-icon" />
        </div>
      ))}
    </>
  );
}

/** Pie / donut chart placeholder (employee, lab dashboards) */
export function PieChartAreaSkeleton({ height = 280 }) {
  return (
    <div
      className="dash-sk-pie-area"
      style={{ minHeight: height }}
      aria-busy="true"
      aria-label="Loading chart"
    >
      <div className="dash-sk-pie-ring" />
    </div>
  );
}

/** Employee “Recent farmers” table (4 columns) */
export function EmployeeFarmersTableSkeleton({ rows = 3 }) {
  return (
    <div className="table-scroll dash-sk-table-wrap" aria-busy="true" aria-label="Loading recent farmers">
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
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              {[1, 2, 3, 4].map((c) => (
                <td key={c}>
                  <ShimmerBlock className={`dash-sk-line dash-sk-line--cell dash-sk-line--cell-${c}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lab “Recent farmers” wide table */
export function LabFarmersTableSkeleton({ rows = 4 }) {
  return (
    <div className="lab-table-scroll dash-sk-table-wrap" aria-busy="true" aria-label="Loading recent farmers">
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
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              {[1, 2, 3, 4, 5, 6].map((c) => (
                <td key={c}>
                  <ShimmerBlock
                    className="dash-sk-line dash-sk-line--cell"
                    style={{ maxWidth: c === 1 ? 72 : c === 5 ? 180 : 110 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Farmer user dashboard — recent orders (2 columns) */
export function UserOrdersTableSkeleton({ rows = 4 }) {
  return (
    <div className="user-dashboard__table-wrap ud-sk-table" aria-busy="true" aria-label="Loading orders">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              <td>
                <ShimmerBlock className="dash-sk-line ud-sk-line--wide" />
              </td>
              <td>
                <ShimmerBlock className="dash-sk-line ud-sk-line--short" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Farmer user dashboard — product cards grid */
export function UserProductsGridSkeleton({ cards = 6 }) {
  return (
    <div className="user-dashboard__products ud-sk-products" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: cards }, (_, i) => (
        <article key={i} className="user-dashboard__product ud-sk-product-card">
          <div className="user-dashboard__product-visual ud-sk-product-visual" />
          <div className="user-dashboard__product-body ud-sk-product-body">
            <ShimmerBlock className="dash-sk-line ud-sk-line--title" />
            <ShimmerBlock className="dash-sk-line ud-sk-line--price" />
            <ShimmerBlock className="dash-sk-line ud-sk-line--btn" />
          </div>
        </article>
      ))}
    </div>
  );
}

/** Employee portal while auth bootstraps */
export function EmployeeDashboardAuthShell() {
  return (
    <div className="employee-dashboard-content" aria-busy="true" aria-label="Loading employee dashboard">
      <div className="top-bar dashboard-top-bar emp-sk-auth-bar">
        <div className="emp-sk-auth-left">
          <ShimmerBlock className="dash-sk-line emp-sk-pill" />
          <ShimmerBlock className="dash-sk-line emp-sk-pill" />
          <ShimmerBlock className="dash-sk-line emp-sk-pill" />
        </div>
        <ShimmerBlock className="dash-sk-line emp-sk-profile" />
      </div>
      <div className="stats-row dash-sk-employee-stats">
        <StatCardsSkeleton count={3} />
      </div>
      <div className="quick-actions-section">
        <ShimmerBlock className="dash-sk-line emp-sk-qa-heading" />
        <div className="quick-actions-grid emp-sk-qa-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="quick-action-card emp-sk-qa-card" aria-hidden>
              <div className="dash-sk-block emp-sk-qa-icon" />
              <ShimmerBlock className="dash-sk-line emp-sk-qa-text" />
            </div>
          ))}
        </div>
      </div>
      <div className="table-box">
        <h3>Recent Farmers</h3>
        <EmployeeFarmersTableSkeleton rows={3} />
      </div>
      <div className="chart-box">
        <ShimmerBlock className="dash-sk-line emp-sk-chart-title" />
        <PieChartAreaSkeleton height={300} />
      </div>
    </div>
  );
}

/** Lab portal while auth bootstraps */
export function LabDashboardAuthShell() {
  return (
    <div className="lab-dashboard-content" aria-busy="true" aria-label="Loading lab dashboard">
      <div className="lab-top-bar lab-sk-auth-top">
        <div className="lab-date-box lab-sk-auth-dates">
          <ShimmerBlock className="dash-sk-line lab-sk-pill" />
          <ShimmerBlock className="dash-sk-line lab-sk-pill" />
          <ShimmerBlock className="dash-sk-line lab-sk-pill" />
        </div>
        <ShimmerBlock className="dash-sk-line lab-sk-profile-block" />
      </div>
      <div className="lab-stats-row">
        {[1, 2, 3].map((i) => (
          <div key={i} className="lab-stat-card lab-sk-stat-fake" aria-hidden>
            <div className="lab-card-left">
              <ShimmerBlock className="dash-sk-line lab-sk-stat-label" />
              <ShimmerBlock className="dash-sk-line lab-sk-stat-icon" />
            </div>
            <ShimmerBlock className="dash-sk-line lab-sk-stat-value" />
          </div>
        ))}
        <div className="lab-quick-box lab-sk-quick-fake" aria-hidden>
          <ShimmerBlock className="dash-sk-line lab-sk-quick-h" />
          <ShimmerBlock className="dash-sk-line lab-sk-quick-btn" />
        </div>
      </div>
      <div className="lab-table-box">
        <h3>Recent Farmers</h3>
        <LabFarmersTableSkeleton rows={4} />
      </div>
      <div className="lab-chart-box">
        <PieChartAreaSkeleton height={220} />
      </div>
    </div>
  );
}

/** Farmer (USER) portal while auth bootstraps */
export function UserDashboardAuthShell() {
  return (
    <div className="user-dashboard" aria-busy="true" aria-label="Loading your dashboard">
      <header className="user-dashboard__hero ud-sk-auth-hero">
        <div className="user-dashboard__hero-inner">
          <ShimmerBlock className="dash-sk-line ud-sk-eyebrow" />
          <ShimmerBlock className="dash-sk-line ud-sk-title" />
          <ShimmerBlock className="dash-sk-line ud-sk-sub" />
        </div>
        <ShimmerBlock className="dash-sk-line ud-sk-wa" />
      </header>
      <div className="user-dashboard__grid">
        {[1, 2].map((i) => (
          <section key={i} className="user-dashboard__panel">
            <div className="user-dashboard__panel-head">
              <ShimmerBlock className="dash-sk-line ud-sk-panel-h" />
            </div>
            <div className="user-dashboard__panel-body">
              <ShimmerBlock className="dash-sk-line ud-sk-panel-line" />
              <ShimmerBlock className="dash-sk-line ud-sk-panel-line" />
            </div>
          </section>
        ))}
      </div>
      <div className="ud-sk-section-head" aria-hidden>
        <ShimmerBlock className="dash-sk-line ud-sk-section-title" />
      </div>
      <UserProductsGridSkeleton cards={6} />
    </div>
  );
}

/** Admin / manager layout while auth bootstraps */
export function AdminDashboardAuthShell() {
  return (
    <div className="dashboard-wrapper dash-sk-auth-shell" aria-busy="true" aria-label="Loading dashboard">
      <div className="content-box" style={{ marginBottom: 18 }}>
        <div className="box-header">
          <ShimmerBlock className="dash-sk-line dash-sk-line--auth-title" />
        </div>
        <ShimmerBlock className="dash-sk-line dash-sk-line--auth-sub" style={{ marginTop: 12 }} />
      </div>
      <div className="stats-grid">
        <StatCardsSkeleton count={4} />
      </div>
      <div className="middle-grid">
        <div className="content-box">
          <div className="box-header">
            <ShimmerBlock className="dash-sk-line dash-sk-line--auth-title" />
          </div>
          <OrderTrackSkeleton />
        </div>
        <div className="content-box">
          <div className="box-header">
            <ShimmerBlock className="dash-sk-line dash-sk-line--auth-title" />
          </div>
          <SummarySkeleton />
        </div>
      </div>
    </div>
  );
}

export function OrderTrackSkeleton() {
  return (
    <div className="graph-container dash-sk-graph" aria-busy="true" aria-label="Loading chart">
      <div className="y-axis">
        {[100, 75, 50, 25, 0].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <div className="bars-wrapper">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bar-group">
            <div className="bar-stacked dash-sk-bar-stack">
              <div
                className="dash-sk-bar-single"
                style={{
                  height: `${32 + ((i * 11) % 58)}%`,
                  animationDelay: `${i * 0.06}s`,
                }}
              />
            </div>
            <ShimmerBlock
              className="dash-sk-line dash-sk-line--wk"
              style={{ animationDelay: `${i * 0.06}s` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummarySkeleton() {
  return (
    <div className="work-stats-panel dash-sk-summary" aria-busy="true" aria-label="Loading summary">
      <div className="work-row">
        <div className="work-cell dash-sk-summary-cell">
          <ShimmerBlock className="dash-sk-line dash-sk-line--wide" />
        </div>
        <div className="work-cell dash-sk-summary-cell">
          <ShimmerBlock className="dash-sk-line dash-sk-line--wide" />
        </div>
      </div>
      <div className="work-row">
        <div className="work-cell dash-sk-summary-cell">
          <ShimmerBlock className="dash-sk-line dash-sk-line--wide" />
        </div>
        <div className="work-cell dash-sk-summary-cell">
          <ShimmerBlock className="dash-sk-line dash-sk-line--wide" />
        </div>
      </div>
    </div>
  );
}

export function FarmersTableSkeleton({ rows = 5 }) {
  return (
    <div className="table-scroll dash-sk-table-wrap" aria-busy="true" aria-label="Loading recent farmers">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>NAME</th>
            <th>MOBILE</th>
            <th>DISTRICT</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              {[1, 2, 3, 4, 5].map((c) => (
                <td key={c}>
                  <ShimmerBlock
                    className={`dash-sk-line dash-sk-line--cell dash-sk-line--cell-${c}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
