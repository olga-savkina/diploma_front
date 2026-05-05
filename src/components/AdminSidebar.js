import React from 'react';
import { Link } from 'react-router-dom';

const AdminSidebar = () => {
    return (
        <div className="bg-dark text-white p-3 vh-100 sticky-top" style={{ width: '250px' }}>
            <h5 className="mb-4 text-center">Управление</h5>
            <ul className="nav flex-column">
                <li className="nav-item mb-2">
                    <Link className="nav-link text-white d-flex align-items-center" to="/admin/warehouse">
                        <i className="bi bi-box-seam me-2"></i> Склад
                    </Link>
                </li>
                <li className="nav-item mb-2">
                    <Link className="nav-link text-white d-flex align-items-center" to="/admin/categories">
                        <i className="bi bi-tags me-2"></i> Категории
                    </Link>
                </li>
                <li className="nav-item mb-2">
                    <Link className="nav-link text-white d-flex align-items-center" to="/admin/analytics">
                        <i className="bi bi-graph-up-arrow me-2"></i> Аналитика
                    </Link>
                </li>
                <li className="nav-item mb-2">
                    <Link className="nav-link text-white d-flex align-items-center" to="/admin/orders">
                        <i className="bi bi-cart-check me-2"></i> Все заказы
                    </Link>
                </li>
                <li className="nav-item mb-2">
                    <Link className="nav-link text-white d-flex align-items-center" to="/admin/users">
                        <i className="bi bi-people me-2"></i> Пользователи
                    </Link>
                </li>

                <li className="nav-item mb-2">
                    <Link className="nav-link text-white d-flex align-items-center" to="/admin/blog">
                        <i className="bi bi-journal-text me-2"></i> Блог
                    </Link>
                </li>
                <li className="nav-item mb-2">
                    <Link className="nav-link text-white d-flex align-items-center" to="/admin/reviews">
                        <i className="bi bi-chat-left-quote me-2"></i> Отзывы
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default AdminSidebar;