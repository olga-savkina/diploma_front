import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    // Добавили targetType в форму (по умолчанию PRODUCT)
    const [form, setForm] = useState({ name: '', description: '', parentId: "", targetType: "PRODUCT" }); 
    const [editId, setEditId] = useState(null);

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/admin/categories', { withCredentials: true });
            setCategories(res.data);
        } catch (error) {
            console.error("Ошибка загрузки:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form, parentId: form.parentId === "" ? null : form.parentId };
        
        try {
            if (editId) {
                await axios.put(`http://localhost:8080/api/admin/categories/${editId}`, payload, { withCredentials: true });
            } else {
                await axios.post('http://localhost:8080/api/admin/categories', payload, { withCredentials: true });
            }
            setForm({ name: '', description: '', parentId: "", targetType: "PRODUCT" });
            setEditId(null);
            fetchCategories();
        } catch (error) {
            alert("Ошибка при сохранении.");
        }
    };

    const startEdit = (cat) => {
        setEditId(cat.categoryId);
        setForm({ 
            name: cat.name, 
            description: cat.description || '', 
            parentId: cat.parentId || "",
            targetType: cat.targetType // Загружаем тип при редактировании
        });
    };

    return (
        <div className="p-4">
            <h3 className="mb-4">Управление категориями (Товары + Блог)</h3>
            
            <form onSubmit={handleSubmit} className="card p-3 mb-4 shadow-sm border-primary">
                <div className="row g-3">
                    <div className="col-md-2">
                        <label className="small text-muted">Тип назначения</label>
                        <select 
                            className="form-select border-primary"
                            value={form.targetType}
                            onChange={e => setForm({...form, targetType: e.target.value, parentId: ""})} // Сброс родителя при смене типа
                        >
                            <option value="PRODUCT">Товары</option>
                            <option value="ARTICLE">Блог</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label className="small text-muted">Название</label>
                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                               className="form-control" required />
                    </div>
                    <div className="col-md-3">
                        <label className="small text-muted">Родитель (только того же типа)</label>
                        <select 
                            className="form-select" 
                            value={form.parentId} 
                            onChange={e => setForm({...form, parentId: e.target.value})}
                        >
                            <option value="">Без родителя</option>
                            {categories
                                // ФИЛЬТР: только того же типа и не сам себя
                                .filter(c => c.targetType === form.targetType && c.categoryId !== editId)
                                .map(c => (
                                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="small text-muted">Описание</label>
                        <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} 
                               className="form-control" />
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                        <button type="submit" className="btn btn-primary w-100">
                            {editId ? "Обновить" : "Добавить"}
                        </button>
                    </div>
                </div>
            </form>

            <table className="table table-hover border">
                <thead className="table-dark">
                    <tr>
                        <th>Назначение</th>
                        <th>Название</th>
                        <th>Родитель</th>
                        <th>Описание</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => {
                        const parent = categories.find(c => c.categoryId === cat.parentId);
                        return (
                            <tr key={cat.categoryId}>
                                <td>
                                    <span className={`badge ${cat.targetType === 'PRODUCT' ? 'bg-primary' : 'bg-success'}`}>
                                        {cat.targetType === 'PRODUCT' ? 'Товар' : 'Блог'}
                                    </span>
                                </td>
                                <td className="fw-bold">{cat.name}</td>
                                <td>{parent ? <span className="badge bg-info text-dark">{parent.name}</span> : "—"}</td>
                                <td className="text-muted small">{cat.description}</td>
                                <td>
                                    <button onClick={() => startEdit(cat)} className="btn btn-sm btn-outline-warning me-2">⚙️</button>
                                    <button onClick={() => { if(window.confirm("Удалить?")) axios.delete(`http://localhost:8080/api/admin/categories/${cat.categoryId}`, {withCredentials: true}).then(fetchCategories) }} className="btn btn-sm btn-outline-danger">🗑️</button>
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