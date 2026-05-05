import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();
    
    // Используем состояние для счетчика, чтобы он обновлялся при изменении localStorage
    const [cartCount, setCartCount] = useState(0);

    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
    };

    useEffect(() => {
        updateCartCount();
        // Слушаем событие 'storage', чтобы обновлять счетчик между вкладками
        window.addEventListener('storage', updateCartCount);
        return () => window.removeEventListener('storage', updateCartCount);
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:8080/logout', {}, { withCredentials: true });
        } finally {
            setUser(null); 
            navigate('/login');
        }
    };

    const isAdmin = user?.role === 'ADMIN';
    const navClass = isAdmin ? "navbar-dark bg-dark" : "navbar-light bg-white border-bottom";

    return (
        <nav className={`navbar navbar-expand-lg ${navClass} sticky-top shadow-sm`}>
            <div className="container">
                <Link className="navbar-brand fw-bold" to="/home">
                    {isAdmin ? "BabyBoom Admin" : "BabyBoom"}
                </Link>
                
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navContent">
                    <ul className="navbar-nav ms-auto align-items-center">
                        {/* ОБЩИЕ ССЫЛКИ */}
                        {!isAdmin && (
                            <>
                                <li className="nav-item"><Link className="nav-link" to="/catalog">Каталог</Link></li>
                                <li className="nav-item"><Link className="nav-link" to="/blog">Блог</Link></li>
                                {/* СТРАНИЦА О НАС */}
                                <li className="nav-item"><Link className="nav-link" to="/about">О нас</Link></li>
                            </>
                        )}

                        {user ? (
                            <>
                                {!isAdmin && (
                                    <>
                                        {/* ИКОНКА КОРЗИНЫ */}
                                        <li className="nav-item ms-lg-2">
                                            <Link className="nav-link p-0 position-relative" to="/cart" title="Корзина">
                                                <i className="bi bi-cart3" style={{ fontSize: '1.4rem', color: '#333' }}></i>
                                                {cartCount > 0 && (
                                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                                        {cartCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>

                                        {/* ИКОНКА ПРОФИЛЯ */}
                                        <li className="nav-item ms-lg-3">
                                            <Link className="nav-link p-0" to="/profile" title="Личный кабинет">
                                                <i className="bi bi-person-circle" style={{ fontSize: '1.4rem', color: '#0d6efd' }}></i>
                                            </Link>
                                        </li>
                                    </>
                                )}
                                
                                {/* ВЫХОД */}
                                <li className="nav-item ms-3 ps-3 border-start d-flex align-items-center">
                                    <div className="d-flex flex-column me-3">
                                        <span className="text-muted" style={{ fontSize: '0.7rem', lineHeight: '1' }}>Вы вошли как:</span>
                                        <span className="fw-bold" style={{ fontSize: '0.8rem' }}>{user.email.split('@')[0]}</span>
                                    </div>
                                    <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={handleLogout}>
                                        <i className="bi bi-box-arrow-right me-1"></i> Выйти
                                    </button>
                                </li>
                            </>
                        ) : (
                            <li className="nav-item ms-lg-3">
                                <Link className="btn btn-primary btn-sm px-4 rounded-pill" to="/login">Войти</Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;