import React, { useState } from 'react';
import VariantManager from './VariantManager';

const WarehouseRow = ({ product, onEdit, onDelete, onRefresh, onReplenish }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const variants = product.variants || [];
    
    // Считаем общие остатки для верхней строки
    const totalStock = variants.reduce((sum, v) => sum + (v.stock?.quantity || 0), 0);
    const hasLowStock = variants.some(v => (v.stock?.quantity || 0) <= 5);

    return (
        <React.Fragment>
            {/* Основная строка товара */}
            <tr onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }} className={isExpanded ? 'table-active' : ''}>
               <td className="ps-4">
    <div className="d-flex gap-1 overflow-auto" style={{ maxWidth: '120px' }}>
        {product.images && product.images.length > 0 ? (
            product.images.map((img, idx) => (
                <img 
                    key={img.imageId}
                    src={`http://localhost:8080${img.imageUrl}`} 
                    alt="preview" 
                    className="rounded-2 shadow-sm" 
                    style={{ width: '40px', height: '40px', objectFit: 'cover', flexShrink: 0 }} 
                />
            ))
        ) : (
            <div className="bg-light rounded-2 text-muted d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-image" style={{ fontSize: '10px' }}></i>
            </div>
        )}
    </div>
</td>
                <td>
                    <div className="fw-bold">{product.name}</div>
                    <small className="text-muted">{product.brand}</small>
                </td>
                <td>{product.categories?.map(c => <span key={c.categoryId} className="badge bg-light text-dark border me-1">{c.name}</span>)}</td>
                <td className="fw-bold">{product.basePrice} BYN</td>
                <td>
                    <span className={hasLowStock ? 'text-danger fw-bold' : 'text-success'}>
                        {totalStock} шт. {hasLowStock && '⚠️'}
                    </span>
                </td>
                <td className="text-end pe-4">
                    <button className="btn btn-sm btn-light border me-2" onClick={(e) => { e.stopPropagation(); onEdit(product); }} title="Редактировать товар">✏️</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); onDelete(product.productId); }} title="Удалить товар">🗑️</button>
                </td>
            </tr>

            {/* Раскрывающаяся панель управления вариантами */}
            {isExpanded && (
                <tr>
                    <td colSpan="6" className="bg-light p-0 border-start border-end">
                        <div className="p-4 bg-white shadow-sm mx-3 my-3 rounded-4 border">
                            {/* Оставляем ОДИН полноценный менеджер вариантов */}
                            <VariantManager 
                                productId={product.productId} 
                                product={product}
                                variants={variants} 
                                onRefresh={onRefresh}
                                onReplenish={onReplenish} // ОБЯЗАТЕЛЬНО ПЕРЕДАЕМ СЮДА!
                            />
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

export default WarehouseRow;