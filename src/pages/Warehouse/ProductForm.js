import React from 'react';

const ProductForm = ({ 
    product, 
    categories = [], // Добавили значение по умолчанию, чтобы не было ошибки .filter
    onSubmit, 
    onCancel, 
    onChange, 
    onCategoryChange, 
    onImageChange,
    loading 
}) => {
    
    // ОТЛАДКА: Посмотри в консоль браузера (F12 -> Console)
    console.log("Все категории из API:", categories);
    const filteredCats = categories.filter(cat => cat.targetType === 'PRODUCT');
    console.log("Категории после фильтрации (PRODUCT):", filteredCats);
    
    return (
        <div className="card shadow-sm border-0 mb-4 rounded-4">
            <div className="card-header bg-white py-3 border-bottom">
                <h5 className="mb-0 fw-bold">
                    {product.productId ? '📝 Редактировать товар' : '✨ Добавить новый товар'}
                </h5>
            </div>
            <div className="card-body p-4">
                <form onSubmit={onSubmit}>
                    <div className="row">
                        {/* Левая колонка: Фото */}
                        <div className="col-md-4 border-end">
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-secondary">Главное изображение</label>
                                <div className="border rounded-4 p-3 text-center bg-light mb-2 d-flex align-items-center justify-content-center" 
                                     style={{ minHeight: '220px' }}>
                                    {product.imagePreview ? (
                                        <img src={product.imagePreview} alt="preview" className="img-fluid rounded-3 shadow-sm" style={{ maxHeight: '190px' }} />
                                    ) : (
                                        <div className="text-muted small">
                                            <i className="bi bi-image d-block fs-2 mb-2"></i>
                                            Выберите файл для загрузки...
                                        </div>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    className="form-control form-control-sm rounded-pill" 
                                    onChange={onImageChange} 
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        {/* Правая колонка: Данные */}
                        <div className="col-md-8">
                            <div className="row g-3">
                                {/* Название */}
                                <div className="col-md-8">
                                    <label className="form-label small fw-bold text-secondary">Название товара</label>
                                    <input 
                                        type="text" 
                                        className="form-control border-2 shadow-none" 
                                        name="name" 
                                        placeholder="Напр: Крем под подгузник"
                                        value={product.name} 
                                        onChange={onChange} 
                                        required 
                                    />
                                </div>
                                
                                {/* Бренд */}
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold text-secondary">Бренд</label>
                                    <input 
                                        type="text" 
                                        className="form-control border-2 shadow-none" 
                                        name="brand" 
                                        placeholder="Напр: Bubchen"
                                        value={product.brand} 
                                        onChange={onChange} 
                                    />
                                </div>

                                {/* КАТЕГОРИИ (С фильтрацией targetType) */}
                                <div className="col-md-12">
                                    <label className="form-label small fw-bold text-secondary">
                                        Категории товаров <span className="text-muted fw-normal">(выберите подходящие)</span>
                                    </label>
                                    <div className="p-3 border-2 border rounded-4 bg-white" 
                                         style={{ maxHeight: '160px', overflowY: 'auto', borderStyle: 'dashed' }}>
                                        <div className="d-flex flex-wrap gap-2">
                                            {categories && categories
                                                .filter(cat => cat.targetType === 'PRODUCT') // Оставляем только товарные категории
                                                .map(cat => (
                                                    <div key={cat.categoryId} className="category-chip">
                                                        <input 
                                                            className="btn-check" 
                                                            type="checkbox" 
                                                            id={`cat-${cat.categoryId}`}
                                                            checked={product.categoryIds?.includes(cat.categoryId)}
                                                            onChange={() => onCategoryChange(cat.categoryId)}
                                                        />
                                                        <label className="btn btn-outline-primary btn-sm rounded-pill px-3" htmlFor={`cat-${cat.categoryId}`}>
                                                            {cat.name}
                                                        </label>
                                                    </div>
                                                ))
                                            }
                                            {categories.filter(c => c.targetType === 'PRODUCT').length === 0 && (
                                                <div className="text-muted small w-100 text-center py-2">Загрузка категорий...</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Цена */}
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold text-secondary">Базовая цена (BYN)</label>
                                    <div className="input-group">
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="form-control border-2 shadow-none" 
                                            name="basePrice" 
                                            value={product.basePrice} 
                                            onChange={onChange} 
                                            required 
                                        />
                                        <span className="input-group-text border-2">BYN</span>
                                    </div>
                                </div>

                                {/* Описание */}
                                <div className="col-md-8">
                                    <label className="form-label small fw-bold text-secondary">Краткое описание</label>
                                    <textarea 
                                        className="form-control border-2 shadow-none" 
                                        name="description" 
                                        rows="2" 
                                        placeholder="Опишите основные преимущества товара..."
                                        value={product.description} 
                                        onChange={onChange}
                                    ></textarea>
                                </div>

                                {/* Кнопки управления */}
                                <div className="col-md-12 d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary px-4 rounded-pill border-2" 
                                        onClick={onCancel}
                                    >
                                        Отмена
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-success px-5 rounded-pill shadow-sm fw-bold"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span>Сохранение...</>
                                        ) : (
                                            product.productId ? '💾 Обновить товар' : '✨ Создать товар'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;