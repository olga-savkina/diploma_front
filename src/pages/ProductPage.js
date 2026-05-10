import React, { useState, useEffect, useCallback } from 'react'; // Добавили useCallback
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductReviews from '../components/ProductReviews';

// Если colorMap не используется — его можно удалить, но я применил его в кнопках ниже
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
    const [activeImgIndex, setActiveImgIndex] = useState(0);

    // Оборачиваем в useCallback, чтобы убрать предупреждение useEffect [Line 40]
    const loadData = useCallback(async () => {
        try {
            const pRes = await axios.get(`http://localhost:8080/api/products/${id}`);
            setProduct(pRes.data);
            if (pRes.data.variants?.length > 0) {
                setSelectedVariant(pRes.data.variants[0]);
            }
            setActiveImgIndex(0);
            
            const rRes = await axios.get(`http://localhost:8080/api/reviews/${id}`);
            setReviews(rRes.data);
        } catch (err) { 
            console.error("Ошибка загрузки данных:", err); 
        }
    }, [id]);

    useEffect(() => { 
        loadData(); 
    }, [loadData]); // Теперь loadData — стабильная зависимость

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

    if (!product) return <div className="text-center my-5"><div className="spinner-border text-primary"></div></div>;

    const availableStock = selectedVariant?.stock 
        ? (selectedVariant.stock.quantity - (selectedVariant.stock.reservedQuantity || 0)) 
        : 0;

    const currentImgUrl = product.images?.[activeImgIndex]?.imageUrl;
    const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('ru-RU');
};

    return (
        <div className="container my-5">
            <style>{`
            /* НОВОЕ: Ограничиваем ширину контейнера галереи на больших экранах */
                @media (min-width: 992px) {
                    .gallery-container {
                        max-width: 480px; /* Например, фиксированная ширина */
                        margin: 0 auto; /* Центрируем галерею в её колонке */
                    }
                }

                .main-img-wrapper {
                    position: relative;
                    width: 100%;
                    padding-top: 100%; /* Делаем квадрат 1:1 */
                    overflow: hidden;
                    border-radius: 1rem;
                    background-color: #f8f9fa;
                }

                .main-img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: contain; /* Картинка полностью помещается без обрезки */
                    padding: 1rem; /* Отступ, чтобы не прилипала к краям */
                }

                .nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255,255,255,0.8);
                    border: none;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                    transition: all 0.2s;
                }
                .nav-btn:hover { background: #fff; }
                .btn-prev { left: 10px; }
                .btn-next { right: 10px; }
               
            .variant-btn { 
            background: #ffffff !important; 
            border: 1px solid #dee2e6 !important; 
            color: #000000 !important; 
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
        }

        .variant-btn:hover { 
            border-color: #000 !important; 
            background: #f8f9fa !important;
        }

        /* Стиль для активной кнопки: белая с жирной черной рамкой */
        .variant-btn.active { 
            border: 2px solid #000000 !important; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .color-dot { 
            width: 14px; 
            height: 14px; 
            border-radius: 50%; 
            display: inline-block; 
            margin-right: 8px; 
            border: 1px solid #ddd; 
        }
            `}</style>

            <div className="row g-5">
                <div className="col-lg-6">
                    <div className="main-img-wrapper shadow-sm mb-3">
                        {product.images?.length > 1 && (
                            <>
                                <button className="nav-btn btn-prev" onClick={handlePrevImg}><i className="bi bi-chevron-left"></i></button>
                                <button className="nav-btn btn-next" onClick={handleNextImg}><i className="bi bi-chevron-right"></i></button>
                            </>
                        )}
                        <img 
                            src={currentImgUrl ? `http://localhost:8080${currentImgUrl}` : '/no-photo.png'} 
                            className="main-img" 
                            alt={product.name} 
                        />
                    </div>
                    
                    <div className="d-flex gap-2 overflow-auto pb-2">
                        {product.images?.map((img, idx) => (
                            <img 
                                key={idx} 
                                src={`http://localhost:8080${img.imageUrl}`} 
                                // ИСПРАВЛЕНИЕ: Добавлен alt prop [Line 144]
                                alt={`${product.name} - вид ${idx + 1}`} 
                                className={`rounded-3 border ${activeImgIndex === idx ? 'border-dark' : 'border-light'}`} 
                                style={{width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', opacity: activeImgIndex === idx ? 1 : 0.5}} 
                                onClick={() => setActiveImgIndex(idx)} 
                            />
                        ))}
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="mb-2">
                        <span className="badge bg-light text-muted border text-uppercase px-3 rounded-pill">{product.brand}</span>
                    </div>
                    <h1 className="fw-bold mb-3">{product.name}</h1>
                    <h2 className="text-primary fw-bold mb-4">
                        {selectedVariant?.priceOverride || product.basePrice} BYN
                    </h2>

                    <div className="d-flex flex-wrap gap-2 mb-4">
                    {/* Отображение возраста */}
                    {selectedVariant?.ageMin !== null && (
                        <div className="info-badge">
                            <i className="bi bi-emoji-smile me-2 text-primary"></i>
                            Возраст: {selectedVariant.ageMin}{selectedVariant.ageMax ? `-${selectedVariant.ageMax}` : '+'} мес.
                        </div>
                    )}

                    {/* НОВОЕ: Отображение даты производства */}
                    {selectedVariant?.stock?.productionDate && (
                        <div className="info-badge">
                            <i className="bi bi-calendar-check me-2 text-success"></i>
                            Изготовлено: {formatDate(selectedVariant.stock.productionDate)}
                        </div>
                    )}

                    {/* НОВОЕ: Отображение срока годности */}
                    {selectedVariant?.stock?.expiryDate && (
                        <div className="info-badge">
                            <i className="bi bi-exclamation-circle me-2 text-danger"></i>
                            Годен до: {formatDate(selectedVariant.stock.expiryDate)}
                        </div>
                    )}
                    </div>

                    <div className="mb-4">
                        <label className="small fw-bold text-uppercase text-muted d-block mb-2">Варианты:</label>
                        <div className="d-flex flex-wrap gap-2">
                            {product.variants?.map(v => (
                                <button 
                                    key={v.variantId} 
                                    /* Заменили btn-dark на variant-btn и проверяем условие active */
                                    className={`btn btn-sm rounded-pill px-3 variant-btn ${selectedVariant?.variantId === v.variantId ? 'active' : ''}`}
                                    onClick={() => setSelectedVariant(v)}
                                >
                                    {/* Вернули кружочек цвета (color-dot) */}
                                    {v.color && (
                                        <span 
                                            className="color-dot" 
                                            style={{ backgroundColor: colorMap[v.color.toLowerCase()] || '#eee' }}
                                        ></span>
                                    )}
                                    {v.color} {v.size ? `(${v.size})` : ''}
                                </button>
                            ))}
                        </div>
                    </div>

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
                        <h6 className="fw-bold small text-uppercase mb-2">Описание</h6>
                        <p className="text-muted mb-0 small" style={{whiteSpace: 'pre-line'}}>
                            {product.description}
                        </p>
                    </div>
                </div>
            </div>

            <ProductReviews 
                productId={id} 
                reviews={reviews} 
                onReviewAdded={loadData} 
            />
        </div>
    );
};

export default ProductPage;