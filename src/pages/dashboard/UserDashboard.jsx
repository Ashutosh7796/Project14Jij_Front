import React, { useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { productApi } from '../../api/productApi';
import { orderApi } from '../../api/orderApi';
import { useToast } from '../../hooks/useToast';
import './UserDashboard.css';

const UserDashboardContent = () => {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const fetchProducts = useCallback(() => productApi.getAllProducts(), []);
  const fetchOrders = useCallback(
    () => (user?.userId ? orderApi.getMyOrders(user.userId) : Promise.resolve([])),
    [user?.userId]
  );

  const { data: products, loading: productsLoading } = useFetch(fetchProducts);
  const { data: myOrders, loading: ordersLoading } = useFetch(fetchOrders, [user?.userId]);

  const orders = myOrders || [];

  const openWhatsApp = (msg) => {
    const phone = '919000000000';
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
            priceAtOrder: product.price,
          },
        ],
      };
      await orderApi.createOrder(payload);
      showToast(`Order placed successfully for ${product.productName}! Our team will contact you for payment.`, 'success');
    } catch (error) {
      showToast('Failed to place order: ' + error.message, 'error');
    }
  };

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Farmer';

  return (
    <div className="user-dashboard">
      <header className="user-dashboard__hero">
        <div className="user-dashboard__hero-inner">
          <span className="user-dashboard__eyebrow">Your farm hub</span>
          <h1 className="user-dashboard__title">Welcome back, {displayName}</h1>
          <p className="user-dashboard__subtitle">
            Explore certified seeds, track orders, and reach our team on WhatsApp for soil reports and survey support.
          </p>
        </div>
        <button
          type="button"
          className="user-dashboard__wa"
          onClick={() => openWhatsApp('Hello, I need assistance with my farm.')}
        >
          <span aria-hidden>💬</span> Chat on WhatsApp
        </button>
      </header>

      <div className="user-dashboard__grid">
        <section className="user-dashboard__panel">
          <div className="user-dashboard__panel-head">
            <h2>Quick support</h2>
          </div>
          <div className="user-dashboard__panel-body">
            <button
              type="button"
              className="user-dashboard__action-btn"
              onClick={() => openWhatsApp('I want to see my latest Soil Report.')}
            >
              <span className="user-dashboard__action-icon">📄</span>
              <span>Request soil report via WhatsApp</span>
            </button>
            <button
              type="button"
              className="user-dashboard__action-btn"
              onClick={() => openWhatsApp('I want to see my Survey Information.')}
            >
              <span className="user-dashboard__action-icon">📋</span>
              <span>Survey information &amp; updates</span>
            </button>
          </div>
        </section>

        <section className="user-dashboard__panel">
          <div className="user-dashboard__panel-head">
            <h2>Recent orders</h2>
          </div>
          <div className="user-dashboard__panel-body">
            {ordersLoading ? (
              <div className="loading">
                <div className="spinner" />
              </div>
            ) : orders.length === 0 ? (
              <p className="user-dashboard__empty">No orders yet — browse seeds below and place your first order.</p>
            ) : (
              <div className="user-dashboard__table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.orderId}>
                        <td>
                          {order.items?.length > 0 ? order.items[0].productName : `Order #${order.orderId}`}
                        </td>
                        <td>
                          <span
                            className={`user-dashboard__badge ${
                              order.orderStatus === 'DELIVERED'
                                ? 'user-dashboard__badge--ok'
                                : 'user-dashboard__badge--pending'
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      <section>
        <h2 className="user-dashboard__section-title">Available products</h2>
        {productsLoading ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : (
          <div className="user-dashboard__products">
            {products?.content?.length > 0 ? (
              products.content.map((p) => (
                <article key={p.productId} className="user-dashboard__product">
                  <div className="user-dashboard__product-visual">
                    <span aria-hidden>{p.productType === 'SEED' ? '🌱' : '🛒'}</span>
                  </div>
                  <div className="user-dashboard__product-body">
                    <h3>{p.productName}</h3>
                    <p className="user-dashboard__price">₹{p.price}</p>
                    <button type="button" className="user-dashboard__order-btn" onClick={() => handleCheckout(p)}>
                      Order now
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="user-dashboard__empty">No products available at the moment.</p>
            )}
          </div>
        )}
      </section>

      <ToastComponent />
    </div>
  );
};

const UserDashboard = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="user-dashboard">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return <UserDashboardContent />;
};

export default UserDashboard;
