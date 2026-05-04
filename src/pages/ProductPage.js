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

    // Состояния для формы отзывов
    const [showForm, setShowForm] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Загрузка товара
        axios.get(`http://localhost:8080/api/products/${id}`)
            .then(res => {
                setProduct(res.data);
                if (res.data.variants?.length > 0) setSelectedVariant(res.data.variants[0]);
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

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <i key={i} className={`bi ${i < rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'} me-1`}></i>
        ));
    };

    const handleAddToCart = async () => {
        setAdding(true);
        try {
            const res = await axios.get('http://localhost:8080/api/profile/me', { withCredentials: true });
            
            if (res.status === 200) {
                const cart = JSON.parse(localStorage.getItem('cart')) || [];
                const existingItemIndex = cart.findIndex(item => item.variantId === selectedVariant.variantId);

                const firstImageUrl = (product.images && product.images.length > 0) 
                    ? product.images[0].imageUrl 
                    : '';

                if (existingItemIndex > -1) {
                    cart[existingItemIndex].quantity += 1;
                } else {
                    cart.push({
                        variantId: selectedVariant.variantId,
                        productId: product.productId,
                        name: product.name,
                        image: firstImageUrl, 
                        price: selectedVariant.priceOverride || product.basePrice,
                        color: selectedVariant.color,
                        size: selectedVariant.size,
                        quantity: 1
                    });
                }

                localStorage.setItem('cart', JSON.stringify(cart));
                window.dispatchEvent(new Event('storage'));
                alert("Товар добавлен в корзину!");
            }
        } catch (err) {
            alert("Пожалуйста, войдите в аккаунт");
            navigate('/login');
        } finally {
            setAdding(false);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('http://localhost:8080/api/reviews', {
                productId: id,
                rating: parseInt(newReview.rating),
                comment: newReview.comment
            }, { withCredentials: true });
            
            alert("Отзыв отправлен на модерацию!");
            setShowForm(false);
            setNewReview({ rating: 5, comment: '' });
        } catch (err) {
            alert(err.response?.status === 401 ? "Войдите в аккаунт, чтобы оставить отзыв" : "Ошибка при отправке отзыва");
        } finally {
            setSubmitting(false);
        }
    };

    if (!product) return <div className="text-center my-5"><div className="spinner-border text-primary"></div></div>;

    const isFashion = product.categories?.some(cat => 
        cat.name.toLowerCase().includes('одежда') || cat.name.toLowerCase().includes('обувь')
    );

    return (
        <div className="container my-5">
            <style>{`
                .variant-btn { border: 1px solid #dee2e6; transition: 0.2s; background: #fff; }
                .variant-btn.active { border-color: #000; background: #f8f9fa; box-shadow: 0 0 0 1px #000; }
                .color-dot { width: 16px; height: 16px; border-radius: 50%; display: inline-block; border: 1px solid #ddd; margin-right: 8px; vertical-align: middle; }
                .main-img { border-radius: 20px; object-fit: cover; height: 500px; width: 100%; }
            `}</style>

            <div className="row g-5">
                <div className="col-md-6">
                    <div className="row g-3">
                        {product.images.map((img, idx) => (
                            <div key={idx} className="col-12">
                                <img 
                                    src={`http://localhost:8080${img.imageUrl}`} 
                                    className="main-img shadow-sm" 
                                    alt={product.name} 
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-md-6">
                    <nav aria-label="breadcrumb" className="mb-3">
                        <ol className="breadcrumb small text-uppercase">
                            <li className="breadcrumb-item"><Link to="/catalog" className="text-decoration-none text-muted">Каталог</Link></li>
                            <li className="breadcrumb-item active fw-bold text-dark">{product.brand}</li>
                        </ol>
                    </nav>
                    
                    <h1 className="display-6 fw-bold mb-3">{product.name}</h1>
                    <div className="d-flex align-items-center mb-4">
                        <h2 className="text-primary fw-bold mb-0 me-3">
                            {selectedVariant?.priceOverride || product.basePrice} BYN
                        </h2>
                    </div>

                    <hr className="my-4" />

                    <div className="mb-4">
                        <label className="fw-bold small text-uppercase d-block mb-3">Доступные варианты</label>
                        <div className="d-flex flex-wrap gap-2">
                            {product.variants.map(v => (
                                <button 
                                    key={v.variantId}
                                    onClick={() => setSelectedVariant(v)}
                                    className={`variant-btn btn d-flex align-items-center rounded-3 px-3 py-2 ${selectedVariant?.variantId === v.variantId ? 'active' : ''}`}
                                >
                                    {v.color && (
                                        <span 
                                            className="color-dot" 
                                            style={{ backgroundColor: colorMap[v.color.toLowerCase()] || '#eee' }}
                                        ></span>
                                    )}
                                    <span className="small fw-bold">
                                        {v.color} {isFashion && v.size ? `(${v.size})` : (v.size && !isFashion ? `- ${v.size}` : '')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className={`p-2 rounded-3 d-inline-block small ${selectedVariant?.stockQuantity > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            <i className={`bi ${selectedVariant?.stockQuantity > 0 ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
                            {selectedVariant?.stockQuantity > 0 ? `В наличии: ${selectedVariant.stockQuantity} шт.` : 'Нет в наличии'}
                        </div>
                    </div>

                    <button 
                        className="btn btn-dark btn-lg w-100 rounded-pill py-3 mb-4 shadow-sm"
                        disabled={!selectedVariant || selectedVariant.stockQuantity <= 0 || adding}
                        onClick={handleAddToCart}
                    >
                        {adding ? (
                            <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : (
                            <i className="bi bi-cart-plus me-2"></i>
                        )}
                        {adding ? "Добавление..." : "Добавить в корзину"}
                    </button>

                    <div className="card border-0 bg-light rounded-4">
                        <div className="card-body p-4">
                            <h6 className="fw-bold small text-uppercase mb-3">О товаре</h6>
                            <p className="text-secondary mb-0" style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="my-5" />

            <div className="row mb-5">
                <div className="col-md-4">
                    <h4 className="fw-bold mb-3">Отзывы покупателей</h4>
                    <div className="d-flex align-items-center mb-2">
                        <h1 className="display-4 fw-bold me-3 mb-0">{avgRating}</h1>
                        <div>
                            <div>{renderStars(Math.round(avgRating))}</div>
                            <div className="small text-muted">На основе {reviews.length} отзывов</div>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    {/* Кнопка и форма добавления отзыва */}
                    {!showForm ? (
                        <button 
                            className="btn btn-outline-dark rounded-pill mb-4 px-4"
                            onClick={() => setShowForm(true)}
                        >
                            <i className="bi bi-pencil-square me-2"></i>Написать отзыв
                        </button>
                    ) : (
                        <div className="card border-0 bg-light rounded-4 mb-4 shadow-sm">
                            <form className="card-body p-4" onSubmit={submitReview}>
                                <h5 className="fw-bold mb-3">Ваша оценка</h5>
                                <div className="mb-3">
                                    <select 
                                        className="form-select border-0 shadow-sm rounded-3"
                                        value={newReview.rating}
                                        onChange={(e) => setNewReview({...newReview, rating: e.target.value})}
                                    >
                                        <option value="5">⭐⭐⭐⭐⭐ (5 - Отлично)</option>
                                        <option value="4">⭐⭐⭐⭐ (4 - Хорошо)</option>
                                        <option value="3">⭐⭐⭐ (3 - Средне)</option>
                                        <option value="2">⭐⭐ (2 - Плохо)</option>
                                        <option value="1">⭐ (1 - Ужасно)</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <textarea 
                                        className="form-control border-0 shadow-sm rounded-3" 
                                        rows="3" 
                                        placeholder="Напишите, что вам понравилось или нет..."
                                        required
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                                    ></textarea>
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={submitting}>
                                        {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                        {submitting ? 'Отправка...' : 'Опубликовать'}
                                    </button>
                                    <button type="button" className="btn btn-link text-muted" onClick={() => setShowForm(false)}>
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Список отзывов */}
                    {reviews.length > 0 ? (
                        <div className="d-flex flex-column gap-4">
                            {reviews.map(review => (
                                <div key={review.reviewId} className="card border-0 shadow-sm rounded-4">
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between mb-2">
                                            <div>{renderStars(review.rating)}</div>
                                            <small className="text-muted">
                                                {new Date(review.reviewDate).toLocaleDateString()}
                                            </small>
                                        </div>
                                        <p className="mb-0">{review.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-5 bg-light rounded-4">
                            <p className="text-muted mb-0">Отзывов пока нет. Будьте первым!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductPage;