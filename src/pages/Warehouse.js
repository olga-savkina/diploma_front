import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const QUICK_SIZES = ['56', '62', '68', '74', '80', '86', '92', '98', '104', '110', '116'];

// Словарь цветов для кружочков и списка выбора
const COLOR_OPTIONS = [
    { name: "Белый", hex: "#ffffff" },
    { name: "Черный", hex: "#000000" },
    { name: "Красный", hex: "#ff0000" },
    { name: "Синий", hex: "#0000ff" },
    { name: "Голубой", hex: "#87ceeb" },
    { name: "Зеленый", hex: "#008000" },
    { name: "Желтый", hex: "#ffff00" },
    { name: "Розовый", hex: "#ffc0cb" },
    { name: "Бежевый", hex: "#f5f5dc" },
    { name: "Серый", hex: "#808080" },
    { name: "Фиолетовый", hex: "#800080" },
    { name: "Оранжевый", hex: "#ffa500" }
];

const AdminWarehouse = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [variantForm, setVariantForm] = useState({ size: '', color: '', stockQuantity: 0 });
    const [selectedSizes, setSelectedSizes] = useState([]); 
    const [productVariants, setProductVariants] = useState({}); 

    const [product, setProduct] = useState({
        productId: null, name: '', brand: '', description: '', base_price: '', categoryIds: [], is_active: 1
    });
    
    const [images, setImages] = useState([]);
    const [additionalImages, setAdditionalImages] = useState({});

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Новые) ---
    
    // Определяем, нужна ли размерная сетка (Одежда/Обувь)
    const checkIfFashion = (productData) => {
        return productData.categories?.some(cat => 
            cat.name.toLowerCase().includes('одежда') || 
            cat.name.toLowerCase().includes('обувь')
        );
    };

    const getColorHex = (colorName) => {
        const found = COLOR_OPTIONS.find(c => c.name.toLowerCase() === colorName?.toLowerCase());
        return found ? found.hex : '#eeeeee';
    };

    // --- КОНЕЦ НОВЫХ ФУНКЦИЙ ---

    const fetchInitialData = useCallback(async () => {
        try {
            const [catRes, prodRes] = await Promise.all([
                axios.get('http://localhost:8080/api/admin/categories', { withCredentials: true }),
                axios.get('http://localhost:8080/api/admin/products', { withCredentials: true })
            ]);
            setCategories(catRes.data);
            setProducts(prodRes.data);
        } catch (err) {
            console.error("Ошибка загрузки данных", err);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const getCategoryPath = (cat) => {
        const parent = categories.find(c => c.categoryId === cat.parentId);
        return parent ? `${parent.name} > ${cat.name}` : cat.name;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });
    };

    const handleCategoryChange = (categoryId) => {
        const currentIds = [...product.categoryIds];
        const index = currentIds.indexOf(categoryId);
        if (index > -1) {
            currentIds.splice(index, 1);
        } else {
            currentIds.push(categoryId);
        }
        setProduct({ ...product, categoryIds: currentIds });
    };

    const handleAdditionalFileChange = (productId, files) => {
        setAdditionalImages(prev => ({ ...prev, [productId]: [...files] }));
    };

    const resetForm = () => {
        setShowForm(false);
        setProduct({ productId: null, name: '', brand: '', description: '', base_price: '', categoryIds: [], is_active: 1 });
        setImages([]);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Удалить этот товар?")) {
            try {
                await axios.delete(`http://localhost:8080/api/admin/products/${id}`, { withCredentials: true });
                fetchInitialData();
            } catch (err) {
                alert("Ошибка при удалении.");
            }
        }
    };

    const deleteImage = async (imageId, productId, e) => {
        e.stopPropagation();
        if (window.confirm("Удалить это фото?")) {
            try {
                await axios.delete(`http://localhost:8080/api/admin/products/${productId}/images/${imageId}`, { withCredentials: true });
                fetchInitialData();
            } catch (err) {
                alert("Ошибка при удалении фото");
            }
        }
    };

    const uploadAdditionalImages = async (productId) => {
        const files = additionalImages[productId];
        if (!files || files.length === 0) return;
        const formData = new FormData();
        files.forEach(file => formData.append("images", file));
        try {
            setLoading(true);
            await axios.post(`http://localhost:8080/api/admin/products/${productId}/images`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            alert("Фотографии добавлены!");
            setAdditionalImages(prev => ({ ...prev, [productId]: [] }));
            fetchInitialData();
        } catch (err) {
            alert("Ошибка при загрузке фото");
        } finally {
            setLoading(false);
        }
    };

    const fetchVariants = async (productId) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/admin/variants/product/${productId}`, { withCredentials: true });
            setProductVariants(prev => ({ ...prev, [productId]: res.data }));
        } catch (err) {
            console.error("Ошибка загрузки размеров", err);
        }
    };

    const toggleSizeSelection = (size) => {
        setSelectedSizes(prev => 
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const addMultipleVariants = async (productId) => {
        const targetProduct = products.find(p => p.productId === productId);
        const isFashion = checkIfFashion(targetProduct);
        
        const sizesToSave = [...selectedSizes];
        if (variantForm.size) sizesToSave.push(variantForm.size);

        // Если это одежда, размер обязателен. Если нет — можно без него.
        if (isFashion && sizesToSave.length === 0) {
            return alert("Для одежды или обуви обязательно выберите размер!");
        }
        
        if (variantForm.stockQuantity < 0) return alert("Введите корректное количество");

        // Если размеров нет (коляска), создаем одну запись
        const finalSizes = sizesToSave.length > 0 ? sizesToSave : [null];

        setLoading(true);
        try {
            const promises = finalSizes.map(size => {
                const newVariant = {
                    size: size,
                    color: variantForm.color,
                    stockQuantity: variantForm.stockQuantity,
                    sku: `SKU-${productId.toString().substring(0, 5)}-${size || 'NOSIZE'}-${Date.now()}`
                };
                return axios.post(`http://localhost:8080/api/admin/variants/product/${productId}`, newVariant, { withCredentials: true });
            });
            await Promise.all(promises);
            setSelectedSizes([]);
            setVariantForm({ ...variantForm, size: '', stockQuantity: 0 });
            fetchVariants(productId);
        } catch (err) {
            alert("Ошибка при добавлении");
        } finally {
            setLoading(false);
        }
    };

    const handleEditVariant = async (productId, variant) => {
        setVariantForm({
            size: variant.size || '',
            color: variant.color || '',
            stockQuantity: variant.stockQuantity
        });
        await axios.delete(`http://localhost:8080/api/admin/variants/${variant.variantId}`, { withCredentials: true });
        fetchVariants(productId);
    };

    const deleteVariant = async (productId, variantId) => {
        if (window.confirm("Удалить этот размер?")) {
            try {
                await axios.delete(`http://localhost:8080/api/admin/variants/${variantId}`, { withCredentials: true });
                fetchVariants(productId);
            } catch (err) {
                alert("Ошибка при удалении");
            }
        }
    };

    const toggleRow = (productId) => {
        if (expandedRow === productId) {
            setExpandedRow(null);
        } else {
            setExpandedRow(productId);
            fetchVariants(productId);
        }
    };

    const startEdit = (p, e) => {
        e.stopPropagation();
        setProduct({
            productId: p.productId,
            name: p.name,
            brand: p.brand || '',
            description: p.description || '',
            base_price: p.basePrice,
            categoryIds: p.categories ? p.categories.map(c => c.categoryId) : [],
            is_active: p.active ? 1 : 0
        });
        setShowForm(true);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (product.categoryIds.length === 0) return alert("Выберите категорию!");
        setLoading(true);
        const isEdit = !!product.productId;
        const productData = {
            name: product.name, brand: product.brand, description: product.description,
            basePrice: parseFloat(product.base_price),
            categories: product.categoryIds.map(id => ({ categoryId: id })),
            isActive: product.is_active === 1
        };
        try {
            if (isEdit) {
                await axios.put(`http://localhost:8080/api/admin/products/${product.productId}`, productData, { withCredentials: true });
            } else {
                const formData = new FormData();
                formData.append("product", new Blob([JSON.stringify(productData)], { type: "application/json" }));
                images.forEach(file => formData.append("images", file));
                await axios.post('http://localhost:8080/api/admin/products/add', formData, { 
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true 
                });
            }
            resetForm();
            fetchInitialData();
        } catch (error) {
            alert("Ошибка сохранения");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 w-100">
            <style>{`
                .color-circle { width: 14px; height: 14px; border-radius: 50%; display: inline-block; margin-right: 6px; border: 1px solid #ddd; vertical-align: middle; }
                .btn-xs { padding: 2px 6px; font-size: 10px; }
            `}</style>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Управление складом</h2>
                <button className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`} onClick={() => showForm ? resetForm() : setShowForm(true)}>
                    {showForm ? "Отмена" : "+ Добавить товар"}
                </button>
            </div>

            {/* Форма добавления/редактирования */}
            {showForm && (
                <div className="card shadow-sm p-4 border-0 mb-5 bg-light">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold">Название</label>
                                <input name="name" className="form-control" value={product.name} onChange={handleInputChange} required />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label fw-bold">Бренд</label>
                                <input name="brand" className="form-control" value={product.brand} onChange={handleInputChange} />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label fw-bold">Цена (BYN)</label>
                                <input name="base_price" type="number" step="0.01" className="form-control" value={product.base_price} onChange={handleInputChange} required />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold">Категории</label>
                                <div className="border rounded bg-white p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {categories.map(cat => (
                                        <div key={cat.categoryId} className="form-check small">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                checked={product.categoryIds.includes(cat.categoryId)}
                                                onChange={() => handleCategoryChange(cat.categoryId)}
                                            />
                                            <label className="form-check-label">{getCategoryPath(cat)}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label fw-bold">Статус</label>
                                <select name="is_active" className="form-select" value={product.is_active} onChange={handleInputChange}>
                                    <option value={1}>В продаже</option>
                                    <option value={0}>Скрыт</option>
                                </select>
                            </div>
                            {!product.productId && (
                                <div className="col-md-3 mb-3">
                                    <label className="form-label fw-bold">Картинки</label>
                                    <input type="file" className="form-control" multiple onChange={(e) => setImages([...e.target.files])} accept="image/*" />
                                </div>
                            )}
                            <div className="col-12 mb-3">
                                <label className="form-label fw-bold">Описание</label>
                                <textarea name="description" rows="3" className="form-control" value={product.description} onChange={handleInputChange}></textarea>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success px-4" disabled={loading}>
                            {loading ? "Загрузка..." : "Сохранить товар"}
                        </button>
                    </form>
                </div>
            )}

            <div className="card shadow-sm border-0">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-dark">
                        <tr>
                            <th>Товар</th>
                            <th>Название / Бренд</th>
                            <th>Категории</th>
                            <th>Цена</th>
                            <th>Статус</th>
                            <th className="text-end px-4">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <React.Fragment key={p.productId}>
                                <tr onClick={() => toggleRow(p.productId)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        {p.images && p.images.length > 0 ? (
                                            <img src={`http://localhost:8080${p.images[0].imageUrl}`} alt="p" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '5px' }} />
                                        ) : <div className="bg-light p-2 text-center rounded" style={{ width: '45px' }}>📦</div>}
                                    </td>
                                    <td><strong>{p.name}</strong><br/><small className="text-muted">{p.brand || "—"}</small></td>
                                    <td>{p.categories?.map(c => <span key={c.categoryId} className="badge bg-light text-dark border me-1 small">{c.name}</span>)}</td>
                                    <td>{p.basePrice} BYN</td>
                                    <td><span className={`badge ${p.active ? 'bg-success' : 'bg-danger'}`}>{p.active ? 'Активен' : 'Скрыт'}</span></td>
                                    <td className="text-end px-3">
                                        <button className="btn btn-sm btn-outline-warning me-2" onClick={(e) => startEdit(p, e)}>⚙️</button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={(e) => handleDelete(p.productId, e)}>🗑️</button>
                                    </td>
                                </tr>
                                
                                {expandedRow === p.productId && (
                                    <tr className="table-light">
                                        <td colSpan="6">
                                            <div className="p-3 bg-white border rounded mx-2 my-2 shadow-sm">
                                                <div className="row">
                                                    {/* Фотографии */}
                                                    <div className="col-md-5 border-end">
                                                        <h6 className="fw-bold mb-3">Фотографии ({p.images?.length || 0})</h6>
                                                        <div className="d-flex gap-2 flex-wrap mb-3">
                                                            {p.images?.map(img => (
                                                                <div key={img.imageId} className="position-relative" style={{ width: '80px', height: '80px' }}>
                                                                    <img src={`http://localhost:8080${img.imageUrl}`} alt="f" className="rounded border w-100 h-100" style={{ objectFit: 'cover' }} />
                                                                    <button className="btn btn-danger btn-sm position-absolute" style={{ top: '-5px', right: '-5px', borderRadius: '50%', padding: '0 5px' }} onClick={(e) => deleteImage(img.imageId, p.productId, e)}>&times;</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="bg-light p-2 rounded">
                                                            <input type="file" multiple className="form-control form-control-sm mb-2" onChange={(e) => handleAdditionalFileChange(p.productId, e.target.files)} />
                                                            <button className="btn btn-sm btn-primary w-100" onClick={() => uploadAdditionalImages(p.productId)} disabled={loading}>Загрузить фото</button>
                                                        </div>
                                                    </div>

                                                    {/* Размеры и Склад */}
                                                    <div className="col-md-7">
                                                        <h6 className="fw-bold mb-2">Размеры и Склад</h6>
                                                        
                                                        {/* Быстрые размеры показываем только для Одежды/Обуви */}
                                                        {checkIfFashion(p) && (
                                                            <div className="mb-2">
                                                                <small className="text-muted d-block mb-1">Выберите размеры:</small>
                                                                <div className="d-flex flex-wrap gap-1">
                                                                    {QUICK_SIZES.map(qs => (
                                                                        <button 
                                                                            key={qs} 
                                                                            type="button"
                                                                            className={`btn btn-xs border ${selectedSizes.includes(qs) ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                            style={{fontSize: '11px', padding: '4px 8px'}}
                                                                            onClick={() => toggleSizeSelection(qs)}
                                                                        >
                                                                            {qs}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="row g-1 mb-3 align-items-end p-2 bg-light rounded border">
                                                            <div className="col-3">
                                                                <label className="small fw-bold">Свой разм.</label>
                                                                <input type="text" className="form-control form-control-sm shadow-none" value={variantForm.size} onChange={(e) => setVariantForm({...variantForm, size: e.target.value})} placeholder="напр. XL" />
                                                            </div>
                                                            <div className="col-4">
                                                                <label className="small fw-bold">Цвет</label>
                                                                <select 
                                                                    className="form-select form-select-sm shadow-none" 
                                                                    value={variantForm.color} 
                                                                    onChange={(e) => setVariantForm({...variantForm, color: e.target.value})}
                                                                >
                                                                    <option value="">Без цвета</option>
                                                                    {COLOR_OPTIONS.map(c => (
                                                                        <option key={c.name} value={c.name}>{c.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="col-3">
                                                                <label className="small fw-bold">Кол-во</label>
                                                                <input type="number" className="form-control form-control-sm shadow-none" value={variantForm.stockQuantity} onChange={(e) => setVariantForm({...variantForm, stockQuantity: parseInt(e.target.value) || 0})} />
                                                            </div>
                                                            <div className="col-2">
                                                                <button className="btn btn-sm btn-success w-100" onClick={() => addMultipleVariants(p.productId)}>
                                                                    OK
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Таблица вариантов */}
                                                        <table className="table table-sm table-bordered small">
                                                            <thead>
                                                                <tr className="table-secondary">
                                                                    <th>Размер</th>
                                                                    <th>Цвет</th>
                                                                    <th>Склад</th>
                                                                    <th className="text-center">Действия</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {productVariants[p.productId]?.map(v => (
                                                                    <tr key={v.variantId}>
                                                                        <td>{v.size || '—'}</td>
                                                                        <td>
                                                                            {v.color ? (
                                                                                <>
                                                                                    <span className="color-circle" style={{ backgroundColor: getColorHex(v.color) }}></span>
                                                                                    {v.color}
                                                                                </>
                                                                            ) : '—'}
                                                                        </td>
                                                                        <td>{v.stockQuantity} шт.</td>
                                                                        <td className="text-center">
                                                                            <button className="btn btn-sm text-warning p-0 me-2" onClick={() => handleEditVariant(p.productId, v)}>✏️</button>
                                                                            <button className="btn btn-sm text-danger p-0" onClick={() => deleteVariant(p.productId, v.variantId)}>🗑️</button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminWarehouse;