import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CITIES = ["Минск", "Гомель", "Брест", "Гродно", "Витебск", "Могилев"];

const CartPage = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Состояния бонусов
    const [availableBonuses, setAvailableBonuses] = useState(0);
    const [useBonuses, setUseBonuses] = useState(false);

    // Состояния адреса
    const [selectedCity, setSelectedCity] = useState('');
    const [customCity, setCustomCity] = useState(''); 
    const [isCustomCity, setIsCustomCity] = useState(false);
    const [streetAddress, setStreetAddress] = useState('');

    // Оплата
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '' });

    // --- ФУНКЦИИ ОБРАБОТКИ ---

    const handleCityChange = (e) => {
        const value = e.target.value;
        if (value === 'OTHER') {
            setIsCustomCity(true);
            setSelectedCity('');
        } else {
            setSelectedCity(value);
            setIsCustomCity(false);
        }
    };

    const handleCardNumber = (e) => {
        // Оставляем только цифры и ограничиваем 16 знаками
        let v = e.target.value.replace(/\D/g, '').substring(0, 16);
        // Разбиваем по 4 цифры пробелом для красоты
        v = v.replace(/(.{4})/g, '$1 ').trim();
        setCardDetails({ ...cardDetails, number: v });
    };

    const handleCVC = (e) => {
        const v = e.target.value.replace(/\D/g, '').substring(0, 3);
        setCardDetails({ ...cardDetails, cvc: v });
    };

    // --- ФУНКЦИЯ ЗАГРУЗКИ ---
    const loadData = useCallback(async () => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) return;

        const userName = userData.username || userData.email?.split('@')[0];
        const cartKey = `cart_${userName}`;
        
        const savedCart = JSON.parse(localStorage.getItem(cartKey)) || [];
        setCartItems(savedCart);
        
        try {
            const res = await axios.get('http://localhost:8080/api/orders/me/bonuses', { withCredentials: true });
            setAvailableBonuses(res.data.bonuses || 0);
        } catch (err) {
            console.warn("Бонусы пока недоступны");
            setAvailableBonuses(0);
        }
    }, []);

    useEffect(() => {
        loadData();
        window.addEventListener('storage', loadData);
        window.addEventListener('cartUpdated', loadData);
        return () => {
            window.removeEventListener('storage', loadData);
            window.removeEventListener('cartUpdated', loadData);
        };
    }, [loadData]);

    // --- РАСЧЕТЫ ---
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const bonusesToSubtract = useBonuses ? Math.min(availableBonuses, subtotal * 0.5) : 0;
    const finalAmount = subtotal - bonusesToSubtract;
    const bonusesToEarn = finalAmount * 0.05; // Начисляем 5% от покупки

    // --- ОФОРМЛЕНИЕ ЗАКАЗА ---
    const handleCheckout = async () => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
            alert("Пожалуйста, войдите в систему");
            return;
        }

        const finalCityName = isCustomCity ? customCity : selectedCity;
        if (!finalCityName || !streetAddress.trim()) {
            alert("Заполните данные доставки");
            return;
        }

        if (paymentMethod === 'CARD' && (cardDetails.number.length < 19 || cardDetails.cvc.length < 3)) {
            alert("Проверьте данные карты");
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                items: cartItems.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: item.price
                })),
                shippingAddress: `${finalCityName}, ${streetAddress}`,
                paymentMethod: paymentMethod,
                totalAmount: finalAmount,
                usedBonuses: bonusesToSubtract,
                status: paymentMethod === 'CARD' ? 'PAID' : 'PENDING'
            };

            const res = await axios.post('http://localhost:8080/api/orders', orderData, { withCredentials: true });
            
            if (res.status === 200 || res.status === 201) {
                alert("Заказ успешно оформлен!");
                const userName = userData.username || userData.email?.split('@')[0];
                localStorage.removeItem(`cart_${userName}`);
                window.dispatchEvent(new Event('cartUpdated'));
                navigate('/profile');
            }
        } catch (err) {
            alert(err.response?.data?.message || "Ошибка при оформлении");
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="container my-5 text-center">
                <div className="p-5 bg-light rounded-5">
                    <h2 className="text-muted">Корзина пуста</h2>
                    <button onClick={() => navigate('/catalog')} className="btn btn-primary btn-lg rounded-pill mt-3">Перейти в каталог</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container my-5">
            <h2 className="fw-bold mb-4">Оформление заказа</h2>
            <div className="row g-4">
                <div className="col-lg-8">
                    {/* 1. ТОВАРЫ */}
                    <div className="card border-0 shadow-sm p-4 mb-4 rounded-4">
                        <h5 className="fw-bold mb-4">1. Ваши товары</h5>
                        {cartItems.map((item, idx) => (
                            <div key={idx} className={`d-flex align-items-center mb-3 pb-3 ${idx !== cartItems.length - 1 ? 'border-bottom' : ''}`}>
                                <img 
                                    src={`http://localhost:8080${item.image}`} 
                                    alt={item.name} 
                                    className="rounded-3 me-3" 
                                    style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                                />
                                <div className="flex-grow-1">
                                    <h6 className="mb-0 fw-bold">{item.name}</h6>
                                    <small className="text-muted">Кол-во: {item.quantity} шт.</small>
                                </div>
                                <div className="text-end">
                                    <span className="fw-bold">{(item.price * item.quantity).toFixed(2)} BYN</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 2. ДОСТАВКА */}
                    <div className="card border-0 shadow-sm p-4 mb-4 rounded-4">
                        <h5 className="fw-bold mb-3">2. Куда доставить?</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="small text-muted">Город</label>
                                {!isCustomCity ? (
                                    <select className="form-select border-0 bg-light p-3" value={selectedCity} onChange={handleCityChange}>
                                        <option value="">Выберите город...</option>
                                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="OTHER">Другой город...</option>
                                    </select>
                                ) : (
                                    <div className="input-group">
                                        <input 
                                            type="text" className="form-control border-0 bg-light p-3" 
                                            placeholder="Напишите ваш город"
                                            value={customCity}
                                            onChange={(e) => setCustomCity(e.target.value)}
                                        />
                                        <button className="btn btn-outline-secondary border-0" onClick={() => setIsCustomCity(false)}>✕</button>
                                    </div>
                                )}
                            </div>
                            <div className="col-md-6">
                                <label className="small text-muted">Адрес (Улица, дом, кв)</label>
                                <input 
                                    type="text" className="form-control border-0 bg-light p-3" 
                                    placeholder="ул. Ленина 10, кв. 5"
                                    value={streetAddress}
                                    onChange={(e) => setStreetAddress(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. ОПЛАТА */}
                    <div className="card border-0 shadow-sm p-4 rounded-4">
                        <h5 className="fw-bold mb-3">3. Способ оплаты</h5>
                        <div className="d-flex gap-3 mb-4">
                            <button 
                                className={`flex-fill p-3 rounded-4 border btn text-start ${paymentMethod === 'CASH' ? 'border-primary bg-light' : ''}`}
                                onClick={() => setPaymentMethod('CASH')}
                            >
                                <div className="fw-bold">Наличные</div>
                                <small className="text-muted">При получении</small>
                            </button>
                            <button 
                                className={`flex-fill p-3 rounded-4 border btn text-start ${paymentMethod === 'CARD' ? 'border-primary bg-light' : ''}`}
                                onClick={() => setPaymentMethod('CARD')}
                            >
                                <div className="fw-bold">Картой онлайн</div>
                                <small className="text-muted">Visa, MasterCard, БЕЛКАРТ</small>
                            </button>
                        </div>

                        {paymentMethod === 'CARD' && (
                            <div className="p-4 bg-light rounded-4">
                                <div className="mb-3">
                                    <label className="small text-muted mb-1">Номер карты</label>
                                    <input 
                                        type="text" className="form-control border-0 p-3 shadow-sm" 
                                        placeholder="0000 0000 0000 0000" 
                                        value={cardDetails.number} onChange={handleCardNumber} 
                                    />
                                </div>
                                <div className="row g-3">
                                    <div className="col-6">
                                        <label className="small text-muted mb-1">Срок действия</label>
                                        <input type="text" className="form-control border-0 p-3 shadow-sm" placeholder="ММ/ГГ" value={cardDetails.expiry} onChange={(e) => {
                                            let v = e.target.value.replace(/\D/g, '').substring(0, 4);
                                            if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
                                            setCardDetails({...cardDetails, expiry: v});
                                        }} />
                                    </div>
                                    <div className="col-6">
                                        <label className="small text-muted mb-1">CVC</label>
                                        <input type="password" className="form-control border-0 p-3 shadow-sm" placeholder="000" value={cardDetails.cvc} onChange={handleCVC} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 rounded-4 sticky-top" style={{ top: '100px' }}>
                        <h5 className="fw-bold mb-4">Итого</h5>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Товары ({cartItems.length})</span>
                            <span>{subtotal.toFixed(2)} BYN</span>
                        </div>
                        <div className="bg-light p-3 rounded-4 my-3">
                            <div className="form-check form-switch d-flex justify-content-between align-items-center p-0">
                                <label className="form-check-label fw-bold small">Списать бонусы</label>
                                <input 
                                    className="form-check-input ms-0" type="checkbox" role="switch"
                                    checked={useBonuses}
                                    disabled={availableBonuses <= 0}
                                    onChange={() => setUseBonuses(!useBonuses)}
                                    style={{ width: '40px', height: '20px' }}
                                />
                            </div>
                            <small className="text-muted d-block mt-1">Доступно: {availableBonuses.toFixed(2)} Б</small>
                            {useBonuses && <div className="text-success small mt-1 fw-bold">Скидка: -{bonusesToSubtract.toFixed(2)} BYN</div>}
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <span className="h5 fw-bold mb-0">К оплате</span>
                            <span className="h3 fw-bold text-primary mb-0">{finalAmount.toFixed(2)} BYN</span>
                        </div>
                        <div className="p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-4 mb-4 text-center">
                            <small className="text-primary fw-bold">Начислим: +{bonusesToEarn.toFixed(2)} Б</small>
                        </div>
                        <button className="btn btn-dark w-100 py-3 rounded-pill fw-bold shadow-lg" onClick={handleCheckout} disabled={loading}>
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : (paymentMethod === 'CARD' ? 'Оплатить и заказать' : 'Подтвердить заказ')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;