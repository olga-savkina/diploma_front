import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#6610f2', '#fd7e14'];

const Analytics = () => {
    const [data, setData] = useState(null);
    const reportRef = useRef();

    useEffect(() => {
        // Путь должен совпадать с контроллером, который вызывает AnalyticsService.getStatistics()
        axios.get('http://localhost:8080/api/admin/analytics/summary', { withCredentials: true })
            .then(res => setData(res.data))
            .catch(err => console.error("Ошибка загрузки аналитики", err));
    }, []);

    // Форматирование данных для линейного графика (Динамика)
    const formatLineData = () => {
        if (!data || !data.salesDynamics) return [];
        return Object.keys(data.salesDynamics).map(date => ({
            date: date,
            sales: data.salesDynamics[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    // Форматирование данных для круговой диаграммы (Города)
    const formatCityData = () => {
        if (!data || !data.cityStats) return [];
        return Object.keys(data.cityStats).map(city => ({
            name: city,
            value: data.cityStats[city]
        }));
    };

    const exportPDF = () => {
        const input = reportRef.current;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save("business-report.pdf");
        });
    };

    if (!data) return <div className="text-center py-5">Загрузка данных...</div>;

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">📊 Панель управления BabyBoom</h2>
                <button className="btn btn-danger shadow-sm rounded-pill px-4" onClick={exportPDF}>
                    <i className="bi bi-file-earmark-pdf me-2"></i>Экспорт PDF
                </button>
            </div>

            <div ref={reportRef} className="p-4 bg-white rounded-4 shadow-sm">
                
                {/* 1. КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ (Карточки) */}
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="card border-0 bg-primary text-white p-3 shadow-sm rounded-4 h-100">
                            <small className="opacity-75">Общая выручка</small>
                            <h3 className="fw-bold mb-0">{data.totalRevenue?.toLocaleString()} BYN</h3>
                            <small className="mt-2 text-white-50">Ср. чек: {data.averageCheck?.toFixed(2)}</small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 bg-dark text-white p-3 shadow-sm rounded-4 h-100">
                            <small className="opacity-75">Пользователи</small>
                            <h3 className="fw-bold mb-0">{data.totalUsers}</h3>
                            <small className="mt-2 text-white-50">Активных покупателей: {data.activeCustomers}</small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 bg-warning text-dark p-3 shadow-sm rounded-4 h-100">
                            <small className="opacity-75">Отзывы</small>
                            <h3 className="fw-bold mb-0">{data.avgRating?.toFixed(1)} / 5.0</h3>
                            <small className="mt-2 text-muted">Всего отзывов: {data.totalReviews}</small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 bg-success text-white p-3 shadow-sm rounded-4 h-100">
                            <small className="opacity-75">Использование бонусов</small>
                            <h3 className="fw-bold mb-0">-{data.totalBonusesUsed?.toFixed(0)} Б</h3>
                            <small className="mt-2 text-white-50">В {data.ordersWithBonuses} заказах</small>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* 2. ГРАФИК ПРОДАЖ */}
                    <div className="col-lg-8 mb-4">
                        <div className="card border-0 shadow-sm p-4 h-100 rounded-4">
                            <h5 className="fw-bold mb-4">Динамика выручки</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart data={formatLineData()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" fontSize={11} />
                                        <YAxis fontSize={11} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="sales" stroke="#0d6efd" strokeWidth={3} dot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* 3. КОГОРТНЫЙ АНАЛИЗ (Новые пользователи) */}
                    <div className="col-lg-4 mb-4">
                        <div className="card border-0 shadow-sm p-4 h-100 rounded-4">
                            <h5 className="fw-bold mb-4">Прирост аудитории</h5>
                            <div className="list-group list-group-flush">
                                {data.cohortData && Object.entries(data.cohortData).map(([month, count]) => (
                                    <div key={month} className="list-group-item d-flex justify-content-between align-items-center border-0 px-0">
                                        <span className="text-muted">{month}</span>
                                        <span className="badge bg-primary rounded-pill">+{count} новых</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto pt-3 text-center">
                                <small className="text-muted italic">По месяцам регистрации</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* 4. ГЕОГРАФИЯ (Pie Chart) */}
                    <div className="col-lg-4 mb-4">
                        <div className="card border-0 shadow-sm p-4 h-100 rounded-4">
                            <h5 className="fw-bold mb-4">География заказов</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={formatCityData()}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {formatCityData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* 5. ПОПУЛЯРНЫЕ ТОВАРЫ */}
                    <div className="col-lg-8 mb-4">
                        <div className="card border-0 shadow-sm p-4 h-100 rounded-4">
                            <h5 className="fw-bold mb-4">Лидеры продаж (ТОП-5 моделей)</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={data.topProducts} margin={{ bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            interval={0} 
                                            tick={{ fontSize: 10 }}
                                            angle={-30} 
                                            textAnchor="end"
                                        />
                                        <YAxis fontSize={11} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#198754" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;