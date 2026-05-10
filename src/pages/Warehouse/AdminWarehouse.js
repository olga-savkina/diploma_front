import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ProductForm from './ProductForm';
import WarehouseRow from './WarehouseRow';

const AdminWarehouse = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '', brand: '', basePrice: '', description: '',
        categoryIds: [], imageFile: null, imagePreview: null
    });

const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
        const config = { withCredentials: true };
        // Делаем три запроса
        const [prodRes, warehouseRes, catRes] = await Promise.all([
            axios.get('http://localhost:8080/api/admin/products', config),
            axios.get('http://localhost:8080/api/admin/warehouse', config),
            axios.get('http://localhost:8080/api/admin/categories', config)
        ]);
        
        console.log("Категории с сервера:", catRes.data); // Для отладки
        
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        // Теперь catRes.data — это действительно массив категорий
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        
    } catch (err) {
        console.error("Ошибка при загрузке данных:", err);
        setProducts([]);
        setCategories([]);
    } finally {
        setLoading(false);
    }
}, []);
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

const handleReplenish = async (variantId, amount, expiryDate) => {
    try {
        const config = { withCredentials: true };
        
        // Исправленный объект: проверяем типы данных
        const replenishData = {
            amount: Number(amount), // Убеждаемся, что это число
            expiryDate: expiryDate  // Должна быть строка в формате "YYYY-MM-DD"
        };

        console.log("Отправка данных на склад:", replenishData);

        await axios.put(
            `http://localhost:8080/api/admin/warehouse/replenish/${variantId}`, 
            replenishData, 
            config
        );
        
        fetchInitialData(); 
    } catch (err) {
        console.error("Replenish error:", err);
        // Выводим более подробную ошибку из ответа сервера
        const serverMessage = err.response?.data?.message || "Ошибка 400: Неверный формат данных";
        alert(serverMessage);
    }
};

    const resetForm = () => {
        setFormData({ name: '', brand: '', basePrice: '', description: '', categoryIds: [], imageFile: null, imagePreview: null });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (catId) => {
        setFormData(prev => {
            let newIds = [...prev.categoryIds];
            if (newIds.includes(catId)) {
                newIds = newIds.filter(id => id !== catId);
            } else {
                newIds.push(catId);
                const currentCat = categories.find(c => c.categoryId === catId);
                if (currentCat?.parentId && !newIds.includes(currentCat.parentId)) {
                    newIds.push(currentCat.parentId);
                }
            }
            return { ...prev, categoryIds: newIds };
        });
    };

const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Создаем превью для отображения в форме
    const newPreviews = files.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
        ...prev,
        // Добавляем новые файлы к уже выбранным (если хочешь накопление)
        // Либо просто заменяем: images: files
        images: [...(prev.images || []), ...files],
        imagePreviews: [...(prev.imagePreviews || []), ...newPreviews]
    }));
};

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверка категорий через formData
    if (!formData.categoryIds || formData.categoryIds.length === 0) {
        return alert("Выберите хотя бы одну категорию!");
    }
    
    setLoading(true);

    const isEdit = !!formData.productId;
    const data = new FormData();
   // Переименовал в data, чтобы не путать с formData из state

    // 1. Формируем JSON данные продукта из formData
    const productData = {
        productId: formData.productId || null,
        name: formData.name,
        brand: formData.brand,
        description: formData.description,
        basePrice: parseFloat(formData.basePrice),
        // Преобразуем массив ID в объекты для бэкенда
        categories: formData.categoryIds.map(id => ({ categoryId: id })),
        isActive: true
    };

    // 2. Упаковываем JSON в Blob для корректной работы @RequestPart
    data.append("product", new Blob([JSON.stringify(productData)], { 
        type: "application/json" 
    }));

    // 3. Добавляем изображения из formData.images (массив файлов)
    if (formData.images && formData.images.length > 0) {
        formData.images.forEach(file => {
            data.append("images", file);
        });
    } else {
        // Отправляем пустой блоб, если картинок нет, чтобы не было ошибки 400
        data.append("images", new Blob([], { type: "image/jpeg" }), "");
    }

    try {
        const url = isEdit 
            ? `http://localhost:8080/api/admin/products/${formData.productId}`
            : 'http://localhost:8080/api/admin/products/add';
        
        const method = isEdit ? 'put' : 'post';
        
        await axios({
            method: method,
            url: url,
            data: data,
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        setShowForm(false);
        resetForm();
        fetchInitialData();
        alert(isEdit ? "Товар успешно обновлен" : "Товар успешно добавлен");
    } catch (error) {
        console.error("Ошибка сохранения:", error.response?.data || error.message);
        alert("Ошибка сохранения: " + (error.response?.data || "Проверьте консоль"));
    } finally {
        setLoading(false);
    }
};

// Добавьте эту функцию внутрь компонента AdminWarehouse
const handleRemoveImage = async (index, imageId = null) => {
    // 1. Если есть imageId, значит картинка уже в базе данных
    if (imageId) {
        if (!window.confirm("Удалить это фото навсегда?")) return;
        
        try {
            await axios.delete(`http://localhost:8080/api/admin/products/${formData.productId}/images/${imageId}`, {
                withCredentials: true
            });
            alert("Фото удалено из базы");
        } catch (error) {
            console.error("Ошибка при удалении фото с сервера:", error);
            alert("Не удалось удалить фото на сервере");
            return; // Прерываем, чтобы фото не исчезло из интерфейса, если сервер выдал ошибку
        }
    }

    // 2. В любом случае обновляем интерфейс (удаляем из стейта)
    setFormData(prev => ({
        ...prev,
        // Фильтруем файлы
        images: prev.images ? prev.images.filter((_, i) => i !== index) : [],
        // Фильтруем превью
        imagePreviews: prev.imagePreviews ? prev.imagePreviews.filter((_, i) => i !== index) : [],
        // Если у вас в объекте продукта хранятся оригинальные объекты картинок, их тоже фильтруем
        originalImages: prev.originalImages ? prev.originalImages.filter((_, i) => i !== index) : []
    }));
};

// Обнови функцию startEdit в AdminWarehouse.js
const startEdit = (p) => {
    // Собираем массив URL всех существующих картинок товара
    //const existingPreviews = p.images ? p.images.map(img => `http://localhost:8080${img.imageUrl}`) : [];

    setFormData({
        productId: p.productId,
        name: p.name,
        brand: p.brand || '',
        basePrice: p.basePrice,
        description: p.description || '',
        categoryIds: p.categories.map(c => c.categoryId),
        // Сохраняем объекты целиком, чтобы получить imageId
        existingImages: p.images || [], 
        imagePreviews: p.images ? p.images.map(img => `http://localhost:8080${img.imageUrl}`) : [],
        images: [] 
    });
    setShowForm(true);
};

    const handleDelete = async (id) => {
        if (window.confirm("Вы уверены?")) {
            try {
                await axios.delete(`http://localhost:8080/api/admin/products/${id}`, { withCredentials: true });
                fetchInitialData();
            } catch (err) {
                alert("Ошибка при удалении");
            }
        }
    };

    return (
        <div className="container-fluid p-4 bg-light min-vh-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold m-0 text-dark">Складской учет BabyBoom</h2>
                    <p className="text-muted small mb-0">Управление через таблицу WarehouseStock</p>
                </div>
                <button 
                    className={`btn ${showForm ? 'btn-outline-secondary' : 'btn-primary'} rounded-pill px-4 shadow-sm`}
                    onClick={() => { if (showForm) resetForm(); setShowForm(!showForm); }}
                >
                    {showForm ? 'Закрыть' : '＋ Добавить товар'}
                </button>
            </div>

            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                        <small className="text-muted text-uppercase fw-bold">Товаров в базе</small>
                        <h4 className="fw-bold mb-0">{products.length}</h4>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                        <small className="text-danger text-uppercase fw-bold">Критический остаток</small>
                        <h4 className="fw-bold text-danger mb-0">
                            {/* ТУТ ПОМЕНЯЛИ: теперь лезем в v.stock?.quantity */}
                            {products?.filter(p => p.variants?.some(v => (v.stock?.quantity || 0) <= 5)).length}
                        </h4>
                    </div>
                </div>
            </div>

            {showForm && (
               <ProductForm 
                    product={formData} 
                    categories={categories} 
                    loading={loading}
                    onChange={handleInputChange} 
                    onCategoryChange={handleCategoryChange}
                    onImageChange={handleImageChange} 
                    onRemoveImage={handleRemoveImage} // ПЕРЕДАЕМ ФУНКЦИЮ УДАЛЕНИЯ
                    onSubmit={handleSubmit}
                    onCancel={() => { setShowForm(false); resetForm(); }}
                />
            )}

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-white border-bottom">
                            <tr className="text-muted small text-uppercase">
                                <th className="ps-4">Превью</th>
                                <th>Наименование</th>
                                <th>Категории</th>
                                <th>Базовая цена</th>
                                <th>Запасы (Всего)</th>
                                <th className="text-end pe-4">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <WarehouseRow 
                                    key={p.productId} product={p} 
                                    onEdit={startEdit} onDelete={handleDelete} 
                                    onRefresh={fetchInitialData}
                                    onReplenish={handleReplenish}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminWarehouse;