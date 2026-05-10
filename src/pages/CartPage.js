import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CITIES = ["Минск", "Гомель", "Брест", "Гродно", "Витебск", "Могилев"];

const CartPage = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Состояния скидок и бонусов
    const [isFirstOrder, setIsFirstOrder] = useState(false);
    const [isBirthdayDiscount, setIsBirthdayDiscount] = useState(false);
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

    // --- ЛОГИКА ЗАГРУЗКИ И ПРОВЕРКИ УСЛОВИЙ ---
    const loadData = useCallback(async () => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) return;

        const userName = userData.username || userData.email?.split('@')[0];
        const cartKey = `cart_${userName}`;
        setCartItems(JSON.parse(localStorage.getItem(cartKey)) || []);
        
        try {
            const [ordersRes, profileRes, bonusRes] = await Promise.all([
                axios.get('http://localhost:8080/api/orders/my', { withCredentials: true }),
                axios.get('http://localhost:8080/api/profile/me', { withCredentials: true }),
                axios.get('http://localhost:8080/api/orders/me/bonuses', { withCredentials: true })
            ]);

            // 1. Проверка на первый заказ
            setIsFirstOrder(ordersRes.data.length === 0);

            // 2. Проверка на День Рождения (±3 дня)
            const children = profileRes.data.children || [];
            const today = new Date();
            const hasBirthday = children.some(child => {
                if (!child.birthDate) return false;
                const bDay = new Date(child.birthDate);
                const currentYearBDay = new Date(today.getFullYear(), bDay.getMonth(), bDay.getDate());
                const diffDays = Math.ceil(Math.abs(currentYearBDay - today) / (1000 * 60 * 60 * 24));
                return diffDays <= 3;
            });
            setIsBirthdayDiscount(hasBirthday);

            setAvailableBonuses(bonusRes.data.bonuses || 0);
        } catch (err) {
            console.warn("Данные скидок недоступны");
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- РАСЧЕТЫ ---
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Скидка 20% (не суммируем, берем 20% если хоть одно условие выполнено)
    const discountPercent = (isFirstOrder || isBirthdayDiscount) ? 0.20 : 0;
    const promotionDiscount = subtotal * discountPercent;
    
    const amountAfterPromo = subtotal - promotionDiscount;
    const bonusesToSubtract = useBonuses ? Math.min(availableBonuses, amountAfterPromo * 0.5) : 0;
    
    const finalAmount = amountAfterPromo - bonusesToSubtract;
    const bonusesToEarn = finalAmount * 0.05;
// 1. Форматирование срока действия (ММ/ГГ)
    const formatExpiry = (value) => {
        const cleanValue = value.replace(/\D/g, ''); // Оставляем только цифры
        if (cleanValue.length > 2) {
            return cleanValue.substr(0, 2) + '/' + cleanValue.substr(2, 2);
        }
        return cleanValue.substr(0, 2);
    };

    // 2. Форматирование номера карты (цифры + пробелы)
    const formatCardNumber = (value) => {
        const onlyNums = value.replace(/\D/g, ''); // Убираем всё, кроме цифр
        const cutNums = onlyNums.substring(0, 16); // Максимум 16 цифр
        return cutNums.replace(/(\d{4})(?=\d)/g, '$1 '); // Добавляем пробелы
    };
    // --- ОБРАБОТЧИКИ ---
const handleCheckout = async () => {
    const finalCityName = isCustomCity ? customCity : selectedCity;
    if (!finalCityName || !streetAddress.trim()) return alert("Заполните адрес");

    // Валидация карты
    if (paymentMethod === 'CARD') {
        const { number, expiry, cvc } = cardDetails;
        if (number.length !== 16) return alert("Номер карты должен содержать 16 цифр");
        if (!/^\d{2}\/\d{2}$/.test(expiry)) return alert("Введите срок действия в формате ММ/ГГ");
        if (cvc.length !== 3) return alert("CVC должен содержать 3 цифры");
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
            paymentMethod,
            totalAmount: finalAmount,
            usedBonuses: Number(bonusesToSubtract.toFixed(0)), // Округляем бонусы до целого
            status: paymentMethod === 'CARD' ? 'PAID' : 'PENDING'
        };
        
        await axios.post('http://localhost:8080/api/orders', orderData, { withCredentials: true });
        
        alert("Заказ успешно оформлен!");
        
        // Очистка корзины
        const userData = JSON.parse(localStorage.getItem('user'));
        const userName = userData.username || userData.email?.split('@')[0];
        localStorage.removeItem(`cart_${userName}`);
        
        navigate('/profile');
    } catch (err) {
        console.error(err);
        alert("Ошибка оформления заказа");
    } finally { 
        setLoading(false); 
    }
};

    if (cartItems.length === 0) return (
        <div className="container my-5 text-center p-5 bg-light rounded-5">
            <i className="bi bi-cart-x display-1 text-muted"></i>
            <h2 className="mt-4 text-muted">Корзина пуста</h2>
            <button onClick={() => navigate('/catalog')} className="btn btn-primary rounded-pill mt-3">В каталог</button>
        </div>
    );

    return (
        <div className="container my-5">
            <h2 className="fw-bold mb-4">Оформление заказа</h2>
            <div className="row g-4">
                <div className="col-lg-8">
                    {/* ТОВАРЫ */}
                    <div className="card border-0 shadow-sm p-4 mb-4 rounded-4">
                        <h5 className="fw-bold mb-4">1. Ваши товары</h5>
                        {cartItems.map((item, idx) => (
                            <div key={idx} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                <img src={`http://localhost:8080${item.image}`} alt="" className="rounded-3 me-3" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                                <div className="flex-grow-1">
                                    <h6 className="mb-0 fw-bold">{item.name}</h6>
                                    <small className="text-muted">{item.quantity} шт. × {item.price} BYN</small>
                                </div>
                                <span className="fw-bold">{(item.price * item.quantity).toFixed(2)} BYN</span>
                            </div>
                        ))}
                    </div>

                    {/* ДОСТАВКА */}
                    <div className="card border-0 shadow-sm p-4 mb-4 rounded-4">
                        <h5 className="fw-bold mb-3">2. Доставка</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <select className="form-select border-0 bg-light p-3" value={selectedCity} onChange={e => e.target.value === 'OTHER' ? setIsCustomCity(true) : setSelectedCity(e.target.value)}>
                                    <option value="">Выберите город...</option>
                                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="OTHER">Другой...</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <input type="text" className="form-control border-0 bg-light p-3" placeholder="Улица, дом, кв" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} />
                            </div>
                        </div>
                    </div>

                   {/* ОПЛАТА */}
<div className="card border-0 shadow-sm p-4 rounded-4">
    <h5 className="fw-bold mb-3">3. Оплата</h5>
    <div className="d-flex gap-3 mb-4">
        <button 
            className={`btn flex-fill p-3 rounded-4 border ${paymentMethod === 'CASH' ? 'border-primary bg-light fw-bold' : ''}`} 
            onClick={() => setPaymentMethod('CASH')}
        >
            <i className="bi bi-cash-stack me-2"></i>Наличные
        </button>
        <button 
            className={`btn flex-fill p-3 rounded-4 border ${paymentMethod === 'CARD' ? 'border-primary bg-light fw-bold' : ''}`} 
            onClick={() => setPaymentMethod('CARD')}
        >
            <i className="bi bi-credit-card me-2"></i>Картой
        </button>
    </div>

    {/* Форма карты, появляется только если выбрано 'CARD' */}
    {paymentMethod === 'CARD' && (
        <div className="bg-light p-4 rounded-4 shadow-sm animate__animated animate__fadeIn">
            <div className="row g-3">
 <div className="col-12">
    <label className="small fw-bold text-muted mb-1">НОМЕР КАРТЫ</label>
    <input 
        type="text" 
        className="form-control border-0 p-3" 
        placeholder="0000 0000 0000 0000"
        value={formatCardNumber(cardDetails.number)} // Используем функцию для отображения
        onChange={e => {
            const rawValue = e.target.value.replace(/\s/g, ''); // Убираем пробелы перед сохранением
            if (/^\d*$/.test(rawValue)) { // Проверка: только цифры
                setCardDetails({...cardDetails, number: rawValue});
            }
        }}
    />
</div>

<div className="col-md-6">
    <label className="small fw-bold text-muted mb-1">СРОК ДЕЙСТВИЯ</label>
    <input 
        type="text" 
        className="form-control border-0 p-3" 
        placeholder="ММ/ГГ"
        maxLength="5"
        value={cardDetails.expiry}
        onChange={e => {
            const formatted = formatExpiry(e.target.value);
            setCardDetails({...cardDetails, expiry: formatted});
        }}
    />
</div>

<div className="col-md-6">
    <label className="small fw-bold text-muted mb-1">CVC</label>
    <input 
        type="password" 
        className="form-control border-0 p-3" 
        placeholder="***"
        maxLength="3"
        value={cardDetails.cvc}
        onChange={e => {
            const val = e.target.value.replace(/\D/g, ''); // Только цифры
            setCardDetails({...cardDetails, cvc: val});
        }}
    />
</div>
            </div>
        </div>
    )}
</div>
                </div>

                {/* ИТОГО */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 rounded-4 sticky-top" style={{ top: '100px' }}>
                        <h5 className="fw-bold mb-4">Итого</h5>
                        <div className="d-flex justify-content-between mb-2">
                            <span>Сумма:</span>
                            <span>{subtotal.toFixed(2)} BYN</span>
                        </div>

                        {/* Блок активной акции */}
                        {promotionDiscount > 0 && (
                            <div className="d-flex justify-content-between mb-2 text-danger fw-bold">
                                <span>
                                    <i className={`bi ${isBirthdayDiscount ? 'bi-gift' : 'bi-stars'} me-2`}></i>
                                    {isBirthdayDiscount ? 'Скидка ДР (20%)' : '1-й заказ (20%)'}
                                </span>
                                <span>-{promotionDiscount.toFixed(2)} BYN</span>
                            </div>
                        )}

                        <div className="bg-light p-3 rounded-4 my-3">
                            <div className="form-check form-switch d-flex justify-content-between align-items-center p-0">
                                <label className="fw-bold small">Использовать бонусы</label>
                                <input className="form-check-input ms-0" type="checkbox" checked={useBonuses} onChange={() => setUseBonuses(!useBonuses)} disabled={availableBonuses <= 0} />
                            </div>
                            <small className="text-muted">Доступно: {availableBonuses.toFixed(2)} Б</small>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <span className="h5 fw-bold">К оплате:</span>
                            <span className="h3 fw-bold text-primary">{finalAmount.toFixed(2)} BYN</span>
                        </div>

                        <button className="btn btn-dark w-100 py-3 rounded-pill fw-bold" onClick={handleCheckout} disabled={loading}>
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Оформить заказ'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;