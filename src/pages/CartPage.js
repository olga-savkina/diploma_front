import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState(''); // Состояние для адреса
    const navigate = useNavigate();

    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCartItems(savedCart);
    }, []);

    const updateQuantity = (variantId, delta) => {
        const updated = cartItems.map(item => {
            if (item.variantId === variantId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        });
        setCartItems(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
    };

    const removeItem = (variantId) => {
        const filtered = cartItems.filter(item => item.variantId !== variantId);
        setCartItems(filtered);
        localStorage.setItem('cart', JSON.stringify(filtered));
        window.dispatchEvent(new Event('storage'));
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (!address.trim()) {
            alert("Пожалуйста, введите адрес доставки");
            return;
        }

        setLoading(true);
        try {
            // Формируем данные строго под наш OrderRequest DO на бэкенде
            const orderData = {
                shippingAddress: address,
                items: cartItems.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const res = await axios.post('http://localhost:8080/api/orders', orderData, { withCredentials: true });
            
            if (res.status === 200 || res.status === 201) {
                alert("Заказ успешно оформлен! Вам начислены бонусные баллы.");
                localStorage.removeItem('cart');
                setCartItems([]);
                window.dispatchEvent(new Event('storage'));
                navigate('/profile'); 
            }
        } catch (err) {
            console.error("Ошибка при оформлении:", err);
            const errorMessage = err.response?.data?.message || "Произошла ошибка при создании заказа";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="container my-5 text-center">
                <i className="bi bi-cart-x text-muted" style={{ fontSize: '4rem' }}></i>
                <h2 className="mt-3 text-secondary">Ваша корзина пуста</h2>
                <button onClick={() => navigate('/catalog')} className="btn btn-primary mt-3 px-4 rounded-pill">
                    Перейти в каталог
                </button>
            </div>
        );
    }

    return (
        <div className="container my-5">
            <h2 className="fw-bold mb-4">Оформление заказа</h2>
            <div className="row g-4">
                <div className="col-md-8">
                    {/* Список товаров */}
                    {cartItems.map(item => (
                        <div key={item.variantId} className="card border-0 shadow-sm mb-3 p-3 rounded-4">
                            <div className="row align-items-center">
                                <div className="col-md-2 col-3">
                                    <img 
                                        src={item.image ? `http://localhost:8080${item.image}` : '/no-photo.png'} 
                                        alt={item.name} 
                                        className="img-fluid rounded-3" 
                                    />
                                </div>
                                <div className="col-md-4 col-9">
                                    <h6 className="mb-1 fw-bold">{item.name}</h6>
                                    <small className="text-muted d-block text-capitalize">
                                        {item.color} {item.size && `| Размер: ${item.size}`}
                                    </small>
                                </div>
                                <div className="col-md-3 col-6 mt-md-0 mt-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <button className="btn btn-sm btn-outline-secondary rounded-circle" onClick={() => updateQuantity(item.variantId, -1)}>-</button>
                                        <span className="fw-bold px-2">{item.quantity}</span>
                                        <button className="btn btn-sm btn-outline-secondary rounded-circle" onClick={() => updateQuantity(item.variantId, 1)}>+</button>
                                    </div>
                                </div>
                                <div className="col-md-2 col-4 mt-md-0 mt-3 fw-bold text-primary text-end">
                                    {(item.price * item.quantity).toFixed(2)} BYN
                                </div>
                                <div className="col-md-1 col-2 mt-md-0 mt-3 text-end">
                                    <button className="btn btn-link text-danger p-0" onClick={() => removeItem(item.variantId)}>
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Поле адреса */}
                    <div className="card border-0 shadow-sm p-4 mt-4 rounded-4">
                        <h5 className="fw-bold mb-3">Адрес доставки</h5>
                        <textarea 
                            className="form-control border-0 bg-light p-3 rounded-3 shadow-none" 
                            rows="3" 
                            placeholder="Введите ваш полный адрес (город, улица, дом, квартира)..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 bg-light rounded-4 sticky-top" style={{ top: '100px' }}>
                        <h5 className="fw-bold mb-4">Детали заказа</h5>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Товары:</span>
                            <span>{totalAmount.toFixed(2)} BYN</span>
                        </div>
                        <div className="d-flex justify-content-between mb-4">
                            <span className="text-muted">Доставка:</span>
                            <span className="text-success fw-bold">Бесплатно</span>
                        </div>
                        <div className="p-3 bg-white rounded-3 mb-4 border-start border-primary border-4">
                            <small className="text-muted d-block">Будет начислено баллов:</small>
                            <span className="fw-bold text-primary">+{(totalAmount * 0.1).toFixed(0)}</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between mb-4">
                            <span className="fw-bold">К оплате:</span>
                            <h4 className="fw-bold text-primary">{totalAmount.toFixed(2)} BYN</h4>
                        </div>
                        <button 
                            className="btn btn-dark w-100 py-3 rounded-pill fw-bold shadow-sm" 
                            onClick={handleCheckout}
                            disabled={loading}
                        >
                            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                            {loading ? "Оформление..." : "Подтвердить заказ"}
                        </button>
                        <button 
                            onClick={() => navigate('/catalog')} 
                            className="btn btn-link w-100 mt-2 text-muted text-decoration-none small"
                        >
                            ← Вернуться к покупкам
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;