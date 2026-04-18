import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { productApi } from '../../api/productApi';
import { orderApi } from '../../api/orderApi';
import { invalidateKey } from '../../cache/requestCache';
import {
  CACHE_TAGS,
  DEFAULT_TTL_MS,
  SWR_FRESH_MS,
  SWR_STALE_MS,
  cacheKeyProductsList,
  cacheKeyOrdersForUser,
} from '../../cache/cacheKeys';
import { useToast } from '../../hooks/useToast';
import './UserDashboard.css';
import './styles/AdminDashboards.css';
import {
  UserDashboardAuthShell,
  UserOrdersTableSkeleton,
  UserProductsGridSkeleton,
} from './DashboardSkeletons';

const UserDashboardContent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const handleLogout = async () => {
    await logout();
    navigate('/auth-login', { replace: true });
  };

  const fetchProducts = useCallback(() => productApi.getAllProducts(), []);
  const fetchOrders = useCallback(
    () => (user?.userId ? orderApi.getMyOrders(user.userId) : Promise.resolve([])),
    [user?.userId]
  );

  const { data: products, loading: productsLoading } = useCachedFetch(cacheKeyProductsList(), fetchProducts, {
    swr: true,
    freshMs: SWR_FRESH_MS,
    staleMs: SWR_STALE_MS,
    ttlMs: DEFAULT_TTL_MS,
    tags: [CACHE_TAGS.PRODUCTS],
  });

  const ordersCacheKey = user?.userId ? cacheKeyOrdersForUser(user.userId) : null;
  const { data: myOrders, loading: ordersLoading } = useCachedFetch(ordersCacheKey, fetchOrders, {
    swr: true,
    freshMs: SWR_FRESH_MS,
    staleMs: SWR_STALE_MS,
    ttlMs: 45_000,
    tags: [CACHE_TAGS.ORDERS_USER],
  });

  const orders = myOrders || [];

  const openWhatsApp = (msg) => {
    const phone = '919175312722';
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
      if (user?.userId) invalidateKey(cacheKeyOrdersForUser(user.userId));
      showToast(`Order placed successfully for ${product.productName}! Our team will contact you for payment.`, 'success');
    } catch (error) {
      showToast('Failed to place order: ' + error.message, 'error');
    }
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.firstName ||
    user?.email?.split('@')[0] ||
    'Farmer';

  return (
    <div className="user-dashboard">
      <header className="user-dashboard__hero">
        <div className="user-dashboard__hero-inner">
          <span className="user-dashboard__eyebrow">Your farm hub</span>
          <h1 className="user-dashboard__title">Welcome, {displayName}</h1>
          <p className="user-dashboard__subtitle">
            Explore certified seeds, track orders, and reach our team on WhatsApp for soil reports and survey support.
          </p>
        </div>
        <div className="user-dashboard__hero-actions">
          <button
            type="button"
            className="user-dashboard__wa"
            onClick={() => openWhatsApp('Hello, I need assistance with my farm.')}
          >
            <span aria-hidden>💬</span> Chat on WhatsApp
          </button>
          <button type="button" className="user-dashboard__logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <nav className="user-dashboard__welcome-nav" aria-label="Dashboard shortcuts">
        <a href="#user-dashboard-products" className="user-dashboard__welcome-card">
          <span className="user-dashboard__welcome-card-icon" aria-hidden>
            🌱
          </span>
          <h3 className="user-dashboard__welcome-card-title">All products</h3>
          <p className="user-dashboard__welcome-card-desc">Browse seeds and place an order in one tap.</p>
        </a>
        <a href="#user-dashboard-orders" className="user-dashboard__welcome-card">
          <span className="user-dashboard__welcome-card-icon" aria-hidden>
            📦
          </span>
          <h3 className="user-dashboard__welcome-card-title">My orders</h3>
          <p className="user-dashboard__welcome-card-desc">See status for everything you have ordered.</p>
        </a>
        <a href="#user-dashboard-support" className="user-dashboard__welcome-card">
          <span className="user-dashboard__welcome-card-icon" aria-hidden>
            🛟
          </span>
          <h3 className="user-dashboard__welcome-card-title">Help &amp; reports</h3>
          <p className="user-dashboard__welcome-card-desc">Soil reports, surveys, and quick WhatsApp support.</p>
        </a>
      </nav>

      <div className="user-dashboard__grid">
        <section id="user-dashboard-support" className="user-dashboard__panel user-dashboard__anchor-target">
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

        <section id="user-dashboard-orders" className="user-dashboard__panel user-dashboard__anchor-target">
          <div className="user-dashboard__panel-head">
            <h2>Recent orders</h2>
          </div>
          <div className="user-dashboard__panel-body">
            {ordersLoading ? (
              <UserOrdersTableSkeleton rows={4} />
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

      <section id="user-dashboard-products" className="user-dashboard__anchor-target">
        <h2 className="user-dashboard__section-title">Available products</h2>
        {productsLoading ? (
          <UserProductsGridSkeleton cards={6} />
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
    return <UserDashboardAuthShell />;
  }

  return <UserDashboardContent />;
};

export default UserDashboard;
