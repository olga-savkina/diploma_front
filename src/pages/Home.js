import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = ({ user }) => {
    const [reviews, setReviews] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: 1, name: 'Одежда', icon: 'bi-universal-access', color: '#f8d7da', path: '/catalog?category=clothes' },
        { id: 2, name: 'Игрушки', icon: 'bi-puzzle', color: '#d1ecf1', path: '/catalog?category=toys' },
        { id: 3, name: 'Питание', icon: 'bi-egg-fried', color: '#d4edda', path: '/catalog?category=food' },
        { id: 4, name: 'Косметика', icon: 'bi-magic', color: '#fff3cd', path: '/catalog?category=cosmetics' }
    ];

    const fetchRecommendations = async () => {
        try {
            const config = { withCredentials: true };
            const [pRes, profileRes, ordersRes] = await Promise.all([
                axios.get('http://localhost:8080/api/products'),
                axios.get('http://localhost:8080/api/profile/me', config),
                axios.get('http://localhost:8080/api/orders/my', config)
            ]);

            const products = pRes.data;
            const profileData = profileRes.data;
            const orders = ordersRes.data;

            setProfile(profileData);

            const children = profileData.children || [];

            let scoredProducts = products.map(product => {
                let score = 0;
                children.forEach(child => {
                    if (child.birthDate) {
                        const birth = new Date(child.birthDate);
                        const now = new Date();
                        const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());

                        const fitsAge = product.variants.some(v => {
                            if (v.ageMin === null && v.ageMax === null) return true;
                            if (v.ageMin !== null && ageInMonths < v.ageMin) return false;
                            if (v.ageMax !== null && ageInMonths > v.ageMax) return false;
                            return true;
                        });

                        if (fitsAge) {
                            score += product.variants.some(v => v.ageMin !== null) ? 25 : 5;
                        } else {
                            score -= 30;
                        }
                    }
                    const isGirlProduct = product.categories?.some(cat => cat.name.toLowerCase().includes('девочек'));
                    const isBoyProduct = product.categories?.some(cat => cat.name.toLowerCase().includes('мальчиков'));
                    if (child.gender === 'Girl' && isGirlProduct) score += 10;
                    if (child.gender === 'Boy' && isBoyProduct) score += 10;
                });

                const purchasedCats = orders.flatMap(o => o.items.map(i => i.productName));
                if (product.categories?.some(c => purchasedCats.some(name => name.includes(c.name)))) {
                    score += 10;
                }
                return { ...product, score };
            });

            const topProducts = scoredProducts
                .filter(p => p.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 4);

            setRecommendations(topProducts.length > 0 ? topProducts : products.slice(0, 4));
        } catch (err) {
            console.error("Ошибка рекомендаций", err);
            const res = await axios.get('http://localhost:8080/api/products');
            setRecommendations(res.data.slice(0, 4));
        }
    };

    const fetchApprovedReviews = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/reviews/public/approved');
            setReviews(response.data.slice(0, 3));
        } catch (error) {
            console.error("Ошибка отзывов:", error);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchApprovedReviews(), fetchRecommendations()]);
            setLoading(false);
        };
        loadAll();
    }, [user]);

    if (loading) return <div className="text-center my-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="home-page d-flex flex-column min-vh-100">
            {/* Контентная часть */}
            <div className="flex-grow-1">
                {/* Hero Banner */}
                <section className="bg-primary text-white py-5 mb-5 rounded-bottom-5 shadow-sm" 
                         style={{ background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)' }}>
                    <div className="container py-4 text-center">
                        <h1 className="display-4 fw-bold mb-3">Забота с первых дней ✨</h1>
                        <p className="lead mb-4">Лучшие товары для вашего малыша с умной системой подбора по возрасту</p>
                        <Link to="/catalog" className="btn btn-light btn-lg rounded-pill px-5 fw-bold text-primary shadow">
                            Перейти в каталог
                        </Link>
                    </div>
                </section>

                {/* Категории */}
                <div className="container my-5">
                    <div className="row g-4">
                        {categories.map(cat => (
                            <div key={cat.id} className="col-6 col-md-3">
                                <Link to={cat.path} className="text-decoration-none">
                                    <div className="p-4 rounded-4 text-center shadow-sm hover-transform transition" style={{ backgroundColor: cat.color }}>
                                        <i className={`bi ${cat.icon} fs-1 text-dark`}></i>
                                        <h5 className="mt-3 text-dark fw-bold">{cat.name}</h5>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Рекомендации */}
                <section className="container mb-5 p-4 bg-light rounded-4 border">
                    <h2 className="h4 mb-4 fw-bold text-center text-uppercase">
                        {user && profile?.children?.length > 0 ? (
                            profile.children.length > 1 
                                ? "ПОДОБРАНО ДЛЯ ВАШИХ ДЕТЕЙ" 
                                : (profile.children[0].name ? `ПОДОБРАНО ДЛЯ ${profile.children[0].name.toUpperCase()}` : "ПОДОБРАНО ДЛЯ ВАШЕГО МАЛЫША")
                        ) : "ПОПУЛЯРНЫЕ ТОВАРЫ"}
                    </h2>
                    <div className="row g-3">
                        {recommendations.map(item => (
                            <div key={item.productId} className="col-6 col-lg-3">
                                <div className="card h-100 border-0 shadow-sm text-center p-3">
                                    <div className="mb-2" style={{height: '120px'}}>
                                        <img 
                                            src={item.images?.[0] ? `http://localhost:8080${item.images[0].imageUrl}` : '/no-photo.png'} 
                                            className="img-fluid h-100 object-fit-contain" 
                                            alt={item.name} 
                                        />
                                    </div>
                                    <h6 className="small fw-bold text-truncate">{item.name}</h6>
                                    <p className="text-primary fw-bold small">{item.basePrice.toFixed(2)} BYN</p>
                                    <Link to={`/product/${item.productId}`} className="btn btn-sm btn-dark rounded-pill mt-auto">Смотреть</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Отзывы */}
                <section className="container mb-5">
                    <h2 className="h4 mb-4 fw-bold text-center">ОТЗЫВЫ ПОКУПАТЕЛЕЙ</h2>
                    <div className="row g-3">
                        {reviews.map(review => (
                            <div key={review.reviewId} className="col-md-4">
                                <div className="card h-100 border-0 shadow-sm p-4 bg-white">
                                    <div className="text-warning mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <i key={i} className={`bi bi-star${i < review.rating ? '-fill' : ''}`}></i>
                                        ))}
                                    </div>
                                    <p className="small fst-italic">"{review.comment}"</p>
                                    <footer className="blockquote-footer mt-2 text-primary fw-bold">{review.clientName}</footer>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ИСПРАВЛЕННЫЙ ФУТЕР: Теперь на всю ширину и с читаемым текстом */}
            <footer className="bg-dark text-white pt-5 pb-4 w-100">
                <div className="container">
                    <div className="row g-4 text-center text-md-start">
                        {/* Лого и описание */}
                        <div className="col-md-4">
                            <h5 className="fw-bold text-primary mb-3">BabyBoom</h5>
                            <p className="small text-white-50">
                                Ваш надежный помощник в мире детских товаров. <br/>
                                Мы помогаем родителям выбирать только лучшее с первых дней жизни.
                            </p>
                        </div>
                        
                        {/* Навигация */}
                        <div className="col-md-4">
                            <h5 className="mb-3 fw-bold">Навигация</h5>
                            <ul className="list-unstyled small">
                                <li className="mb-2"><Link to="/about" className="text-white-50 text-decoration-none link-light"><i className="bi bi-info-circle me-2"></i>О нас</Link></li>
                                <li className="mb-2"><Link to="/catalog" className="text-white-50 text-decoration-none link-light">Каталог товаров</Link></li>
                                <li className="mb-2"><Link to="/profile" className="text-white-50 text-decoration-none link-light">Личный кабинет</Link></li>
                                <li className="mb-2"><Link to="/cart" className="text-white-50 text-decoration-none link-light">Корзина покупок</Link></li>
                            </ul>
                        </div>
                        
                        {/* Контакты */}
                        <div className="col-md-4">
                            <h5 className="mb-3 fw-bold">Контакты</h5>
                            <p className="small text-white-50 mb-1"><i className="bi bi-geo-alt me-2"></i>г. Минск, пр-т Независимости</p>
                            <p className="small text-white-50 mb-3"><i className="bi bi-telephone me-2"></i>+375 (29) 123-45-67</p>
                            <div className="d-flex justify-content-center justify-content-md-start gap-3">
                                <a href="#" className="text-white-50 fs-5 link-light"><i className="bi bi-instagram"></i></a>
                                <a href="#" className="text-white-50 fs-5 link-light"><i className="bi bi-telegram"></i></a>
                            </div>
                        </div>
                    </div>
                    
                    <hr className="my-4 border-secondary" />
                    
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center small text-white-50">
                        <div className="mb-2 mb-md-0">© 2026 BabyBoom. Все права защищены.</div>
                        <div className="d-flex gap-3">
                            <span className="text-white-50">Сделано с любовью для малышей 👶</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;