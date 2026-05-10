import React, { useState } from 'react';
import axios from 'axios';

const ProductReviews = ({ productId, reviews, onReviewAdded }) => {
    const [showForm, setShowForm] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);

    const renderStars = (rating) => (
        [...Array(5)].map((_, i) => (
            <i key={i} className={`bi ${i < rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'} me-1`}></i>
        ))
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('http://localhost:8080/api/reviews', {
                productId: productId,
                rating: parseInt(newReview.rating),
                comment: newReview.comment
            }, { withCredentials: true });
            alert("Отзыв опубликован!");
            onReviewAdded(); // Обновляем список в родителе
            setShowForm(false);
        } catch {
            alert("Ошибка. Пожалуйста, авторизуйтесь.");
        } finally { setSubmitting(false); }
    };

    return (
        <div className="mt-5 pt-5 border-top">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">Отзывы <span className="text-muted fs-5 ms-2">({reviews.length})</span></h3>
                <button className="btn btn-outline-dark rounded-pill px-4" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Отмена' : 'Написать отзыв'}
                </button>
            </div>

            {showForm && (
                <div className="card border-0 bg-light rounded-4 p-4 mb-5 shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Оценка</label>
                            <select className="form-select border-0 rounded-3 shadow-sm" value={newReview.rating} onChange={e => setNewReview({...newReview, rating: e.target.value})}>
                                <option value="5">⭐⭐⭐⭐⭐ (5 - Отлично)</option>
                                <option value="4">⭐⭐⭐⭐ (4 - Хорошо)</option>
                                <option value="3">⭐⭐⭐ (3 - Нормально)</option>
                                <option value="2">⭐⭐ (2 - Плохо)</option>
                                <option value="1">⭐ (1 - Ужасно)</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Ваш комментарий</label>
                            <textarea className="form-control border-0 rounded-3 shadow-sm" rows="3" required value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})}></textarea>
                        </div>
                        <button className="btn btn-primary rounded-pill px-5" disabled={submitting}>
                            {submitting ? "Отправка..." : "Опубликовать"}
                        </button>
                    </form>
                </div>
            )}

            <div className="row g-4">
                {reviews.map(review => (
                    <div key={review.reviewId} className="col-12">
                        <div className="bg-white border-bottom pb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>{renderStars(review.rating)}</div>
                                <small className="text-muted">{new Date(review.reviewDate).toLocaleDateString()}</small>
                            </div>
                            <p className="mb-0 text-secondary">{review.comment}</p>
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && <p className="text-center text-muted py-5">У этого товара пока нет отзывов.</p>}
            </div>
        </div>
    );
};

export default ProductReviews;