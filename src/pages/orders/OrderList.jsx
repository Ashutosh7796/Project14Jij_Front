import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { adminApi } from '../../api/adminApi';
import { Search, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import './Order.css';

// Dummy data
const dummyOrders = [
  {
    id: '10231',
    customerName: 'Ramesh',
    orderDate: '2025-03-12',
    totalAmount: 850,
    paymentStatus: 'Paid',
    orderStatus: 'Pending'
  },
  {
    id: '10231',
    customerName: 'Anita',
    orderDate: '2025-03-12',
    totalAmount: 430,
    paymentStatus: 'COD',
    orderStatus: 'Pending'
  },
  {
    id: '10231',
    customerName: 'Ankit',
    orderDate: '2025-03-12',
    totalAmount: 1030,
    paymentStatus: 'Paid',
    orderStatus: 'Shipped'
  },
  {
    id: '10231',
    customerName: 'Suresh',
    orderDate: '2025-03-12',
    totalAmount: 430,
    paymentStatus: 'COD',
    orderStatus: 'Shipped'
  },
  {
    id: '10231',
    customerName: 'Suresh',
    orderDate: '2025-03-12',
    totalAmount: 850,
    paymentStatus: 'Paid',
    orderStatus: 'Delivered'
  },
  {
    id: '10231',
    customerName: 'Suresh',
    orderDate: '2025-03-12',
    totalAmount: 850,
    paymentStatus: 'Paid',
    orderStatus: 'Delivered'
  }
];

const OrderList = () => {
  const { data: orders, loading } = useFetch(() => adminApi.getAllOrders());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Use API data if available, otherwise use dummy data
  const orderData = (orders && orders.length > 0) ? orders : dummyOrders;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orderData.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const toggleDropdown = (orderId) => {
    setActiveDropdown(activeDropdown === orderId ? null : orderId);
  };

  const handleClear = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCustomerFilter('');
    setDateFilter('');
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="order-tracking-container">
      <div className="page-header">
        <h1 className="page-title">Order Tracking</h1>
      </div>

      <div className="filters-section">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="User Search"
            className="filter-input search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Status</option>
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select> */}

        {/* <select 
          className="filter-select"
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
        >
          <option value="">Customer</option>
          {[...new Set(orderData.map(order => order.customerName))].map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select> */}

        {/* <select 
          className="filter-select"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="">Date</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select> */}

        {/* <button className="clear-btn" onClick={handleClear}>Clear</button> */}
      </div>

      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedOrders.length === orderData.length && orderData.length > 0}
                />
              </th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orderData.length > 0 ? (
              orderData.map((order, index) => (
                <tr key={`${order.id}-${index}`} className={selectedOrders.includes(order.id) ? 'selected' : ''}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                    />
                  </td>
                  <td className="order-id">#{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>{new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>₹{order.totalAmount}</td>
                  <td>
                    <span className={`payment-badge ${order.paymentStatus.toLowerCase()}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${order.orderStatus.toLowerCase()}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="actions-col">
                    <div className="actions-dropdown">
                      <button 
                        className="actions-trigger"
                        onClick={() => toggleDropdown(`${order.id}-${index}`)}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === `${order.id}-${index}` && (
                        <div className="dropdown-menu">
                          <Link to={`/admin/orders/${order.id}`} className="dropdown-item">
                            <Eye size={16} />
                            <span>View</span>
                          </Link>
                          <button className="dropdown-item">
                            <Edit size={16} />
                            <span>Edit</span>
                          </button>
                          <button className="dropdown-item delete">
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">No orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="pagination-btn">Pre</button>
        <button className="pagination-btn active">1</button>
        <button className="pagination-btn">2</button>
        <button className="pagination-btn">3</button>
        <button className="pagination-btn">Next</button>
      </div>
    </div>
  );
};

export default OrderList;