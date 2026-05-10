import React from 'react';

const ProductForm = ({ 
    product, 
    categories = [], 
    onSubmit, 
    onCancel, 
    onChange, 
    onCategoryChange, 
    onImageChange,
    onRemoveImage, // Добавьте этот пропс для удаления фото из массива
    loading 
}) => {
    
    return (
        <div className="card shadow-sm border-0 mb-4 rounded-4">
            <div className="card-header bg-white py-3 border-bottom">
                <h5 className="mb-0 fw-bold">
                    <i className={product.productId ? "bi bi-pencil-square me-2" : "bi bi-plus-circle me-2"}></i>
                    {product.productId ? 'Редактировать товар' : 'Добавить новый товар'}
                </h5>
            </div>
            <div className="card-body p-4">
                <form onSubmit={onSubmit}>
                    <div className="row">
{/* Левая колонка: Галерея изображений */}
<div className="col-md-5 border-end">
    <div className="mb-3">
        <label className="form-label small fw-bold text-secondary">Изображения товара</label>
        
        {/* Сетка предпросмотра нескольких фото */}
        <div className="border rounded-4 p-2 bg-light mb-2 d-flex flex-wrap gap-2 align-content-start" 
             style={{ minHeight: '220px', maxHeight: '400px', overflowY: 'auto' }}>
            
            {product.imagePreviews && product.imagePreviews.length > 0 ? (
                product.imagePreviews.map((src, index) => {
                    // НАЧАЛО ВСТАВКИ ЛОГИКИ
                    // Проверяем, есть ли у этой картинки ID в базе (для старых фото)
                    const existingImageId = product.existingImages && product.existingImages[index] 
                        ? product.existingImages[index].imageId 
                        : null;
                    // КОНЕЦ ВСТАВКИ ЛОГИКИ

                    return (
                        <div key={index} className="position-relative shadow-sm rounded-3 overflow-hidden" 
                             style={{ width: '100px', height: '100px' }}>
                            <img src={src} alt={`preview-${index}`} 
                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button 
                                type="button"
                                className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center"
                                style={{ width: '22px', height: '22px', borderRadius: '0 0 0 8px' }}
                                // ОБНОВЛЕННЫЙ ВЫЗОВ: передаем индекс и ID
                                onClick={() => onRemoveImage(index, existingImageId)}
                            >
                                <i className="bi bi-x"></i>
                            </button>
                        </div>
                    );
                })
            ) : (
                <div className="text-muted small w-100 h-100 d-flex flex-column align-items-center justify-content-center py-5">
                    <i className="bi bi-images fs-1 mb-2"></i>
                    <span>Выберите файлы для загрузки...</span>
                </div>
            )}
        </div>
        
        <input 
            type="file" 
            className="form-control form-control-sm rounded-pill" 
            onChange={onImageChange} 
            accept="image/*"
            multiple 
        />
        <div className="form-text small">Можно выбрать несколько изображений одновременно</div>
    </div>
</div>

                        {/* Правая колонка: Данные */}
                        <div className="col-md-7">
                            <div className="row g-3">
                                <div className="col-md-8">
                                    <label className="form-label small fw-bold text-secondary">Название товара</label>
                                    <input 
                                        type="text" 
                                        className="form-control border-2 shadow-none" 
                                        name="name" 
                                        value={product.name} 
                                        onChange={onChange} 
                                        required 
                                    />
                                </div>
                                
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold text-secondary">Бренд</label>
                                    <input 
                                        type="text" 
                                        className="form-control border-2 shadow-none" 
                                        name="brand" 
                                        value={product.brand} 
                                        onChange={onChange} 
                                    />
                                </div>

                                <div className="col-md-12">
                                    <label className="form-label small fw-bold text-secondary">Категории товаров</label>
                                    <div className="p-3 border-2 border rounded-4 bg-white" 
                                         style={{ maxHeight: '160px', overflowY: 'auto', borderStyle: 'dashed' }}>
                                        <div className="d-flex flex-wrap gap-2">
                                            {categories
                                                .filter(cat => cat.targetType === 'PRODUCT')
                                                .map(cat => (
                                                    <div key={cat.categoryId}>
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
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label small fw-bold text-secondary">Цена (BYN)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        className="form-control border-2 shadow-none" 
                                        name="basePrice" 
                                        value={product.basePrice} 
                                        onChange={onChange} 
                                        required 
                                    />
                                </div>

                                <div className="col-md-8">
                                    <label className="form-label small fw-bold text-secondary">Описание</label>
                                    <textarea 
                                        className="form-control border-2 shadow-none" 
                                        name="description" 
                                        rows="2" 
                                        value={product.description} 
                                        onChange={onChange}
                                    ></textarea>
                                </div>

                                <div className="col-md-12 d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                                    <button type="button" className="btn btn-outline-secondary px-4 rounded-pill border-2" onClick={onCancel}>
                                        Отмена
                                    </button>
                                    <button type="submit" className="btn btn-success px-5 rounded-pill shadow-sm fw-bold" disabled={loading}>
                                        {loading ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span>Сохранение...</>
                                        ) : (
                                            <><i className={product.productId ? "bi bi-check-all me-2" : "bi bi-check me-2"}></i>
                                            {product.productId ? 'Обновить товар' : 'Создать товар'}</>
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