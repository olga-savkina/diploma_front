import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ name: '', description: '', parentId: "" }); // Изменил null на "" для работы со select
    const [editId, setEditId] = useState(null);

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/admin/categories', { withCredentials: true });
            setCategories(res.data);
        } catch (error) {
            console.error("Ошибка загрузки:", error);
            alert("Не удалось загрузить категории. Проверьте консоль бэкенда.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Если parentId пустой, отправляем null, чтобы БД не ругалась на пустую строку
        const payload = { ...form, parentId: form.parentId === "" ? null : form.parentId };
        
        try {
            if (editId) {
                await axios.put(`http://localhost:8080/api/admin/categories/${editId}`, payload, { withCredentials: true });
            } else {
                await axios.post('http://localhost:8080/api/admin/categories', payload, { withCredentials: true });
            }
            setForm({ name: '', description: '', parentId: "" });
            setEditId(null);
            fetchCategories();
        } catch (error) {
            alert("Ошибка при сохранении. Возможно, этот ID уже занят или нарушена структура.");
        }
    };

    const deleteCategory = async (id) => {
        if (window.confirm("Удалить категорию? Учтите, что товары просто отвяжутся от неё.")) {
            await axios.delete(`http://localhost:8080/api/admin/categories/${id}`, { withCredentials: true });
            fetchCategories();
        }
    };

    const startEdit = (cat) => {
        setEditId(cat.categoryId);
        setForm({ 
            name: cat.name, 
            description: cat.description || '', 
            parentId: cat.parentId || "" 
        });
    };

    return (
        <div className="p-4">
            <h3 className="mb-4">Управление иерархией категорий</h3>
            
            <form onSubmit={handleSubmit} className="card p-3 mb-4 shadow-sm">
                <div className="row g-3">
                    <div className="col-md-3">
                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                               placeholder="Название" className="form-control" required />
                    </div>
                    <div className="col-md-4">
                        <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} 
                               placeholder="Описание" className="form-control" />
                    </div>
                    <div className="col-md-3">
                        {/* Выбор родительской категории */}
                        <select 
                            className="form-select" 
                            value={form.parentId} 
                            onChange={e => setForm({...form, parentId: e.target.value})}
                        >
                            <option value="">Без родителя (Корневая)</option>
                            {categories
                                .filter(c => c.categoryId !== editId) // Чтобы нельзя было назначить родителем самого себя
                                .map(c => (
                                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div className="col-md-2">
                        <button type="submit" className="btn btn-primary w-100">
                            {editId ? "Обновить" : "Добавить"}
                        </button>
                    </div>
                </div>
            </form>

            <table className="table table-hover border shadow-sm">
                <thead className="table-dark">
                    <tr>
                        <th>Название</th>
                        <th>Родительская категория</th>
                        <th>Описание</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => {
                        const parent = categories.find(c => c.categoryId === cat.parentId);
                        return (
                            <tr key={cat.categoryId}>
                                <td className="fw-bold">{cat.name}</td>
                                <td>{parent ? <span className="badge bg-info">{parent.name}</span> : "—"}</td>
                                <td className="text-muted">{cat.description}</td>
                                <td>
                                    <button onClick={() => startEdit(cat)} className="btn btn-sm btn-outline-warning me-2">⚙️</button>
                                    <button onClick={() => deleteCategory(cat.categoryId)} className="btn btn-sm btn-outline-danger">🗑️</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AdminCategories;