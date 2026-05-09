import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // 1. Единый конфиг для маппинга статусов, цветов и перевода
    const STATUS_CONFIG = {
        PENDING: { label: 'В ожидании', class: 'bg-warning text-dark', selectLabel: 'Новый' },
        PAID: { label: 'Оплачен', class: 'bg-info text-white', selectLabel: 'Оплачен' },
        SHIPPED: { label: 'Отправлен', class: 'bg-primary text-white', selectLabel: 'Отправлен' },
        DELIVERED: { label: 'Доставлен', class: 'bg-success text-white', selectLabel: 'Доставлен' },
        CANCELLED: { label: 'Отменен', class: 'bg-danger text-white', selectLabel: 'Отменен' },
        // Заглушки для старых данных в БД, если они остались
        "Новый": { label: 'В ожидании', class: 'bg-warning text-dark' },
        "Доставлен": { label: 'Доставлен', class: 'bg-success text-white' },
        "Отменен": { label: 'Отменен', class: 'bg-danger text-white' }
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

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`http://localhost:8080/api/admin/orders/${orderId}/status`, 
                { status: newStatus }, 
                { withCredentials: true }
            );
            // Обновляем локальное состояние, чтобы интерфейс изменился мгновенно
            setOrders(prevOrders => 
                prevOrders.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o)
            );
        } catch (err) {
            alert("Ошибка при обновлении статуса");
        }
    };

    if (loading) return <div className="text-center p-5 text-muted">Загрузка заказов BabyBoom...</div>;

    return (
        <div className="p-4 w-100">
            <h3 className="mb-4 fw-bold">Управление заказами</h3>
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="ps-4">ID</th>
                                <th>Дата</th>
                                <th>Клиент</th>
                                <th>Сумма</th>
                                <th>Статус</th>
                                <th className="text-center">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const config = STATUS_CONFIG[order.status] || { label: order.status, class: 'bg-secondary text-white' };
                                
                                return (
                                    <tr key={order.orderId}>
                                        <td className="ps-4 small text-muted font-monospace">
                                            {order.orderId.substring(0, 8)}
                                        </td>
                                        <td>{new Date(order.orderDate).toLocaleDateString('ru-RU')}</td>
                                        <td>
                                            <div className="fw-bold text-dark">
                                                {order.client ? `${order.client.firstName} ${order.client.lastName}` : "Гость"}
                                            </div>
                                            <small className="text-muted">{order.client?.phoneNumber || '—'}</small>
                                        </td>
                                        <td className="fw-bold text-dark">{order.totalAmount} BYN</td>
                                        <td>
                                            {/* Круглый значок (Badge) теперь всегда совпадает по цвету с конфигом */}
                                            <span className={`badge rounded-pill ${config.class} px-3 py-2`}>
                                                {config.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2 justify-content-center px-3">
                                                <select 
                                                    className="form-select form-select-sm rounded-3 shadow-sm" 
                                                    style={{ width: '150px' }}
                                                    value={order.status} 
                                                    onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                                                >
                                                    <option value="PENDING">Новый</option>
                                                    <option value="PAID">Оплачен</option>
                                                    <option value="SHIPPED">Отправлен</option>
                                                    <option value="DELIVERED">Доставлен</option>
                                                    <option value="CANCELLED">Отменен</option>
                                                </select>
                                                
                                                <button 
                                                    className="btn btn-dark btn-sm rounded-3 px-3"
                                                    onClick={() => setSelectedOrder(order)}
                                                    data-bs-toggle="modal" 
                                                    data-bs-target="#orderModal"
                                                >
                                                    <i className="bi bi-eye"></i> Детали
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* МОДАЛЬНОЕ ОКНО */}
            <div className="modal fade" id="orderModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        {selectedOrder && (
                            <>
                                <div className="modal-header border-0">
                                    <h5 className="modal-title fw-bold ms-2">Заказ #{selectedOrder.orderId.substring(0, 8)}</h5>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="row g-4 mb-4">
                                        <div className="col-md-6">
                                            <div className="p-3 bg-light rounded-3">
                                                <label className="text-muted small text-uppercase fw-bold d-block mb-2">Доставка</label>
                                                <p className="mb-1 text-dark"><strong>Адрес:</strong> {selectedOrder.shippingAddress}</p>
                                                <p className="mb-0 text-dark"><strong>Тел:</strong> {selectedOrder.client?.phoneNumber}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6 text-md-end">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <label className="text-muted small text-uppercase fw-bold d-block mb-2">Оплата</label>
                                                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">
                                                    {selectedOrder.paymentMethod === 'CARD' ? 'Картой (Online)' : 'При получении'}
                                                </span>
                                                <h4 className="mt-2 fw-bold text-primary">{selectedOrder.totalAmount} BYN</h4>
                                            </div>
                                        </div>
                                    </div>

                                    <label className="text-muted small text-uppercase fw-bold mb-3">Состав заказа</label>
                                    <div className="list-group list-group-flush border rounded-3 overflow-hidden shadow-sm">
                                        {selectedOrder.items?.map((item, idx) => (
                                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center p-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '35px', height: '35px'}}>
                                                        <span className="small fw-bold">{idx + 1}</span>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{item.productName}</div>
                                                        <div className="text-muted small">
                                                            Размер: <span className="text-dark">{item.size}</span> | Цвет: <span className="text-dark">{item.color}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold">{item.quantity} шт.</div>
                                                    <div className="small text-primary fw-bold">{(item.quantity * item.priceAtSale).toFixed(2)} BYN</div>
                                                </div>
                                            </div>
                                        ))}
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