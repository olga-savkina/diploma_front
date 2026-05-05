import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminArticles = () => {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ title: '', content: '', categoryId: '' });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [editId, setEditId] = useState(null);

    const API_BASE = 'http://localhost:8080/api/admin';

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [artRes, catRes] = await Promise.all([
                axios.get(`${API_BASE}/articles`, { withCredentials: true }),
                axios.get(`${API_BASE}/categories`, { withCredentials: true })
            ]);
            setArticles(artRes.data);
            setCategories(catRes.data.filter(c => c.targetType === 'ARTICLE'));
        } catch (e) { console.error("Ошибка загрузки", e); }
    };

    // Переход в режим редактирования
    const startEdit = (art) => {
        setEditId(art.articleId);
        setForm({
            title: art.title,
            content: art.content,
            categoryId: art.category?.categoryId || ''
        });
        window.scrollTo(0, 0);
    };

    const cancelEdit = () => {
        setEditId(null);
        setForm({ title: '', content: '', categoryId: '' });
        setSelectedFiles([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editId) {
                // 1. Обновляем только текст (PUT с JSON)
                await axios.put(`${API_BASE}/articles/${editId}`, {
                    title: form.title,
                    content: form.content,
                    category: { categoryId: form.categoryId }
                }, { withCredentials: true });

                // 2. Если выбраны новые файлы, дозагружаем их (POST Multipart)
                if (selectedFiles.length > 0) {
                    const imgData = new FormData();
                    selectedFiles.forEach(file => imgData.append('images', file));
                    await axios.post(`${API_BASE}/articles/${editId}/images`, imgData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        withCredentials: true
                    });
                }
            } else {
                // СОЗДАНИЕ (как и раньше — FormData с JSON-блобом)
                const formData = new FormData();
                formData.append('article', new Blob([JSON.stringify({
                    title: form.title,
                    content: form.content,
                    category: { categoryId: form.categoryId }
                })], { type: 'application/json' }));
                selectedFiles.forEach(file => formData.append('images', file));

                await axios.post(`${API_BASE}/articles`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                });
            }
            cancelEdit();
            loadData();
        } catch (e) { alert("Ошибка при сохранении"); }
    };

    const deleteImage = async (articleId, imageId) => {
        if (window.confirm("Удалить это изображение?")) {
            await axios.delete(`${API_BASE}/articles/${articleId}/images/${imageId}`, { withCredentials: true });
            loadData();
        }
    };

    return (
        <div className="container p-4">
            <h2 className="mb-4">{editId ? "⚙️ Редактирование" : "✍️ Написать статью"}</h2>
            
            <form onSubmit={handleSubmit} className="card p-4 shadow-sm mb-5 border-0">
                <div className="row">
                    <div className="col-md-8">
                        <input className="form-control mb-3" placeholder="Заголовок статьи" value={form.title}
                               onChange={e => setForm({...form, title: e.target.value})} required />
                        
                        <select className="form-select mb-3" value={form.categoryId}
                                onChange={e => setForm({...form, categoryId: e.target.value})} required>
                            <option value="">Выберите категорию</option>
                            {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                        </select>

                        <textarea className="form-control mb-3" rows="10" placeholder="Текст..." value={form.content}
                                  onChange={e => setForm({...form, content: e.target.value})} required />
                    </div>

                    <div className="col-md-4">
                        <div className="bg-light p-3 rounded">
                            <h6>{editId ? "Добавить фото" : "Загрузить фото"}</h6>
                            <input type="file" className="form-control mb-3" multiple onChange={e => setSelectedFiles([...e.target.files])} />
                            
                            {editId && (
                                <div className="mt-3">
                                    <p className="small text-muted text-uppercase">Текущие фото:</p>
                                    <div className="d-flex flex-wrap gap-2">
                                        {articles.find(a => a.articleId === editId)?.images.map(img => (
                                            <div key={img.imageId} className="position-relative">
                                                <img src={`http://localhost:8080${img.imageUrl}`} width="60" height="60" 
                                                     className="rounded object-fit-cover" alt="prev" />
                                                <button type="button" onClick={() => deleteImage(editId, img.imageId)}
                                                        className="btn btn-danger btn-sm position-absolute top-0 start-100 translate-middle rounded-circle"
                                                        style={{padding: '0px 5px'}}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <button type="submit" className="btn btn-success px-5 me-2">{editId ? "Сохранить" : "Опубликовать"}</button>
                    {editId && <button type="button" className="btn btn-light" onClick={cancelEdit}>Отмена</button>}
                </div>
            </form>

            <div className="table-responsive">
                <table className="table align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>Превью</th>
                            <th>Заголовок</th>
                            <th>Категория</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.map(art => (
                            <tr key={art.articleId}>
                                <td>
                                    {art.images[0] && <img src={`http://localhost:8080${art.images[0].imageUrl}`} 
                                                           width="50" height="50" className="rounded" alt="img" />}
                                </td>
                                <td className="fw-bold">{art.title}</td>
                                <td><span className="badge bg-secondary">{art.category?.name}</span></td>
                                <td>
                                    <button onClick={() => startEdit(art)} className="btn btn-sm btn-outline-primary me-2">Править</button>
                                    <button onClick={() => { if(window.confirm("Удалить статью?")) axios.delete(`${API_BASE}/articles/${art.articleId}`, {withCredentials:true}).then(loadData) }} 
                                            className="btn btn-sm btn-outline-danger">Удалить</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminArticles;