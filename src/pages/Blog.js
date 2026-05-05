import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Blog = () => {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCat, setSelectedCat] = useState('all');

    // Базовый URL твоего бэкенда для картинок
    const IMAGE_BASE_URL = 'http://localhost:8080';

    useEffect(() => {
        // Запрашиваем данные через публичные эндпоинты
        axios.get('http://localhost:8080/api/articles').then(res => setArticles(res.data));
        
        // Категории тоже лучше сделать доступными по публичному пути /api/categories
        axios.get('http://localhost:8080/api/categories').then(res => 
            setCategories(res.data.filter(c => c.targetType === 'ARTICLE'))
        );
    }, []);

    const filtered = selectedCat === 'all' 
        ? articles 
        : articles.filter(a => a.category?.categoryId === selectedCat);

    return (
        <div className="container py-5">
            <h1 className="text-center mb-5 fw-bold">Блог и новости</h1>
            
            {/* Фильтр по категориям */}
            <div className="d-flex justify-content-center gap-2 mb-5 flex-wrap">
                <button 
                    className={`btn rounded-pill px-4 ${selectedCat === 'all' ? 'btn-dark' : 'btn-outline-dark'}`} 
                    onClick={() => setSelectedCat('all')}>Все</button>
                {categories.map(c => (
                    <button key={c.categoryId} 
                            className={`btn rounded-pill px-4 ${selectedCat === c.categoryId ? 'btn-dark' : 'btn-outline-dark'}`}
                            onClick={() => setSelectedCat(c.categoryId)}>{c.name}</button>
                ))}
            </div>

            <div className="row g-4">
                {filtered.map(art => (
                    <div key={art.articleId} className="col-md-6 col-lg-4">
                        <div className="card h-100 border-0 shadow-sm overflow-hidden rounded-4 hover-shadow transition">
                            {/* Добавлен IMAGE_BASE_URL для корректного пути к фото */}
                            {art.images && art.images[0] ? (
                                <img 
                                    src={`${IMAGE_BASE_URL}${art.images[0].imageUrl}`} 
                                    className="card-img-top" 
                                    alt="preview" 
                                    style={{height: '220px', objectFit: 'cover'}} 
                                />
                            ) : (
                                <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '220px'}}>
                                    <span className="text-muted">Нет изображения</span>
                                </div>
                            )}
                            
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <small className="text-primary fw-bold text-uppercase" style={{fontSize: '0.75rem'}}>
                                        {art.category?.name || 'Без категории'}
                                    </small>
                                    <small className="text-muted" style={{fontSize: '0.75rem'}}>
                                        {art.publicationDate ? new Date(art.publicationDate).toLocaleDateString() : ''}
                                    </small>
                                </div>
                                <h5 className="card-title fw-bold mb-3">{art.title}</h5>
                                <p className="card-text text-muted mb-4" style={{fontSize: '0.9rem'}}>
                                    {art.content.substring(0, 120)}...
                                </p>
                                <button className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold">
                                    Читать далее
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {filtered.length === 0 && (
                <div className="text-center mt-5">
                    <p className="text-muted">В этой категории пока нет статей.</p>
                </div>
            )}
        </div>
    );
};

export default Blog;