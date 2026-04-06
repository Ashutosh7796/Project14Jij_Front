import React from 'react';
import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { adminApi } from '../../api/adminApi';
import './OrdersDetails.css';

const OrderDetail = () => {
  const { id } = useParams();
  const { data: order, loading } = useFetch(
    () => adminApi.getOrderById(id),
    [id]
  );

  if (loading) return <div className="loading">Loading...</div>;

  // Use API data or fallback to the provided static example for UI matching
  const data = order || {
    name: 'Ramesh Patil',
    userName: 'Ramesh Patil',
    phone: 'XXXXX XXXXX',
    empId: 'XXXXX XXXXX',
    address: 'Village Pune, Maharashtra',
    paymentMethod: 'Online',
    paymentStatus: 'Paid',
    transactionId: 'TXN98765',
    placedDate: '12 Mar, 10:30 AM',
    items: [
      { name: 'Tomato Seeds', qty: '02', price: 120, total: 240 },
      { name: 'Wheat Grain', qty: '5kg', price: 122, total: 610 },
      { name: 'Tomato Seeds', qty: '02', price: 120, total: 240 },
      { name: 'Wheat Grain', qty: '5kg', price: 122, total: 610 },
      { name: 'Tomato Seeds', qty: '02', price: 120, total: 240 },
      { name: 'Wheat Grain', qty: '5kg', price: 122, total: 610 },
    ]
  };

  return (
    <div className="order-details-wrapper">
      <h3 className="page-title">Order Details</h3>

      {/* ===== CUSTOMER INFORMATION ===== */}
      <div className="section">
        <div className="section-bar">Customer Information</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Name</span><span>: {data.name}</span></div>
          <div className="kv-item"><span>User Name</span><span>: {data.userName}</span></div>
          <div className="kv-item"><span>Phone No</span><span>: {data.phone}</span></div>
          <div className="kv-item"><span>Emp ID</span><span>: {data.empId}</span></div>
          <div className="kv-item full"><span>Addres</span><span>: {data.address}</span></div>
        </div>
      </div>

      {/* ===== ORDER ITEMS TABLE ===== */}
      <div className="section">
        <div className="section-bar">Order Items</div>
        <div className="table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.price}</td>
                  <td>₹{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PAYMENT DETAILS ===== */}
      <div className="section">
        <div className="section-bar">Payment Details</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Payment Method</span><span>: {data.paymentMethod}</span></div>
          <div className="kv-item full"><span>Payment Status</span><span className="bold">: {data.paymentStatus}</span></div>
          <div className="kv-item"><span>Transaction ID</span><span>: {data.transactionId}</span></div>
        </div>
      </div>

      {/* ===== ORDER STATUS TIMELINE ===== */}
      <div className="section">
        <div className="section-bar">Order Status Timeline</div>
        <div className="timeline">
          <div className="timeline-row">
            <span className="label">Order</span>
            <span className="separator">:</span>
            <span className="status-text">Placed</span>
            <span className="timestamp">{data.placedDate}</span>
          </div>
          <div className="timeline-row status-delivered">
            <div className="check-box">
               <span className="check-icon">✓</span>
            </div>
            <span className="delivered-text">Delivered</span>
          </div>
        </div>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="action-footer">
        <button className="cancel-btn">Cancel</button>
      </div>
    </div>
  );
};

export default OrderDetail;