import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const colorMap = {
    "белый": "#ffffff", "черный": "#000000", "красный": "#ff0000",
    "синий": "#0000ff", "голубой": "#87ceeb", "зеленый": "#008000",
    "желтый": "#ffff00", "розовый": "#ffc0cb", "бежевый": "#f5f5dc",
    "серый": "#808080", "фиолетовый": "#800080", "оранжевый": "#ffa500"
};

const Catalog = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
    const [ageRange, setAgeRange] = useState({ min: 0, max: 120 }); 
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCatIds, setSelectedCatIds] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);
    const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState(0);
    const [minRating, setMinRating] = useState(0); 

    const [openSections, setOpenSections] = useState({ cat: true, brand: true, size: true, color: true, rating: true });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/products'),
                    axios.get('http://localhost:8080/api/products/categories')
                ]);
                
                const allProducts = pRes.data;

                // Получаем рейтинги параллельно для всех товаров
                const productsWithRating = await Promise.all(allProducts.map(async (p) => {
                    try {
                        const rRes = await axios.get(`http://localhost:8080/api/reviews/${p.productId}`);
                        const reviews = rRes.data;
                        const avg = reviews.length > 0 
                            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) 
                            : 0;
                        return { ...p, rating: avg, reviewCount: reviews.length };
                    } catch {
                        return { ...p, rating: 0, reviewCount: 0 };
                    }
                }));

                setProducts(productsWithRating);
                setCategories(cRes.data);
                setFilteredProducts(productsWithRating);

                // Инициализация фильтров
                if (productsWithRating.length > 0) {
                    // Цены
                    const maxPrice = Math.ceil(Math.max(...productsWithRating.map(p => p.basePrice)));
                    setAbsoluteMaxPrice(maxPrice);
                    setPriceRange({ min: 0, max: maxPrice });

                    // Возраст (собираем все ageMin и ageMax из всех вариантов всех товаров)
                    const allAgeValues = productsWithRating.flatMap(p => 
                        p.variants?.flatMap(v => [v.ageMin, v.ageMax]) || []
                    ).filter(val => val !== null && val !== undefined);

                    if (allAgeValues.length > 0) {
                        setAgeRange({ 
                            min: Math.min(...allAgeValues), 
                            max: Math.max(...allAgeValues) 
                        });
                    } else {
                        setAgeRange({ min: 0, max: 36 }); // Значение по умолчанию
                    }
                }
            } catch (err) { 
                console.error("Ошибка загрузки данных каталога:", err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, []);
    const handleToggle = (val, list, setter) => {
        setter(list.includes(val) ? list.filter(i => i !== val) : [...list, val]);
    };

    const getUniqueValues = (key, isVariant = false) => {
        const vals = isVariant 
            ? products.flatMap(p => p.variants?.map(v => v[key]) || [])
            : products.map(p => p[key]);
        return [...new Set(vals)].filter(Boolean).sort();
    };

   useEffect(() => {
    const res = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPrice = p.basePrice <= priceRange.max;
        const matchesCat = selectedCatIds.length === 0 || p.categories?.some(c => selectedCatIds.includes(c.categoryId));
        const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
        const matchesRating = p.rating >= minRating;
        
        // Логика для вариантов (Цвет, Размер, Возраст)
        const variantMatch = p.variants?.some(v => {
            const matchesSize = selectedSizes.length === 0 || selectedSizes.includes(v.size);
            const matchesColor = selectedColors.length === 0 || selectedColors.includes(v.color);
            
            // Фильтр по возрасту:
            // 1. Если у варианта возраст не указан (null), мы решаем: показывать его или нет.
            // Обычно, если фильтр по возрасту активен, товары без возраста скрываются.
            const hasAgeData = v.ageMin !== null;
            const matchesAge = !hasAgeData || (v.ageMin >= ageRange.min && (v.ageMax <= ageRange.max || !v.ageMax));

            return matchesSize && matchesColor && matchesAge;
        });
        
        // Если у товара вообще нет вариантов, он проходит, если подошел по остальным фильтрам
        return matchesSearch && matchesPrice && matchesCat && matchesBrand && matchesRating && 
               (p.variants?.length > 0 ? variantMatch : true);
    });
    setFilteredProducts(res);
}, [searchTerm, selectedCatIds, selectedBrands, selectedSizes, selectedColors, priceRange, ageRange, minRating, products]);
    if (loading) return <div className="text-center my-5 py-5"><div className="spinner-border text-primary shadow-sm"></div></div>;

    return (
        <div className="container-fluid my-5 px-lg-5">
            <style>{`
                .filter-card { border: none; background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
                .filter-header { cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 12px 5px; border-bottom: 1px solid #f8f9fa; }
                .filter-content { padding: 15px 5px; max-height: 250px; overflow-y: auto; }
                .color-circle { width: 14px; height: 14px; border-radius: 50%; display: inline-block; margin-right: 8px; border: 1px solid #ddd; vertical-align: middle; }
                .sticky-filters { position: sticky; top: 100px; }
                .star-rating-filter { cursor: pointer; transition: 0.2s; padding: 6px 8px; border-radius: 8px; }
                .star-rating-filter:hover { background: #f8f9fa; }
                .star-rating-filter.active { background: #000; color: #fff; }
                .star-rating-filter.active .text-warning { color: #ffc107 !important; }
            `}</style>

            <div className="row g-4">
                <aside className="col-md-3">
                    <div className="filter-card p-4 sticky-filters">
                        <h5 className="fw-bold mb-4">Фильтры</h5>
                        
                        <input type="text" className="form-control mb-4 border-0 bg-light py-2 px-3 shadow-none rounded-3" placeholder="Найти..." onChange={e => setSearchTerm(e.target.value)} />

                        <FilterSection title="Категории" isOpen={openSections.cat} onToggle={() => setOpenSections({...openSections, cat: !openSections.cat})}>
                            {categories
                                .filter(c => !c.parentId && c.targetType === 'PRODUCT') // Добавили проверку типа
                                .map(parent => (
                                <div key={parent.categoryId} className="mb-2">
                                    <div className="form-check small">
                                        <input className="form-check-input shadow-none" type="checkbox" id={parent.categoryId} checked={selectedCatIds.includes(parent.categoryId)} onChange={() => handleToggle(parent.categoryId, selectedCatIds, setSelectedCatIds)} />
                                        <label className="form-check-label fw-bold" htmlFor={parent.categoryId}>{parent.name}</label>
                                    </div>
                                    <div className="ms-3 ps-2 border-start mt-1">
                                        {categories
                                            .filter(sub => sub.parentId === parent.categoryId && sub.targetType === 'PRODUCT')
                                            .map(sub => (
                                            <div className="form-check small py-1" key={sub.categoryId}>
                                                <input className="form-check-input shadow-none" type="checkbox" id={sub.categoryId} checked={selectedCatIds.includes(sub.categoryId)} onChange={() => handleToggle(sub.categoryId, selectedCatIds, setSelectedCatIds)} />
                                                <label className="form-check-label" htmlFor={sub.categoryId}>{sub.name}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </FilterSection>

                        <FilterSection title="Рейтинг" isOpen={openSections.rating} onToggle={() => setOpenSections({...openSections, rating: !openSections.rating})}>
                            {[5, 4, 3, 2, 1].map(star => (
                                <div 
                                    key={star} 
                                    className={`star-rating-filter small mb-1 ${minRating === star ? 'active' : ''}`}
                                    onClick={() => setMinRating(minRating === star ? 0 : star)}
                                >
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`bi bi-star${i < star ? '-fill text-warning' : ''} me-1`}></i>
                                    ))}
                                    <span className="ms-1">{star === 5 ? '5.0' : 'и выше'}</span>
                                </div>
                            ))}
                        </FilterSection>

                        <FilterSection title="Бренды" isOpen={openSections.brand} onToggle={() => setOpenSections({...openSections, brand: !openSections.brand})}>
                            {getUniqueValues('brand').map(b => (
                                <div key={b} className="form-check small mb-2">
                                    <input className="form-check-input shadow-none" type="checkbox" id={`b-${b}`} checked={selectedBrands.includes(b)} onChange={() => handleToggle(b, selectedBrands, setSelectedBrands)} />
                                    <label className="form-check-label" htmlFor={`b-${b}`}>{b}</label>
                                </div>
                            ))}
                        </FilterSection>

                        <FilterSection title="Размеры" isOpen={openSections.size} onToggle={() => setOpenSections({...openSections, size: !openSections.size})}>
                            <div className="d-flex flex-wrap gap-2">
                                {getUniqueValues('size', true).map(s => (
                                    <button key={s} className={`btn btn-sm ${selectedSizes.includes(s) ? 'btn-dark' : 'btn-outline-light text-dark border-light bg-light'}`} style={{fontSize: '11px'}} onClick={() => handleToggle(s, selectedSizes, setSelectedSizes)}>{s}</button>
                                ))}
                            </div>
                        </FilterSection>

                        <FilterSection title="Цвета" isOpen={openSections.color} onToggle={() => setOpenSections({...openSections, color: !openSections.color})}>
                            {getUniqueValues('color', true).map(c => (
                                <div key={c} className="form-check small mb-2">
                                    <input className="form-check-input shadow-none" type="checkbox" id={`c-${c}`} checked={selectedColors.includes(c)} onChange={() => handleToggle(c, selectedColors, setSelectedColors)} />
                                    <label className="form-check-label text-capitalize" htmlFor={`c-${c}`}>
                                        <span className="color-circle" style={{backgroundColor: colorMap[c.toLowerCase()] || '#eee'}}></span>
                                        {c}
                                    </label>
                                </div>
                            ))}
                        </FilterSection>
                        <FilterSection title="Возраст (мес.)" isOpen={openSections.age} onToggle={() => setOpenSections({...openSections, age: !openSections.age})}>
                            <div className="d-flex align-items-center gap-2">
                                <div className="flex-grow-1">
                                    <label className="small text-muted mb-1">ОТ</label>
                                    <input 
                                        type="number" 
                                        className="form-control form-control-sm border-0 bg-light rounded-3" 
                                        value={ageRange.min} 
                                        onChange={e => setAgeRange({...ageRange, min: Number(e.target.value)})} 
                                    />
                                </div>
                                <div className="mt-4">—</div>
                                <div className="flex-grow-1">
                                    <label className="small text-muted mb-1">ДО</label>
                                    <input 
                                        type="number" 
                                        className="form-control form-control-sm border-0 bg-light rounded-3" 
                                        value={ageRange.max} 
                                        onChange={e => setAgeRange({...ageRange, max: Number(e.target.value)})} 
                                    />
                                </div>
                            </div>
                        </FilterSection>
                        <div className="mt-4 pt-3 border-top">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="small text-uppercase fw-bold opacity-50">До</span>
                                <span className="price-label fw-bold text-primary">{priceRange.max} BYN</span>
                            </div>
                            <input type="range" className="form-range" min="0" max={absoluteMaxPrice} value={priceRange.max} onChange={e => setPriceRange({...priceRange, max: Number(e.target.value)})} />
                        </div>
                    </div>
                </aside>

                <main className="col-md-9">
                    <div className="row row-cols-1 row-cols-md-3 g-4">
                        {filteredProducts.map(p => <ProductCard key={p.productId} product={p} />)}
                    </div>
                </main>
            </div>
        </div>
    );
};

const FilterSection = ({ title, isOpen, onToggle, children }) => (
    <div className="mb-2">
        <div className="filter-header" onClick={onToggle}>
            <span className="fw-bold small text-uppercase opacity-75">{title}</span>
            <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} small`}></i>
        </div>
        {isOpen && <div className="filter-content">{children}</div>}
    </div>
);

const ProductCard = ({ product }) => (
    <div className="col">
        <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
            <div style={{height: '240px', overflow: 'hidden', position: 'relative'}}>
                <img src={product.images?.[0] ? `http://localhost:8080${product.images[0].imageUrl}` : '/no-photo.png'} className="card-img-top h-100 w-100" style={{objectFit: 'cover'}} alt={product.name} />
                {product.rating > 0 && (
                    <div className="position-absolute top-0 end-0 m-2 badge bg-white text-dark shadow-sm rounded-pill">
                        <i className="bi bi-star-fill text-warning me-1"></i>
                        {product.rating.toFixed(1)}
                    </div>
                )}
            </div>
            <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted fw-bold">{product.brand}</small>
                    <span className="fw-bold text-primary">{product.basePrice} BYN</span>
                </div>
                <h6 className="card-title fw-bold text-truncate">{product.name}</h6>
                <div className="mb-2">
                    {[...Array(5)].map((_, i) => (
                        <i key={i} className={`bi bi-star${i < Math.round(product.rating) ? '-fill text-warning' : ''} small`}></i>
                    ))}
                    <span className="small text-muted ms-2">({product.reviewCount || 0})</span>
                </div>
                <Link to={`/product/${product.productId}`} className="btn btn-outline-dark btn-sm w-100 rounded-pill mt-2">Посмотреть</Link>
            </div>
        </div>
    </div>
);

export default Catalog;