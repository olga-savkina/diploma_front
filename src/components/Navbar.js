import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// ... (ваши импорты остаются прежними)

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();
    
    // Получаем количество товаров из localStorage для бейджа
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
                    {isAdmin ? " BabyBoom Admin" : " BabyBoom"}
                </Link>
                
                <div className="collapse navbar-collapse">
                    <ul className="navbar-nav ms-auto align-items-center">
                        {user ? (
                            <>
                                {!isAdmin && (
                                    <>
                                        <li className="nav-item"><Link className="nav-link" to="/catalog">Каталог</Link></li>
                                        <li className="nav-item"><Link className="nav-link" to="/blog">Блог</Link></li>
                                        
                                        {/* ИКОНКА КОРЗИНЫ */}
                                        <li className="nav-item ms-lg-2">
                                            <Link className="nav-link p-0 position-relative" to="/cart" title="Корзина">
                                                <i className="bi bi-cart3" style={{ fontSize: '1.5rem', color: '#333' }}></i>
                                                {cartCount > 0 && (
                                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                                        {cartCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>

                                        <li className="nav-item ms-lg-3">
                                            <Link className="nav-link p-0" to="/profile" title="Личный кабинет">
                                                <i className="bi bi-person-circle" style={{ fontSize: '1.5rem', color: '#0d6efd' }}></i>
                                            </Link>
                                        </li>
                                    </>
                                )}
                                
                                <li className="nav-item ms-3 d-flex align-items-center">
                                    <span className="small text-muted me-2">{user.email}</span>
                                    <button className="btn btn-link text-danger btn-sm p-0" onClick={handleLogout}>Выйти</button>
                                </li>
                            </>
                        ) : (
                            <li className="nav-item">
                                <Link className="btn btn-primary btn-sm px-4" to="/login">Войти</Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;