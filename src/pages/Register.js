import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // Состояние для текста ошибки
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(''); // Сбрасываем старую ошибку перед новым запросом
        
        try {
            await axios.post('http://localhost:8080/api/auth/register', {
                email: email,
                password: password,
                role: 'CLIENT' 
            });
            navigate('/login', { state: { message: 'Регистрация прошла успешно! Теперь войдите.' } });
        } catch (err) {
            // Если сервер вернул ошибку (например, 409), берем текст из ответа
            if (err.response && err.response.status === 409) {
                setError(err.response.data);
            } else {
                setError('Что-то пошло не так. Попробуйте позже.');
            }
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-4 card p-4 shadow">
                    <h3 className="text-center mb-4">Регистрация BabyBoom</h3>
                    
                    {/* Вывод ошибки, если она есть */}
                    {error && <div className="alert alert-danger p-2 text-center" style={{fontSize: '0.9rem'}}>
                        {error}
                    </div>}

                    <form onSubmit={handleRegister}>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input 
                                type="email" 
                                className={`form-control ${error.includes('Email') ? 'is-invalid' : ''}`} 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Пароль</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                        <button type="submit" className="btn btn-success w-100">Создать аккаунт</button>
                    </form>
                    
                    <div className="mt-3 text-center">
                        <small>Уже есть аккаунт? <a href="/login">Войти</a></small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;