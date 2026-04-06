import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { productApi } from '../../api/productApi';
import { orderApi } from '../../api/orderApi';
import { useToast } from '../../hooks/useToast';

// Inner component — only mounted after auth is confirmed ready.
const UserDashboardContent = () => {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const fetchProducts = useCallback(() => productApi.getAllProducts(), []);
  const fetchOrders = useCallback(
    () => user?.userId ? orderApi.getMyOrders(user.userId) : Promise.resolve([]),
    [user?.userId]
  );

  const { data: products, loading: productsLoading } = useFetch(fetchProducts);
  const { data: myOrders, loading: ordersLoading } = useFetch(fetchOrders, [user?.userId]);

  const orders = myOrders || [];

  const openWhatsApp = (msg) => {
    const phone = "919000000000"; // Company Support WhatsApp
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCheckout = async (product) => {
    try {
      const payload = {
        userId: user.userId,
        totalAmount: product.price,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        items: [
          {
            productId: product.productId,
            productName: product.productName,
            quantity: 1,
            priceAtOrder: product.price
          }
        ]
      };
      await orderApi.createOrder(payload);
      showToast(`Order placed successfully for ${product.productName}! Our team will contact you for payment.`, 'success');
    } catch (error) {
      showToast('Failed to place order: ' + error.message, 'error');
    }
  };

  return (
    <div className="user-dashboard">
      <div className="top-bar" style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius)', marginBottom: '30px' }}>
        <div>
          <h1>Welcome, {user?.firstName || 'Farmer'}!</h1>
          <p>Explore our seeds and track your reports</p>
        </div>
        <button className="btn-success" style={{ background: '#25D366' }} onClick={() => openWhatsApp("Hello, I need assistance with my farm.")}>
          Chat Support (WhatsApp)
        </button>
      </div>

      <div className="grid-2">
        <div className="table-container">
          <div className="table-header">
            <h2>Track Your Support</h2>
          </div>
          <div className="modal-body">
            <div style={{ display: 'grid', gap: '15px' }}>
              <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', padding: '20px' }} onClick={() => openWhatsApp("I want to see my latest Soil Report.")}>
                📄 Download Soil Report via WhatsApp
              </button>
              <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', padding: '20px' }} onClick={() => openWhatsApp("I want to see my Survey Information.")}>
                📋 View Survey Info via WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <h2>Recent Orders</h2>
          </div>
          {ordersLoading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map(order => (
                    <tr key={order.orderId}>
                      <td>{order.items?.length > 0 ? order.items[0].productName : `Order #${order.orderId}`}</td>
                      <td>
                        <span className={`status-badge ${order.orderStatus === 'DELIVERED' ? 'active' : 'pending'}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '10px' }}>No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Available Seed Products</h2>
        {productsLoading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <div className="dashboard-stats">
            {products?.content?.length > 0 ? (
              products.content.map(p => (
                <div key={p.productId} className="stat-card hover-lift" style={{ display: 'block', padding: '0', overflow: 'hidden' }}>
                  <div style={{ background: '#f0f0f0', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px' }}>
                    {p.productType === 'SEED' ? '🌱' : '🛒'}
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3>{p.productName}</h3>
                    <p>Price: ₹{p.price}</p>
                    <button className="btn-primary" style={{ marginTop: '10px' }} onClick={() => handleCheckout(p)}>Order Now</button>
                  </div>
                </div>
              ))
            ) : (
              <p>No products available at the moment.</p>
            )}
          </div>
        )}
      </div>
      
      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};

// Outer shell — shows spinner until AuthContext finishes bootstrapping,
// then mounts UserDashboardContent which fires API calls with a guaranteed token.
const UserDashboard = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return <UserDashboardContent />;
};

export default UserDashboard;

