import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import AdminSidebar from './components/AdminSidebar'; // Добавь этот импорт
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import AdminWarehouse from './pages/Warehouse/AdminWarehouse';
import AdminCategories from './pages/AdminCategories';
import Catalog from './pages/Catalog';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import AdminOrders from './pages/AdminOrders';
import AdminReviews from './pages/AdminReviews';
import AdminArticles from './pages/AdminArticles';
import Blog from './pages/Blog';
import AboutPage from './pages/AboutPage';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/auth/me', { withCredentials: true });
        setUser(res.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return null;

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="d-flex">
      {/* Слева: Сайдбар только для админа */}
      {user?.role === 'ADMIN' && !isAuthPage && <AdminSidebar />}

      {/* Справа: Основная часть */}
      <div className="flex-grow-1">
        {!isAuthPage && <Navbar user={user} setUser={setUser} />}
        
        <div className={isAuthPage ? "" : "container mt-4"}>
          <Routes>
            <Route path="/home" element={<Home user={user} />} />
            
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/home" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/home" />} />
            <Route path="/profile"  element={user ? <Profile user={user} /> : <Navigate to="/login" />}  />
            <Route path="/catalog" element={<Catalog user={user} />} />
            <Route path="/blog" element={<Blog user={user} />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/product/:id" element={<ProductPage user={user} />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/warehouse" element={<AdminWarehouse />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/blog" element={<AdminArticles />} />
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;