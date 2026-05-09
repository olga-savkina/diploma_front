import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = ({ setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();
    const successMsg = location.state?.message;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData();
        formData.append('username', email); // Бэкенд ждет 'username', передаем туда email
        formData.append('password', password);

        try {
            // 1. Выполняем вход
            await axios.post('http://localhost:8080/login', formData, {
                withCredentials: true 
            });

            // 2. Получаем полные данные о пользователе (роль, email и т.д.)
            const userRes = await axios.get('http://localhost:8080/api/auth/me', { 
                withCredentials: true 
            });
            
            // 3. Сохраняем в localStorage для работы корзины
            // Если username на бэкенде нет, используем email
            const userData = {
                username: userRes.data.username || userRes.data.email.split('@')[0],
                email: userRes.data.email,
                role: userRes.data.role
            };
            
            localStorage.setItem('user', JSON.stringify(userData));

            // 4. Обновляем состояние в App.js
            setUser(userData);

            // 5. Уходим на главную
            navigate('/home');
            
            // Вызываем событие, чтобы Navbar пересчитал корзину под нового юзера
            window.dispatchEvent(new Event('storage'));
            
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Неверный email или пароль');
            } else {
                setError('Сервер недоступен. Попробуйте позже.');
            }
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-4 card p-4 shadow">
                    <h3 className="text-center mb-4">Вход в BabyBoom</h3>

                    {successMsg && <div className="alert alert-success p-2 text-center" style={{fontSize: '0.9rem'}}>{successMsg}</div>}
                    {error && <div className="alert alert-danger p-2 text-center" style={{fontSize: '0.9rem'}}>{error}</div>}

                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Пароль</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Войти</button>
                    </form>
                    
                    <p className="mt-3 text-center">
                        Нет аккаунта? <a href="/register" className="text-decoration-none">Зарегистрироваться</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;