import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ 
        firstName: '', 
        lastName: '', 
        phoneNumber: '', 
        email: '' 
    });
    const [children, setChildren] = useState([]);
    const [newChild, setNewChild] = useState({ name: '', gender: 'Boy', birthDate: '' });
    const [editingChild, setEditingChild] = useState(null);
    const [bonusPoints, setBonusPoints] = useState(0); // Добавьте эту строку
    const [orders, setOrders] = useState([]); // Состояние для заказов[cite: 1]
    const statusTranslations = {
        'PENDING': 'В ожидании',
        'PAID': 'Оплачен',
        'SHIPPED': 'Отправлен',
        'DELIVERED': 'Доставлен',
        'CANCELLED': 'Отменен'
    };
        // Состояние для хранения ID развернутого заказа
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    // Функция для переключения видимости деталей заказа
    const toggleOrder = (orderId) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };
useEffect(() => {
    const fetchUserData = async () => {
        try {
            // Загружаем данные профиля
            const res = await axios.get('http://localhost:8080/api/profile/me', { withCredentials: true });
            const data = res.data;
            
            // Заполняем форму и баллы
            setFormData({
                firstName: data.client?.firstName || '',
                lastName: data.client?.lastName || '',
                phoneNumber: data.client?.phoneNumber || '',
                email: data.email || user?.email || ''
            });
            setChildren(data.children || []);
            setBonusPoints(data.client?.bonusPoints || 0);

            const ordersRes = await axios.get('http://localhost:8080/api/orders/my', { withCredentials: true });

                // Проверяем: если пришел массив — ставим его, если нет — ставим пустой массив
                if (Array.isArray(ordersRes.data)) {
                    setOrders(ordersRes.data);
                } else {
                    console.error("Бэкенд вернул не массив:", ordersRes.data);
                    setOrders([]); // Гарантируем, что это будет массив
                }

        } catch (err) {
            console.error("Ошибка загрузки данных", err);
        } finally {
            setLoading(false);
        }
    };
    fetchUserData();
}, [user]);

    if (loading) return <div className="text-center py-5">Загрузка...</div>;

    // --- ФУНКЦИИ РАБОТЫ С ДАННЫМИ ---

    const handleSaveProfile = async () => {
        try {
            await axios.put('http://localhost:8080/api/profile/update', formData, { withCredentials: true });
            setIsEditing(false);
            alert("Профиль обновлен");
        } catch (err) { alert("Ошибка сохранения"); }
    };

    const handleAddChild = async () => {
        try {
            const res = await axios.post('http://localhost:8080/api/profile/children', newChild, { withCredentials: true });
            setChildren([...children, res.data]);
            setNewChild({ name: '', gender: 'Boy', birthDate: '' });
        } catch (err) { alert("Ошибка при добавлении"); }
    };

    const handleDeleteChild = async (childId) => {
        if (window.confirm("Удалить запись о ребенке?")) {
            try {
                await axios.delete(`http://localhost:8080/api/profile/children/${childId}`, { withCredentials: true });
                setChildren(children.filter(c => c.id !== childId));
            } catch (err) { alert("Ошибка при удалении"); }
        }
    };

    const handleUpdateChild = async () => {
        try {
            await axios.put(`http://localhost:8080/api/profile/children/${editingChild.id}`, editingChild, { withCredentials: true });
            setChildren(children.map(c => c.id === editingChild.id ? editingChild : c));
            setEditingChild(null);
        } catch (err) { alert("Ошибка при обновлении"); }
    };

    const handleChangePassword = async () => {
        const oldPassword = prompt("Введите старый пароль:");
        const newPassword = prompt("Введите новый пароль:");
        if (oldPassword && newPassword) {
            try {
                await axios.put('http://localhost:8080/api/profile/change-password', 
                    { oldPassword, newPassword }, { withCredentials: true });
                alert("Пароль изменен!");
            } catch (err) { alert(err.response?.data || "Ошибка"); }
        }
    };
    
    const handleCancelOrder = async (orderId) => {
        if (window.confirm("Вы уверены, что хотите отменить заказ?")) {
            try {
                await axios.put(`http://localhost:8080/api/orders/${orderId}/cancel`, {}, { withCredentials: true });
                
                // Обновляем статус в локальном стейте
                setOrders(orders.map(order => 
                    order.orderId === orderId ? { ...order, status: 'CANCELLED' } : order
                ));
                
                alert("Заказ успешно отменен");
            } catch (err) {
                alert(err.response?.data || "Ошибка при отмене заказа");
            }
        }
    };
    const handleDeleteAccount = async () => {
        if (window.confirm("Вы уверены? Все данные будут стерты.")) {
            try {
                await axios.delete('http://localhost:8080/api/profile/delete-account', { withCredentials: true });
                window.location.href = "/login";
            } catch (err) { alert("Ошибка при удалении"); }
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return "";
        const diff = Date.now() - new Date(dob).getTime();
        const ageDate = new Date(diff);
        const years = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (years === 0) return "меньше года";
        return `${years} ${years === 1 ? 'год' : (years < 5 ? 'года' : 'лет')}`;
    };

    return (
        <div className="container py-5">
            <h2 className="text-center mb-5" style={{color: '#d63384'}}>Личный кабинет</h2>
            
            <div className="row g-4">
                {/* КАРТОЧКА ПРОФИЛЯ */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 h-100 p-4">
                        <h5 className="border-bottom pb-2 mb-3 text-danger">Мой профиль</h5>
                        {!isEditing ? (
                            <div className="profile-info">
                                <p><strong>Имя:</strong> {formData.firstName || '—'} {formData.lastName || '—'}</p>
                                <p><strong>Email:</strong> {formData.email || 'Не указан'}</p> 
                                <p><strong>Телефон:</strong> {formData.phoneNumber || 'Не указан'}</p>
                                <button className="btn btn-danger w-100 mt-3" onClick={() => setIsEditing(true)}>
                                    Редактировать
                                </button>
                            </div>
                        ) : (
                            <div className="profile-edit">
                                <label className="small text-muted">Имя</label>
                                <input type="text" className="form-control mb-2" value={formData.firstName} 
                                       onChange={e => setFormData({...formData, firstName: e.target.value})} />
                                <label className="small text-muted">Фамилия</label>
                                <input type="text" className="form-control mb-2" value={formData.lastName} 
                                       onChange={e => setFormData({...formData, lastName: e.target.value})} />
                                <label className="small text-muted">Телефон</label>
                                <input type="text" className="form-control mb-2" value={formData.phoneNumber} 
                                       onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                                <button className="btn btn-success w-100 mb-2" onClick={handleSaveProfile}>Сохранить</button>
                                <button className="btn btn-light w-100" onClick={() => setIsEditing(false)}>Отмена</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* КАРТОЧКА ДЕТЕЙ */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 h-100 p-4">
                        <h5 className="border-bottom pb-2 mb-3 text-danger">Мои дети ({children.length})</h5>
                        
                        <div className="children-list mb-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                            {children.length > 0 ? (
                                children.map(child => (
                                    <div key={child.id} className="p-2 rounded mb-2 border-start border-danger border-3 bg-light">
                                        {editingChild?.id === child.id ? (
                                            <div className="edit-mode">
                                                <input type="text" className="form-control form-control-sm mb-1" value={editingChild.name}
                                                       onChange={e => setEditingChild({...editingChild, name: e.target.value})} />
                                                <div className="d-flex gap-1 mb-1">
                                                    <select className="form-select form-select-sm" value={editingChild.gender}
                                                            onChange={e => setEditingChild({...editingChild, gender: e.target.value})}>
                                                        <option value="Boy">Мальчик</option>
                                                        <option value="Girl">Девочка</option>
                                                    </select>
                                                    <input type="date" className="form-control form-control-sm" value={editingChild.birthDate}
                                                           onChange={e => setEditingChild({...editingChild, birthDate: e.target.value})} />
                                                </div>
                                                <div className="d-flex gap-1">
                                                    <button className="btn btn-sm btn-success w-100" onClick={handleUpdateChild}>Ок</button>
                                                    <button className="btn btn-sm btn-light w-100" onClick={() => setEditingChild(null)}>Х</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-bold">{child.name || (child.gender === 'Boy' ? 'Мальчик' : 'Девочка')}</div>
                                                    <small className="text-muted">{new Date(child.birthDate).toLocaleDateString('ru-RU')} ({calculateAge(child.birthDate)})</small>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-link text-primary p-0 text-decoration-none small" onClick={() => setEditingChild(child)}>Изм.</button>
                                                    <button className="btn btn-link text-danger p-0 text-decoration-none small" onClick={() => handleDeleteChild(child.id)}>Уд.</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted small text-center">Список детей пуст</p>
                            )}
                        </div>

                        <div className="add-child-form border-top pt-3">
                            <input type="text" className="form-control form-control-sm mb-2" placeholder="Имя ребенка"
                                   value={newChild.name} onChange={e => setNewChild({...newChild, name: e.target.value})} />
                            <div className="d-flex gap-2 mb-2">
                                <select className="form-select form-select-sm" value={newChild.gender} onChange={e => setNewChild({...newChild, gender: e.target.value})}>
                                    <option value="Boy">Мальчик</option>
                                    <option value="Girl">Девочка</option>
                                </select>
                                <input type="date" className="form-control form-control-sm" value={newChild.birthDate}
                                       onChange={e => setNewChild({...newChild, birthDate: e.target.value})} />
                            </div>
                            <button className="btn btn-danger btn-sm w-100" onClick={handleAddChild} disabled={!newChild.birthDate}>+ Добавить ребенка</button>
                        </div>
                    </div>
                </div>

                {/* КАРТОЧКА БАЛЛОВ */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 h-100 p-4 text-center">
                        <h5 className="border-bottom pb-2 mb-3 text-danger text-start">Бонусы</h5>
                        {/* Заменяем 0 на переменную bonusPoints */}
                        <div className="display-4 fw-bold mt-3" style={{color: '#d63384'}}>
                            {bonusPoints}
                        </div>
                        <p className="text-muted">баллов</p>
                        <small className="text-muted mt-auto">5 баллов = 1 BYN скидки</small>
                    </div>
                </div>
                
               {/* КАРТОЧКА ИСТОРИИ ЗАКАЗОВ */}
                <div className="col-12 mt-4">
                    <div className="card shadow-sm border-0 p-4">
                        <h5 className="border-bottom pb-2 mb-3 text-danger">История заказов</h5>
                        {orders.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>№ Заказа</th>
                                            <th>Дата</th>
                                            <th>Сумма</th>
                                            <th>Статус</th>
                                            <th>Товары</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <React.Fragment key={order.orderId}>
                                                {/* Добавляем onClick для раскрытия */}
                                                <tr 
                                                    onClick={() => toggleOrder(order.orderId)} 
                                                    style={{ cursor: 'pointer' }}
                                                    className={expandedOrderId === order.orderId ? 'table-active' : ''}
                                                >
                                                    <td className="fw-bold">#{order.orderId.substring(0, 8)}</td>
                                                    <td>{new Date(order.orderDate).toLocaleDateString('ru-RU')}</td>
                                                    <td className="text-nowrap">{order.totalAmount} BYN</td>
                                                    <td>
                                                        {/* Класс статуса должен соответствовать значению из БД (PENDING, PAID и т.д.) */}
                                                        <span className={`status-badge ${order.status}`}>
                                                            {statusTranslations[order.status] || order.status}
                                                        </span>
                                                    </td>
                                                    <td className="toggle-cell">
                                                        {order.items ? order.items.length : 0} поз. 
                                                        <span className="arrow">{expandedOrderId === order.orderId ? ' ▲' : ' ▼'}</span>
                                                    </td>
                                                </tr>
                                                
                                                {/* Выпадающая панель */}
                                                {expandedOrderId === order.orderId && (
                                                    <tr className="order-details-row">
                                                        <td colSpan="5">
                                                            <div className="details-content p-3 bg-light border-start border-danger border-4">
                                                                <h6 className="fw-bold">Детали заказа:</h6>
                                                                <ul className="list-unstyled mb-2">
                                                                    {order.items && order.items.map((item) => (
                                                                        <li key={item.orderItemId} className="border-bottom py-1 d-flex justify-content-between align-items-center">
                                                                            <div>
                                                                                {/* Отображаем название товара. Если на бэкенде поле называется иначе, замените productName на нужное */}
                                                                                <span className="fw-bold">{item.productName || "Название товара"}</span>
                                                                                <br />
                                                                                {/* Характеристики мелким текстом */}
                                                                                    <small className="text-muted">
                                                                                        Цвет: {item.color}, Размер: {item.size}
                                                                                    </small>
                                                                                    <br />
                                                                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                                        арт: {item.sku}
                                                                                    </small>
            
                                                                            </div>
                                                                            <span>{item.quantity} шт. x {item.priceAtSale} BYN</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                <div className="shipping-info small text-muted">
                                                                    <strong>Адрес доставки:</strong> {order.shippingAddress || 'Не указан'}
                                                                </div>
                                                                <div className="shipping-info small text-muted d-flex justify-content-between align-items-end">
    <div>
        <strong>Адрес доставки:</strong> {order.shippingAddress || 'Не указан'}
    </div>
    
    {/* Кнопка отмены: показываем только если заказ "В ожидании" */}
    {order.status === 'PENDING' && (
        <button 
            className="btn btn-outline-danger btn-sm mt-2"
            onClick={(e) => {
                e.stopPropagation(); // Чтобы не закрылась панель при клике
                handleCancelOrder(order.orderId);
            }}
        >
            Отменить заказ
        </button>
    )}
</div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-muted">
                                <p>У вас пока нет заказов</p>
                                <a href="/catalog" className="btn btn-outline-danger btn-sm">Перейти к покупкам</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-center mt-5">
                <button className="btn btn-outline-secondary btn-sm me-3" onClick={handleChangePassword}>Сменить пароль</button>
                <button className="btn btn-link text-danger btn-sm text-decoration-none" onClick={handleDeleteAccount}>Удалить аккаунт</button>
            </div>
        </div>
    );
};

export default Profile;