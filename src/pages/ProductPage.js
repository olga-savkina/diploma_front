import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const colorMap = {
    "белый": "#ffffff", "черный": "#000000", "красный": "#ff0000",
    "синий": "#0000ff", "голубой": "#87ceeb", "зеленый": "#008000",
    "желтый": "#ffff00", "розовый": "#ffc0cb", "бежевый": "#f5f5dc",
    "серый": "#808080", "фиолетовый": "#800080", "оранжевый": "#ffa500"
};

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [adding, setAdding] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    
    // Индекс активного фото для листания
    const [activeImgIndex, setActiveImgIndex] = useState(0);

    const [showForm, setShowForm] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Загрузка товара
        axios.get(`http://localhost:8080/api/products/${id}`)
            .then(res => {
                setProduct(res.data);
                if (res.data.variants?.length > 0) {
                    setSelectedVariant(res.data.variants[0]);
                }
                setActiveImgIndex(0);
            })
            .catch(err => console.error("Ошибка загрузки товара:", err));

        // Загрузка отзывов
        axios.get(`http://localhost:8080/api/reviews/${id}`)
            .then(res => {
                setReviews(res.data);
                if (res.data.length > 0) {
                    const total = res.data.reduce((acc, rev) => acc + rev.rating, 0);
                    setAvgRating((total / res.data.length).toFixed(1));
                }
            })
            .catch(err => console.error("Отзывы не загружены:", err));
    }, [id]);

    // Функции для листания фото
    const handleNextImg = () => {
        if (product?.images?.length > 0) {
            setActiveImgIndex((prev) => (prev + 1) % product.images.length);
        }
    };

    const handlePrevImg = () => {
        if (product?.images?.length > 0) {
            setActiveImgIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
        }
    };

    const handleAddToCart = async () => {
        setAdding(true);
        try {
            // Проверка авторизации
            await axios.get('http://localhost:8080/api/profile/me', { withCredentials: true });
            
            const user = JSON.parse(localStorage.getItem('user'));
            const cartKey = user ? `cart_${user.username}` : 'cart_guest';
            const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
            
            const price = selectedVariant.priceOverride || product.basePrice;
            const existingItemIndex = cart.findIndex(item => item.variantId === selectedVariant.variantId);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push({
                    variantId: selectedVariant.variantId,
                    productId: product.productId,
                    name: product.name,
                    image: product.images?.[0]?.imageUrl || '',
                    price: price,
                    color: selectedVariant.color,
                    size: selectedVariant.size,
                    quantity: 1
                });
            }

            localStorage.setItem(cartKey, JSON.stringify(cart));
            window.dispatchEvent(new Event('storage'));
            alert("Товар добавлен в корзину!");
        } catch (err) {
            alert("Пожалуйста, войдите в аккаунт");
            navigate('/login');
        } finally {
            setAdding(false);
        }
    };

    const renderStars = (rating) => (
        [...Array(5)].map((_, i) => (
            <i key={i} className={`bi ${i < rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'} me-1`}></i>
        ))
    );

    if (!product) return <div className="text-center my-5"><div className="spinner-border text-primary"></div></div>;

    // Расчет доступного остатка
    const availableStock = (selectedVariant?.stock?.quantity || 0) - (selectedVariant?.stock?.reservedQuantity || 0);
    const currentImgUrl = product.images?.[activeImgIndex]?.imageUrl;

    return (
        <div className="container my-5">

        <style>{`
            .main-img-wrapper { 
                position: relative; 
                border-radius: 24px; 
                overflow: hidden; 
                background: #f8f9fa; /* Светло-серый фон для пустых зон */
                height: 600px; /* Оптимальная высота, чтобы не скроллить слишком долго */
                display: flex; 
                align-items: center; 
                justify-content: center;
                padding: 20px;
            }

            .main-img { 
                /* ИСПОЛЬЗУЕМ CONTAIN ДЛЯ УНИВЕРСАЛЬНОСТИ */
                object-fit: contain; 
                width: 100%; 
                height: 100%; 
                transition: opacity 0.3s ease;
            }

            /* Стрелки навигации */
            .nav-btn { 
                position: absolute; 
                top: 50%; 
                transform: translateY(-50%); 
                background: white; 
                border: none; 
                width: 45px; 
                height: 45px; 
                border-radius: 50%; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
                z-index: 5; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                opacity: 0.8;
            }
            .nav-btn:hover { opacity: 1; background: #fff; }
            .btn-prev { left: 15px; }
            .btn-next { right: 15px; }
        `}</style>

            <div className="row g-5">
                {/* ГАЛЕРЕЯ */}
                <div className="col-lg-6">
                    <div className="main-img-wrapper shadow-sm mb-3">
                        {product.images?.length > 1 && (
                            <>
                                <button className="nav-btn btn-prev" onClick={handlePrevImg}><i className="bi bi-chevron-left"></i></button>
                                <button className="nav-btn btn-next" onClick={handleNextImg}><i className="bi bi-chevron-right"></i></button>
                            </>
                        )}
                        <img src={`http://localhost:8080${currentImgUrl}`} className="main-img" alt={product.name} />
                    </div>
                    
                    <div className="d-flex gap-2 overflow-auto pb-2">
                        {product.images?.map((img, idx) => (
                            <img 
                                key={idx} 
                                src={`http://localhost:8080${img.imageUrl}`} 
                                className={`rounded-3 border ${activeImgIndex === idx ? 'border-dark' : 'border-light'}`} 
                                style={{width: '70px', height: '70px', objectFit: 'cover', cursor: 'pointer', opacity: activeImgIndex === idx ? 1 : 0.6}} 
                                onClick={() => setActiveImgIndex(idx)} 
                            />
                        ))}
                    </div>
                </div>

                {/* ИНФОРМАЦИЯ */}
                <div className="col-lg-6">
                    <div className="mb-2">
                        <span className="badge bg-light text-muted border text-uppercase px-3 rounded-pill">{product.brand}</span>
                    </div>
                    <h1 className="fw-bold mb-3">{product.name}</h1>
                    
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <h2 className="text-primary fw-bold mb-0">
                            {selectedVariant?.priceOverride || product.basePrice} BYN
                        </h2>
                        {selectedVariant?.priceOverride && (
                            <span className="text-muted text-decoration-line-through fs-5">{product.basePrice} BYN</span>
                        )}
                    </div>

                    {/* Характеристики: Возраст и Сроки */}
                    <div className="d-flex flex-wrap gap-2 mb-4">
                        {selectedVariant?.ageMin !== null && (
                            <div className="info-badge">
                                <i className="bi bi-emoji-smile me-2 text-primary"></i>
                                Возраст: {selectedVariant.ageMin}{selectedVariant.ageMax ? `-${selectedVariant.ageMax}` : '+'} мес.
                            </div>
                        )}
                        {selectedVariant?.stock?.productionDate && (
                            <div className="info-badge">
                                <i className="bi bi-calendar-check me-2"></i>
                                Изг: {new Date(selectedVariant.stock.productionDate).toLocaleDateString()}
                            </div>
                        )}
                        {selectedVariant?.stock?.expiryDate && (
                            <div className="info-badge border-warning">
                                <i className="bi bi-hourglass-split me-2 text-warning"></i>
                                До: {new Date(selectedVariant.stock.expiryDate).toLocaleDateString()}
                            </div>
                        )}
                    </div>

                    {/* Выбор варианта */}
                    <div className="mb-4">
                        <label className="small fw-bold text-uppercase text-muted d-block mb-2">Варианты:</label>
                        <div className="d-flex flex-wrap gap-2">
                            {product.variants?.map(v => (
                                <button 
                                    key={v.variantId} 
                                    className={`btn btn-sm rounded-pill px-3 variant-btn ${selectedVariant?.variantId === v.variantId ? 'active' : ''}`}
                                    onClick={() => setSelectedVariant(v)}
                                >
                                    {v.color && <span className="color-dot" style={{backgroundColor: colorMap[v.color.toLowerCase()] || '#eee'}}></span>}
                                    {v.color} {v.size ? `(${v.size})` : ''}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Статус наличия (Доступно = Склад - Резерв) */}
                    <div className={`mb-4 small fw-bold ${availableStock > 0 ? 'text-success' : 'text-danger'}`}>
                        <i className={`bi ${availableStock > 0 ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2`}></i>
                        {availableStock > 0 ? `В наличии: ${availableStock} шт.` : 'Нет в наличии'}
                    </div>

                    <button 
                        className="btn btn-dark btn-lg w-100 rounded-pill py-3 mb-4 shadow-sm"
                        disabled={availableStock <= 0 || adding}
                        onClick={handleAddToCart}
                    >
                        {adding ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cart3 me-2"></i>}
                        {adding ? "Добавление..." : "Добавить в корзину"}
                    </button>

                    <div className="bg-light p-4 rounded-4">
                        <h6 className="fw-bold small text-uppercase mb-2">Описание товара</h6>
                        <p className="text-muted mb-0 small" style={{whiteSpace: 'pre-line', lineHeight: '1.6'}}>
                            {product.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* ОТЗЫВЫ */}
            <div className="mt-5 pt-5 border-top">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold mb-0">Отзывы <span className="text-muted fs-5 ms-2">({reviews.length})</span></h3>
                    <button className="btn btn-outline-dark rounded-pill px-4" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Отмена' : 'Написать отзыв'}
                    </button>
                </div>

                {showForm && (
                    <div className="card border-0 bg-light rounded-4 p-4 mb-5 shadow-sm">
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setSubmitting(true);
                            try {
                                await axios.post('http://localhost:8080/api/reviews', {
                                    productId: id,
                                    rating: parseInt(newReview.rating),
                                    comment: newReview.comment
                                }, { withCredentials: true });
                                alert("Отзыв успешно опубликован!");
                                window.location.reload();
                            } catch {
                                alert("Ошибка. Пожалуйста, авторизуйтесь.");
                            } finally { setSubmitting(false); }
                        }}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Оценка</label>
                                <select className="form-select border-0 rounded-3 shadow-sm" value={newReview.rating} onChange={e => setNewReview({...newReview, rating: e.target.value})}>
                                    <option value="5">⭐⭐⭐⭐⭐ (5 - Отлично)</option>
                                    <option value="4">⭐⭐⭐⭐ (4 - Хорошо)</option>
                                    <option value="3">⭐⭐⭐ (3 - Нормально)</option>
                                    <option value="2">⭐⭐ (2 - Плохо)</option>
                                    <option value="1">⭐ (1 - Ужасно)</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Ваш комментарий</label>
                                <textarea className="form-control border-0 rounded-3 shadow-sm" rows="3" required value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})}></textarea>
                            </div>
                            <button className="btn btn-primary rounded-pill px-5" disabled={submitting}>
                                {submitting ? "Отправка..." : "Опубликовать"}
                            </button>
                        </form>
                    </div>
                )}

                <div className="row g-4">
                    {reviews.map(review => (
                        <div key={review.reviewId} className="col-12">
                            <div className="bg-white border-bottom pb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div>{renderStars(review.rating)}</div>
                                    <small className="text-muted">{new Date(review.reviewDate).toLocaleDateString()}</small>
                                </div>
                                <p className="mb-0 text-secondary">{review.comment}</p>
                            </div>
                        </div>
                    ))}
                    {reviews.length === 0 && <p className="text-center text-muted py-5">У этого товара пока нет отзывов.</p>}
                </div>
            </div>
        </div>
    );
};

export default ProductPage;