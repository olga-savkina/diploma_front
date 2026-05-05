import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            // Используем полный путь для надежности
            const response = await axios.get('http://localhost:8080/api/reviews/admin/all', { withCredentials: true });
            setReviews(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Ошибка при загрузке отзывов:", error);
            setLoading(false);
        }
    };

    const handleApprove = async (reviewId) => {
        try {
            await axios.put(`http://localhost:8080/api/reviews/admin/${reviewId}/approve`, {}, { withCredentials: true });
            // Обновляем состояние: ищем по reviewId
            setReviews(reviews.map(r => r.reviewId === reviewId ? { ...r, moderated: true } : r));
        } catch (error) {
            alert("Не удалось одобрить отзыв");
        }
    };

    const handleDelete = async (reviewId) => {
        if (window.confirm("Вы уверены, что хотите удалить этот отзыв?")) {
            try {
                await axios.delete(`http://localhost:8080/api/reviews/admin/${reviewId}`, { withCredentials: true });
                // Фильтруем по reviewId
                setReviews(reviews.filter(r => r.reviewId !== reviewId));
            } catch (error) {
                alert("Ошибка при удалении");
            }
        }
    };

    if (loading) return <div className="p-4 text-center">Загрузка данных...</div>;

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">Управление отзывами</h2>
                <span className="badge bg-dark rounded-pill">Всего: {reviews.length}</span>
            </div>

            <div className="card shadow-sm border-0 rounded-4">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>ID (UUID)</th>
                                <th>Отзыв</th>
                                <th>Рейтинг</th>
                                <th>Статус</th>
                                <th>Дата</th>
                                <th className="text-center">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map((review) => (
                                <tr key={review.reviewId}>
                                    <td className="text-muted small">
                                        {/* Безопасный вызов substring через reviewId */}
                                        {review.reviewId ? review.reviewId.substring(0, 8) : '---'}...
                                    </td>
                                    <td style={{ maxWidth: '300px' }}>
                                        {/* Используем review.comment вместо review.text */}
                                        <div className="text-truncate-2">{review.comment}</div>
                                    </td>
                                    <td>
                                        <span className="text-warning">
                                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                        </span>
                                    </td>
                                    <td>
                                        {review.moderated ? (
                                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">Опубликован</span>
                                        ) : (
                                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill">На модерации</span>
                                        )}
                                    </td>
                                    <td>{new Date(review.reviewDate).toLocaleDateString('ru-RU')}</td>
                                    <td>
                                        <div className="d-flex gap-2 justify-content-center">
                                            {!review.moderated && (
                                                <button 
                                                    className="btn btn-success btn-sm rounded-3"
                                                    onClick={() => handleApprove(review.reviewId)}
                                                >
                                                    Одобрить
                                                </button>
                                            )}
                                            <button 
                                                className="btn btn-outline-danger btn-sm rounded-3"
                                                onClick={() => handleDelete(review.reviewId)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {reviews.length === 0 && (
                        <div className="p-5 text-center text-muted">Отзывов пока нет.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminReviews;