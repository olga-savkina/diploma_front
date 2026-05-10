import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Если мы на главной, крошки не нужны
    if (location.pathname === '/') return null;

    return (
        <nav aria-label="breadcrumb" className="container mt-3">
            <ol className="breadcrumb small">
                <li className="breadcrumb-item">
                    <Link to="/" className="text-decoration-none text-muted">Главная</Link>
                </li>
                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                    // Превращаем путь (например, 'catalog') в красивое название
                    const nameMap = {
                        'catalog': 'Каталог',
                        'product': 'Товар',
                        'cart': 'Корзина',
                        'admin': 'Панель управления'
                    };

                    return last ? (
                        <li key={to} className="breadcrumb-item active" aria-current="page">
                            {nameMap[value] || value}
                        </li>
                    ) : (
                        <li key={to} className="breadcrumb-item">
                            <Link to={to} className="text-decoration-none text-muted">
                                {nameMap[value] || value}
                            </Link>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;