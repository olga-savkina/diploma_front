import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    // Категории с использованием Bootstrap Icons
    const categories = [
        { id: 1, name: 'Одежда', icon: 'bi-tags', path: '/catalog?category=clothes' },
        { id: 2, name: 'Игрушки', icon: 'bi-robot', path: '/catalog?category=toys' },
        { id: 3, name: 'Питание', icon: 'bi-cup-straw', path: '/catalog?category=food' },
        { id: 4, name: 'Гигиена', icon: 'bi-droplet', path: '/catalog?category=hygiene' }
    ];

    const reviews = [
        { id: 1, name: 'Анна', rating: 5, text: 'Отличное качество комбинезонов, после стирки как новые.' },
        { id: 2, name: 'Дмитрий', rating: 4, text: 'Быстрая доставка, упаковано всё очень аккуратно.' },
        { id: 3, name: 'Елена', rating: 5, text: 'Лучший магазин детских товаров в Минске. Рекомендую.' }
    ];

    return (
        <div className="home-wrapper d-flex flex-column min-vh-100">
            
            {/* Hero Section */}
            <header className="bg-light py-5 border-bottom">
                <div className="container text-center">
                    <h1 className="fw-bold text-dark mb-3">BABYBOOM</h1>
                    <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: '600px' }}>
                        Качественные товары для детей и новорожденных. 
                        Проверенные бренды и безопасные материалы.
                    </p>
                    <Link to="/catalog" className="btn btn-dark btn-lg px-5 rounded-pill shadow-sm">
                        <i className="bi bi-bag-heart me-2"></i> Перейти в каталог
                    </Link>
                </div>
            </header>

            <main className="container flex-grow-1 my-5">
                
                {/* Категории товаров */}
                <section className="mb-5">
                    <h2 className="h4 mb-4 border-start border-4 border-dark ps-3">Категории</h2>
                    <div className="row g-4">
                        {categories.map(cat => (
                            <div key={cat.id} className="col-6 col-lg-3">
                                <Link to={cat.path} className="text-decoration-none text-dark">
                                    <div className="card h-100 text-center border-0 bg-white shadow-sm py-4 transition-hover">
                                        <div className="card-body">
                                            <i className={`bi ${cat.icon} display-5 text-primary mb-3 d-block`}></i>
                                            <h6 className="fw-bold mb-0">{cat.name}</h6>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Отзывы */}
                <section className="mb-5">
                    <h2 className="h4 mb-4 border-start border-4 border-dark ps-3 text-uppercase small fw-bold">Отзывы покупателей</h2>
                    <div className="row g-3">
                        {reviews.map(rev => (
                            <div key={rev.id} className="col-md-4">
                                <div className="card h-100 border-0 bg-light p-2">
                                    <div className="card-body">
                                        <div className="text-warning mb-2 small">
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <i key={i} className={`bi ${i < rev.rating ? 'bi-star-fill' : 'bi-star'} me-1`}></i>
                                            ))}
                                        </div>
                                        <p className="card-text small text-dark opacity-75">"{rev.text}"</p>
                                        <div className="fw-bold small text-muted">— {rev.name}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Подвал */}
            <footer className="bg-dark text-white pt-5 pb-3">
                <div className="container">
                    <div className="row">
                        <div className="col-md-5 mb-4">
                            <h5 className="fw-bold mb-3">BABYBOOM</h5>
                            <p className="small text-secondary pe-md-5">
                                Дипломный проект студентки группы ИСиТ в экономике Савкиной Ольги. 
                                Проектирование и разработка платформы для продажи товаров детского ассортимента.
                            </p>
                        </div>
                        <div className="col-md-3 mb-4">
                            <h6 className="text-uppercase small fw-bold mb-3">Навигация</h6>
                            <ul className="list-unstyled small">
                                <li className="mb-2"><Link to="/catalog" className="text-secondary text-decoration-none d-flex align-items-center"><i className="bi bi-chevron-right me-1 small"></i> Каталог</Link></li>
                                <li className="mb-2"><Link to="/login" className="text-secondary text-decoration-none d-flex align-items-center"><i className="bi bi-chevron-right me-1 small"></i> Личный кабинет</Link></li>
                                <li className="mb-2"><Link to="/about" className="text-secondary text-decoration-none d-flex align-items-center"><i className="bi bi-chevron-right me-1 small"></i> О проекте</Link></li>
                            </ul>
                        </div>
                        <div className="col-md-4 mb-4">
                            <h6 className="text-uppercase small fw-bold mb-3">Контактная информация</h6>
                            <ul className="list-unstyled small text-secondary">
                                <li className="mb-2"><i className="bi bi-geo-alt me-2"></i> г. Минск, Республика Беларусь</li>
                                <li className="mb-2"><i className="bi bi-envelope me-2"></i> info@babyboom.by</li>
                                <li className="mb-2"><i className="bi bi-telephone me-2"></i> +375 (29) 000-00-00</li>
                            </ul>
                        </div>
                    </div>
                    <hr className="bg-secondary opacity-25" />
                    <div className="d-flex justify-content-between align-items-center small text-secondary pt-2">
                        <span>© 2026 Olga Savkina</span>
                        <div>
                            <i className="bi bi-github ms-3"></i>
                            <i className="bi bi-telegram ms-3"></i>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;