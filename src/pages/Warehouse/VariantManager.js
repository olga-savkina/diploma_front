import React, { useState } from 'react';
import axios from 'axios';

const QUICK_SIZES = ['56', '62', '68', '74', '80', '86', '92', '98', '104', '110', '116'];

const COLOR_OPTIONS = [
    { name: "Белый", hex: "#ffffff" }, { name: "Черный", hex: "#000000" },
    { name: "Красный", hex: "#ff0000" }, { name: "Синий", hex: "#0000ff" },
    { name: "Голубой", hex: "#87ceeb" }, { name: "Зеленый", hex: "#008000" },
    { name: "Желтый", hex: "#ffff00" }, { name: "Розовый", hex: "#ffc0cb" },
    { name: "Бежевый", hex: "#f5f5dc" }, { name: "Серый", hex: "#808080" },
    { name: "Фиолетовый", hex: "#800080" }, { name: "Оранжевый", hex: "#ffa500" }
];

const VariantManager = ({ productId, product, variants, onRefresh, onReplenish }) => {
    const [loading, setLoading] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState([]);
    
    // Состояние формы создания/редактирования
    const [variantForm, setVariantForm] = useState({
        variantId: null,
        size: '',
        color: '',
        quantity: 0,
        ageMin: '',
        ageMax: '',
        expiryDate: '',
        productionDate: '',
        priceOverride: ''
    });

    // Состояние модалки закупки
    const [replenishModal, setReplenishModal] = useState({
        show: false,
        variantId: null,
        variantName: '',
        amount: 1,
        expiryDate: ''
    });

    const isFashion = product.categories?.some(cat => 
        cat.name.toLowerCase().includes('одежда') || cat.name.toLowerCase().includes('обувь')
    );

    const needsDates = product.categories?.some(cat => 
        cat.name.toLowerCase().includes('еда') || cat.name.toLowerCase().includes('питание') ||
        cat.name.toLowerCase().includes('косметика') || cat.name.toLowerCase().includes('гигиена')
    );

    const getColorHex = (colorName) => {
        const found = COLOR_OPTIONS.find(c => c.name.toLowerCase() === colorName?.toLowerCase());
        return found ? found.hex : '#eeeeee';
    };

    const calculateExpiryStatus = (expiryDate) => {
        if (!expiryDate) return { color: '', label: '' };
        const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) return { color: 'text-danger fw-bold', label: 'ПРОСРОЧЕН!' };
        if (daysLeft <= 7) return { color: 'text-danger', label: 'Срок < 7 дней' };
        if (daysLeft <= 30) return { color: 'text-warning', label: 'Срок < 30 дней' };
        return { color: 'text-success', label: 'В норме' };
    };

    const toggleSizeSelection = (size) => {
        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    };

    const handleSubmit = async () => {
        const sizesToSave = [...selectedSizes];
        if (variantForm.size) sizesToSave.push(variantForm.size);
        
        if (isFashion && sizesToSave.length === 0 && !variantForm.variantId) {
            return alert("Выберите хотя бы один размер!");
        }
        
        const finalSizes = sizesToSave.length > 0 ? sizesToSave : [null];
        setLoading(true);

        try {
            const config = { withCredentials: true };
            if (variantForm.variantId) {
                const { quantity, productionDate, expiryDate, ...payload } = variantForm;
                await axios.put(`http://localhost:8080/api/admin/variants/${variantForm.variantId}`, payload, config);
            } else {
                const promises = finalSizes.map(size => {
                    const payload = {
                        ...variantForm,
                        size: size || null,
                        quantity: Number(variantForm.quantity) || 0,
                        sku: `SKU-${productId.substring(0, 5)}-${size || 'N'}-${Date.now()}`
                    };
                    return axios.post(`http://localhost:8080/api/admin/variants/product/${productId}`, payload, config);
                });
                await Promise.all(promises);
            }
            resetForm();
            onRefresh();
        } catch (err) {
            console.error(err);
            alert("Ошибка при сохранении.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setVariantForm({
            variantId: null, size: '', color: '', quantity: 0, 
            ageMin: '', ageMax: '', expiryDate: '', productionDate: '', priceOverride: ''
        });
        setSelectedSizes([]);
    };

    const startEdit = (v) => {
        setVariantForm({
            ...v,
            quantity: v.stock?.quantity || 0,
            priceOverride: v.priceOverride || '',
            ageMin: v.ageMin ?? '',
            ageMax: v.ageMax ?? '',
            expiryDate: (v.stock?.expiryDate || v.expiryDate)?.split('T')[0] || '',
            productionDate: (v.stock?.productionDate || v.productionDate)?.split('T')[0] || ''
        });
        window.scrollTo({ top: 500, behavior: 'smooth' });
    };

    const openReplenish = (v) => {
        setReplenishModal({
            show: true,
            variantId: v.variantId,
            variantName: `${v.size || ''} ${v.color || ''}`.trim() || 'Основной вариант',
            amount: 1,
            expiryDate: (v.stock?.expiryDate || v.expiryDate)?.split('T')[0] || ''
        });
    };

    const deleteVariant = async (id) => {
        if (window.confirm("Удалить этот вариант?")) {
            try {
                await axios.delete(`http://localhost:8080/api/admin/variants/${id}`, { withCredentials: true });
                onRefresh();
            } catch (err) {
                alert("Не удалось удалить.");
            }
        }
    };

    return (
        <div className="variant-manager mt-3">
            <h6 className="fw-bold mb-3 text-secondary border-bottom pb-2">Складской учет и характеристики</h6>
            
            {/* ТАБЛИЦА ВАРИАНТОВ */}
            <div className="table-responsive mb-4 shadow-sm rounded">
                <table className="table table-sm table-hover border bg-white mb-0 small">
                    <thead className="table-dark">
                        <tr>
                            <th>Размер</th>
                            <th>Цвет</th>
                            <th className="text-center">Возраст</th>
                            <th>Цена</th>
                            <th className="text-center">Склад</th>
                            <th className="text-center">Доступно</th>
                            {needsDates && <th>Срок годности</th>}
                            <th className="text-center">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {variants?.length > 0 ? variants.map(v => {
                            const stockQty = v.stock?.quantity || 0;
                            const reservedQty = v.stock?.reservedQuantity || 0;
                            const availableQty = stockQty - reservedQty;
                            const expiryStatus = calculateExpiryStatus(v.stock?.expiryDate || v.expiryDate);

                            return (
                                <tr key={v.variantId} className={stockQty <= 5 ? 'table-danger' : ''}>
                                    <td className="align-middle fw-bold">{v.size || '—'}</td>
                                    <td className="align-middle">
                                        {v.color && <span style={{backgroundColor: getColorHex(v.color), width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', marginRight: '5px', border: '1px solid #ccc'}}></span>}
                                        {v.color || '—'}
                                    </td>
                                    <td className="align-middle text-center text-muted">
                                        {(v.ageMin !== null || v.ageMax !== null) ? `${v.ageMin || 0}-${v.ageMax || '∞'} мес.` : '—'}
                                    </td>
                                    <td className="align-middle">
                                        {v.priceOverride ? <span className="badge bg-primary">{v.priceOverride} BYN</span> : <span className="text-muted">{product.basePrice}</span>}
                                    </td>
                                    <td className="align-middle text-center">{stockQty} шт.</td>
                                    <td className="align-middle text-primary fw-bold text-center">{availableQty} шт.</td>
                                    {needsDates && (
                                        <td className={`align-middle ${expiryStatus.color}`}>
                                            {(v.stock?.expiryDate || v.expiryDate) ? new Date(v.stock?.expiryDate || v.expiryDate).toLocaleDateString('ru-RU') : '—'}
                                            <div style={{fontSize: '0.65rem'}}>{expiryStatus.label}</div>
                                        </td>
                                    )}
                                    <td className="text-center align-middle">
                                        <div className="d-flex justify-content-center gap-1">
                                            <button className="btn btn-sm btn-outline-dark" title="Закупить партию" onClick={() => openReplenish(v)}>➕</button>
                                            <button className="btn btn-sm text-warning" onClick={() => startEdit(v)}>✏️</button>
                                            <button className="btn btn-sm text-danger" onClick={() => deleteVariant(v.variantId)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan={needsDates ? 8 : 7} className="text-center p-4 text-muted">Варианты товара не созданы</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ФОРМА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body bg-light rounded">
                    <h6 className="fw-bold mb-3 small">
                        {variantForm.variantId ? '📝 Редактирование характеристик' : '➕ Добавление новых вариантов'}
                    </h6>
                    
                    {isFashion && !variantForm.variantId && (
                        <div className="mb-3 p-2 bg-white rounded border">
                            <small className="text-muted d-block mb-2">Быстрый выбор размеров:</small>
                            <div className="d-flex flex-wrap gap-1">
                                {QUICK_SIZES.map(qs => (
                                    <button key={qs} type="button" 
                                        className={`btn btn-xs ${selectedSizes.includes(qs) ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        style={{fontSize: '0.7rem', padding: '2px 6px'}}
                                        onClick={() => toggleSizeSelection(qs)}>{qs}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="row g-2 mb-3">
                        <div className="col-md-2">
                            <label className="small fw-bold">Размер</label>
                            <input type="text" className="form-control form-control-sm" value={variantForm.size || ''} 
                                onChange={e => setVariantForm({...variantForm, size: e.target.value})} />
                        </div>
                        <div className="col-md-2">
                            <label className="small fw-bold">Цвет</label>
                            <select className="form-select form-select-sm" value={variantForm.color || ''} 
                                onChange={e => setVariantForm({...variantForm, color: e.target.value})}>
                                <option value="">Без цвета</option>
                                {COLOR_OPTIONS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="small fw-bold text-primary">Цена (BYN)</label>
                            <input type="number" className="form-control form-control-sm border-primary" 
                                value={variantForm.priceOverride || ''} 
                                placeholder={product.basePrice}
                                onChange={e => setVariantForm({...variantForm, priceOverride: e.target.value})} />
                        </div>
                        <div className="col-md-2">
                            <label className={`small fw-bold ${variantForm.variantId ? 'text-muted' : ''}`}>
                                {variantForm.variantId ? 'Текущий запас' : 'Нач. остаток'}
                            </label>
                            <input type="number" 
                                className={`form-control form-control-sm ${variantForm.variantId ? 'bg-white text-muted' : ''}`}
                                value={variantForm.quantity} 
                                disabled={!!variantForm.variantId}
                                onChange={e => setVariantForm({...variantForm, quantity: e.target.value})} />
                        </div>
                        <div className="col-md-4">
                            <label className="small fw-bold">Возраст (мес)</label>
                            <div className="input-group input-group-sm">
                                <input type="number" placeholder="от" className="form-control" value={variantForm.ageMin} 
                                    onChange={e => setVariantForm({...variantForm, ageMin: e.target.value})} />
                                <input type="number" placeholder="до" className="form-control" value={variantForm.ageMax} 
                                    onChange={e => setVariantForm({...variantForm, ageMax: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="row g-2 align-items-end">
                        {needsDates && (
                            <>
                                <div className="col-md-4">
                                    <label className="small fw-bold text-muted">Дата производства</label>
                                    <input type="date" 
                                        className={`form-control form-control-sm bg-white ${variantForm.variantId ? 'text-muted border-light' : ''}`}
                                        value={variantForm.productionDate} 
                                        readOnly={!!variantForm.variantId}
                                        onChange={e => setVariantForm({...variantForm, productionDate: e.target.value})} />
                                </div>
                                <div className="col-md-4">
                                    <label className={`small fw-bold ${variantForm.variantId ? 'text-muted' : 'text-danger'}`}>Срок годности</label>
                                    <input type="date" 
                                        className={`form-control form-control-sm bg-white ${variantForm.variantId ? 'text-muted border-light' : 'border-danger'}`}
                                        value={variantForm.expiryDate} 
                                        readOnly={!!variantForm.variantId}
                                        onChange={e => setVariantForm({...variantForm, expiryDate: e.target.value})} />
                                </div>
                            </>
                        )}
                        <div className={needsDates ? "col-md-4" : "col-md-12 text-end"}>
                            <div className="d-flex gap-2">
                                {variantForm.variantId && <button className="btn btn-light btn-sm" onClick={resetForm}>Отмена</button>}
                                <button className="btn btn-success btn-sm w-100 shadow-sm fw-bold" onClick={handleSubmit} disabled={loading}>
                                    {loading ? '💾 Сохранение...' : (variantForm.variantId ? '💾 Сохранить изменения' : '＋ Создать вариант(ы)')}
                                </button>
                            </div>
                        </div>
                    </div>
                    {variantForm.variantId && (
                        <div className="mt-2 text-center">
                            <small className="text-muted" style={{fontSize: '0.7rem'}}>
                                * Характеристики обновлены. Количество и сроки меняются только через приход (➕).
                            </small>
                        </div>
                    )}
                </div>
            </div>

            {/* МОДАЛЬНОЕ ОКНО ЗАКУПКИ (REPLENISH MODAL) */}
            {replenishModal.show && (
                <div className="modal d-block shadow" style={{backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-dark text-white">
                                <h6 className="modal-title fw-bold">📦 Поступление новой партии</h6>
                                <button type="button" className="btn-close btn-close-white" 
                                    onClick={() => setReplenishModal({...replenishModal, show: false})}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="small text-muted mb-3">Товар: <strong className="text-dark">{product.name} ({replenishModal.variantName})</strong></p>
                                
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Количество штук (приход)</label>
                                    <input type="number" className="form-control" autoFocus
                                        value={replenishModal.amount} 
                                        onChange={e => setReplenishModal({...replenishModal, amount: e.target.value})} />
                                </div>

                                {needsDates && (
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-danger">Новый срок годности партии</label>
                                        <input type="date" className="form-control border-danger shadow-sm" 
                                            value={replenishModal.expiryDate} 
                                            onChange={e => setReplenishModal({...replenishModal, expiryDate: e.target.value})} />
                                        <small className="text-muted mt-1 d-block" style={{fontSize: '0.7rem'}}>
                                            * Срок годности обновится для всего текущего остатка данного варианта.
                                        </small>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-light p-2">
                                <button className="btn btn-sm btn-secondary" 
                                    onClick={() => setReplenishModal({...replenishModal, show: false})}>Отмена</button>
                                <button className="btn btn-sm btn-success px-4 fw-bold" 
                                    onClick={() => {
                                        onReplenish(replenishModal.variantId, replenishModal.amount, replenishModal.expiryDate);
                                        setReplenishModal({...replenishModal, show: false});
                                    }}>Подтвердить приход</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariantManager;