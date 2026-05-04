import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null); // Для модального окна

    const statusColors = {
        "Новый": "bg-info",
        "В обработке": "bg-warning",
        "Отправлен": "bg-primary",
        "Доставлен": "bg-success",
        "Отменен": "bg-danger"
    };
    
    const statusTranslations = {
        'PENDING': 'В ожидании',
        'PAID': 'Оплачен',
        'SHIPPED': 'Отправлен',
        'DELIVERED': 'Доставлен',
        'CANCELLED': 'Отменен',
        // Оставляем старые варианты на случай, если они еще есть в БД
        'Новый': 'Новый',
        'Доставлен': 'Доставлен',
        'Отменен': 'Отменен'
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/admin/orders', { withCredentials: true });
            setOrders(res.data);
        } catch (err) {
            console.error("Ошибка при загрузке заказов", err);
        } finally {
            setLoading(false);
        }
    };

    // Имя функции исправлено на handleUpdateStatus
    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`http://localhost:8080/api/admin/orders/${orderId}/status`, 
                { status: newStatus }, 
                { withCredentials: true }
            );
            setOrders(orders.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            alert("Ошибка при обновлении статуса");
        }
    };

    if (loading) return <div className="text-center p-5">Загрузка заказов...</div>;

    return (
        <div className="p-4 w-100">
            <h3 className="mb-4 fw-bold">Управление заказами</h3>
            <div className="card shadow-sm border-0 rounded-4">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>ID Заказа</th>
                                <th>Дата</th>
                                <th>Клиент</th>
                                <th>Сумма</th>
                                <th>Статус</th>
                                <th className="text-center">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.orderId}>
                                    <td className="small text-muted">{order.orderId.substring(0, 8)}...</td>
                                    <td>{new Date(order.orderDate).toLocaleDateString('ru-RU')}</td>
                                    <td>
                                        <div className="fw-bold">
                                            {order.client ? `${order.client.firstName} ${order.client.lastName}` : "Неизвестный"}
                                        </div>
                                        <small className="text-muted">{order.client?.phoneNumber}</small>
                                    </td>
                                    <td className="fw-bold text-dark">{order.totalAmount} BYN</td>
                                    <td>
                                        <span className={`badge rounded-pill ${statusColors[order.status] || 'bg-secondary'}`}>
                                            {statusTranslations[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2 justify-content-center">
                                            <select 
                                                className="form-select form-select-sm" 
                                                value={order.status} 
                                                onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                                            >
                                                <option value="PENDING">Новый</option>
                                                <option value="PAID">Оплачен</option>
                                                <option value="SHIPPED">Отправлен</option>
                                                <option value="DELIVERED">Доставлен</option>
                                                <option value="CANCELLED">Отменен</option>
                                                
                                                <option value="Новый" hidden>Новый</option>
                                                <option value="Доставлен" hidden>Доставлен</option>
                                                <option value="Отменен" hidden>Отменен</option>
                                            </select>
                                            <button 
                                                className="btn btn-dark btn-sm rounded-3"
                                                onClick={() => setSelectedOrder(order)}
                                                data-bs-toggle="modal" 
                                                data-bs-target="#orderModal"
                                            >
                                                <i className="bi bi-eye me-1"></i> Детали
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ */}
            <div className="modal fade" id="orderModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content border-0 shadow rounded-4">
                        {selectedOrder && (
                            <>
                                <div className="modal-header border-0 pb-0">
                                    <h5 className="modal-title fw-bold">Заказ #{selectedOrder.orderId.substring(0, 8)}</h5>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <label className="text-muted small text-uppercase fw-bold">Информация о доставке</label>
                                            <p className="mb-1"><strong>Адрес:</strong> {selectedOrder.shippingAddress}</p>
                                            <p className="mb-1"><strong>Телефон:</strong> {selectedOrder.client?.phoneNumber}</p>
                                        </div>
                                        <div className="col-md-6 text-md-end">
                                            <label className="text-muted small text-uppercase fw-bold">Статус оплаты</label>
                                            <p className="text-success fw-bold">Оплачено (Картой)</p>
                                        </div>
                                    </div>

                                    <label className="text-muted small text-uppercase fw-bold mb-2">Состав заказа</label>
                                    <div className="list-group list-group-flush border rounded-3 overflow-hidden shadow-sm">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center p-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                                                        <span className="text-pink fw-bold">{idx + 1}</span>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>
                                                            {item.productName || "Загрузка названия..."}
                                                        </div>
                                                        <div className="mt-1">
                                                            <span className="badge bg-light text-dark border me-1 fw-normal">
                                                                Цвет: {item.color}
                                                            </span>
                                                            <span className="badge bg-light text-dark border me-1 fw-normal">
                                                                Размер: {item.size}
                                                            </span>
                                                            <small className="text-muted ms-1">арт. {item.sku}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold text-dark">
                                                        {item.quantity} шт. × {item.priceAtSale.toFixed(2)} BYN
                                                    </div>
                                                    <div className="text-pink small fw-bold">
                                                        Сумма: {(item.quantity * item.priceAtSale).toFixed(2)} BYN
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="d-flex justify-content-between mt-4 align-items-center">
                                        <span className="h5 fw-bold mb-0">Итого к оплате:</span>
                                        <span className="h4 fw-bold text-primary mb-0">{selectedOrder.totalAmount} BYN</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;