import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/admin/users', { withCredentials: true });
            setUsers(res.data);
        } catch (err) {
            console.error("Ошибка при загрузке пользователей", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (!userId) return;
        try {
            await axios.put(`http://localhost:8080/api/admin/users/${userId}/role`, 
                { role: newRole }, 
                { withCredentials: true }
            );
            setUsers(users.map(u => u.userId === userId ? { ...u, role: newRole } : u));
            alert("Роль успешно изменена");
        } catch (err) {
            alert("Ошибка при смене роли: " + (err.response?.data || "Неизвестная ошибка"));
        }
    };

    // --- НОВАЯ ФУНКЦИЯ УДАЛЕНИЯ ---
    const handleDeleteUser = async (userId, email) => {
        if (!window.confirm(`Вы уверены, что хотите удалить пользователя ${email}? Это действие необратимо.`)) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8080/api/admin/users/${userId}`, { withCredentials: true });
            
            // Удаляем пользователя из локального стейта после успешного ответа сервера
            setUsers(users.filter(u => u.userId !== userId));
            alert("Пользователь удален");
        } catch (err) {
            console.error("Ошибка при удалении:", err.response?.data);
            alert("Не удалось удалить пользователя: " + (err.response?.data || "Ошибка сервера"));
        }
    };

    if (loading) return <div className="p-5 text-center">Загрузка...</div>;

    return (
        <div className="p-4 w-100">
            <h3 className="mb-4 text-pink">Управление пользователями</h3>
            <div className="card shadow-sm border-0">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>Email</th>
                            <th>Имя клиента</th>
                            <th>Дата регистрации</th>
                            <th>Роль</th>
                            <th className="text-center">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(users) && users.map(user => (
                            <tr key={user.userId}> 
                                <td>{user.email}</td>
                                <td>
                                    {user.client 
                                        ? `${user.client.firstName} ${user.client.lastName}` 
                                        : <span className="text-muted">Профиль не заполнен</span>}
                                </td>
                                <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
                                <td>
                                    <span className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex gap-2 justify-content-center">
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                                            style={{ width: '110px' }}
                                        >
                                            <option value="CLIENT">CLIENT</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                        
                                        {/* КНОПКА УДАЛЕНИЯ */}
                                        <button 
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => handleDeleteUser(user.userId, user.email)}
                                            title="Удалить пользователя"
                                        >
                                            <i className="bi bi-trash"></i> Удалить
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;