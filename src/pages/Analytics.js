import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Analytics = () => {
    const [data, setData] = useState(null);
    const reportRef = useRef();

    useEffect(() => {
        axios.get('http://localhost:8080/api/admin/analytics/summary', { withCredentials: true })
            .then(res => setData(res.data))
            .catch(err => console.error("Ошибка загрузки аналитики", err));
    }, []);

    // Преобразуем Map из бэкенда в массив для графиков
    const formatLineData = () => {
        if (!data || !data.salesDynamics) return [];
        return Object.keys(data.salesDynamics).map(date => ({
            date: date,
            sales: data.salesDynamics[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const exportPDF = () => {
        const input = reportRef.current;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save("report-analytics.pdf");
        });
    };

    if (!data) return <div className="text-center py-5">Загрузка аналитики...</div>;

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">📊 Аналитическая панель</h2>
                <button className="btn btn-danger shadow-sm" onClick={exportPDF}>
                    <i className="bi bi-file-earmark-pdf me-2"></i>Скачать отчет PDF
                </button>
            </div>

            <div ref={reportRef} className="p-4 bg-white rounded shadow-sm">
                {/* Карточки */}
                <div className="row g-3 mb-4 text-center">
                    <div className="col-md-3">
                        <div className="card border-0 bg-primary text-white p-3 shadow-sm h-100">
                            <small className="opacity-75">Выручка</small>
                            <h4 className="fw-bold">{data.totalRevenue?.toLocaleString()} BYN</h4>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 bg-success text-white p-3 shadow-sm h-100">
                            <small className="opacity-75">Всего заказов</small>
                            <h4 className="fw-bold">{data.totalOrders}</h4>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 bg-info text-white p-3 shadow-sm h-100">
                            <small className="opacity-75">Средний чек</small>
                            <h4 className="fw-bold">{data.averageCheck?.toFixed(2)} BYN</h4>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 bg-warning text-dark p-3 shadow-sm h-100">
                            <small className="opacity-75">Прогноз на мес.</small>
                            <h4 className="fw-bold">{(data.totalRevenue * 1.15).toFixed(0)} BYN</h4>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* График Динамика спроса */}
                    <div className="col-lg-8 mb-4">
                        <div className="card border-0 shadow-sm p-4 h-100">
                            <h5 className="fw-bold mb-4">Динамика спроса</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart data={formatLineData()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="sales" stroke="#0d6efd" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* График Популярность */}
                    <div className="col-lg-4 mb-4">
                        <div className="card border-0 shadow-sm p-4 h-100">
                            <h5 className="fw-bold mb-4">Популярность моделей</h5>
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <BarChart data={data.topProducts} margin={{ bottom: 50 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            interval={0} 
                                            tick={{ fontSize: 10 }}
                                            angle={-45} 
                                            textAnchor="end"
                                            height={100} 
                                        />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#198754" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="small text-muted text-center mt-2">Рейтинг моделей товаров по объему продаж</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;