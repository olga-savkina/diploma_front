import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="container">
            <div className="row justify-content-center align-items-center min-vh-100">
                <div className="col-md-6 text-center">
                    {/* Иконка вместо смайлика */}
                    <div className="mb-4">
                        <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '6rem' }}></i>
                    </div>
                    
                    <h1 className="display-1 fw-bold text-dark">404</h1>
                    <h2 className="fw-bold mb-3">Страница не найдена</h2>
                    <p className="text-muted mb-5">
                        К сожалению, запрашиваемая вами страница не существует или была перемещена. 
                        Проверьте правильность адреса или вернитесь на главную.
                    </p>
                    
                    <div className="d-flex justify-content-center gap-3">
                        <Link to="/" className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm">
                            <i className="bi bi-house-door me-2"></i> На главную
                        </Link>
                        <button 
                            onClick={() => window.history.back()} 
                            className="btn btn-outline-secondary btn-lg rounded-pill px-5"
                        >
                            <i className="bi bi-arrow-left me-2"></i> Назад
                        </button>
                    </div>
                    
                    {/* Дополнительные быстрые ссылки, чтобы страница не казалась пустой */}
                    <div className="mt-5 pt-4 border-top">
                        <p className="small text-uppercase fw-bold text-secondary mb-3">Популярные разделы</p>
                        <div className="d-flex justify-content-center gap-4">
                            <Link to="/catalog" className="text-decoration-none text-dark small">
                                <i className="bi bi-grid me-1"></i> Каталог
                            </Link>
                            <Link to="/about" className="text-decoration-none text-dark small">
                                <i className="bi bi-info-circle me-1"></i> О нас
                            </Link>
                            <Link to="/cart" className="text-decoration-none text-dark small">
                                <i className="bi bi-cart3 me-1"></i> Корзина
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;