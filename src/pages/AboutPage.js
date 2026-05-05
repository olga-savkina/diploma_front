import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="container my-5" style={{ lineHeight: '1.7', color: '#333' }}>
      {/* Хлебные крошки */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/" className="text-decoration-none" style={{ color: '#ff4081' }}>Главная</Link></li>
          <li className="breadcrumb-item active fw-bold" aria-current="page">О магазине</li>
        </ol>
      </nav>

      <h1 className="text-center mb-5 fw-bold" style={{ color: '#ff4081' }}>
        BabyBoom — ваш надёжный магазин для мам и малышей
      </h1>

      {/* История */}
      <section className="mb-5">
        <h2 className="h3 mb-3" style={{ color: '#ff1744' }}>Наша история</h2>
        <p className="lead">
          BabyBoom был основан в 2018 году мамой двоих детей, которая не могла найти в одном месте всё необходимое для малышей — качественное, безопасное и по честной цене.
        </p>
        <p>
          Сегодня мы — один из самых любимых магазинов для родителей в Беларуси. Более 150 000 счастливых мам и пап выбрали нас! Мы тщательно отбираем каждый товар, прежде чем он попадет на наши полки.
        </p>
      </section>

      {/* Почему выбирают нас */}
      <section className="mb-5">
        <h2 className="h3 mb-4 text-center" style={{ color: '#ff1744' }}>
          Почему мамы выбирают BabyBoom?
        </h2>
        <div className="row g-4">
          {[
            { icon: 'bi-patch-check', title: 'Только оригинал', text: 'Прямые контракты с Pampers, NAN, Chicco.' },
            { icon: 'bi-truck', title: 'Быстрая доставка', text: 'Минск — завтра, РБ — до 3 дней. Бесплатно от 150 BYN.' },
            { icon: 'bi-shield-check', title: 'Безопасность', text: '14 дней на возврат и проверка при получении.' },
            { icon: 'bi-heart-fill', title: 'С любовью', text: 'Подарки и бонусы для постоянных клиентов.' },
            { icon: 'bi-file-earmark-medical', title: 'Сертификаты', text: 'Все товары соответствуют стандартам ЕАЭС.' },
            { icon: 'bi-clock-history', title: 'Поддержка 24/7', text: 'Принимаем заказы круглосуточно.' }
          ].map((item, i) => (
            <div key={i} className="col-md-4 col-sm-6 text-center">
              <div className="p-4 h-100 border-0 shadow-sm rounded-4 bg-white border-top border-5" style={{ borderColor: '#ff4081 !important' }}>
                <i className={`bi ${item.icon} display-4 mb-3`} style={{ color: '#ff4081' }}></i>
                <h5 className="fw-bold mb-2">{item.title}</h5>
                <p className="small text-muted mb-0">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Контакты и карта */}
      <section className="mb-5">
        <h2 className="h3 mb-4" style={{ color: '#ff1744' }}>Наш магазин в Минске</h2>
        <div className="row g-4 align-items-center">
          <div className="col-lg-7">
            <div className="rounded-4 overflow-hidden shadow-sm">
                <iframe
                title="Карта BabyBoom"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2350.564756852928!2d27.481977777174623!3d53.90807097245842!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46dbdb0276602325%3A0x679c656911c034!2z0KLQoNCmINCi0LjQstCw0LvQuA!5e0!3m2!1sru!2sby!4v1715000000000"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                ></iframe>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="p-4 bg-light rounded-4">
                <h4 style={{ color: '#ff4081' }} className="fw-bold"><i className="bi bi-geo-alt me-2"></i>Адрес:</h4>
                <p>г. Минск, ул. Притыцкого, 29, ТРЦ "Тивали", 2 этаж</p>

                <h4 style={{ color: '#ff4081' }} className="fw-bold mt-4"><i className="bi bi-clock me-2"></i>График:</h4>
                <p>Пн–Вс: 10:00 – 22:00 (без выходных)</p>

                <h4 style={{ color: '#ff4081' }} className="fw-bold mt-4"><i className="bi bi-telephone me-2"></i>Связь:</h4>
                <p className="mb-1">Тел: <a href="tel:+375291234567" className="text-dark fw-bold text-decoration-none">+375 (29) 123-45-67</a></p>
                <p>Email: <a href="mailto:info@babyboom.by" className="text-dark text-decoration-none">info@babyboom.by</a></p>
                
                <div className="mt-4">
                    <span href="#" className="btn btn-outline-danger btn-sm rounded-pill me-2"><i className="bi bi-instagram"></i> Instagram</span>
                    <span href="#" className="btn btn-outline-primary btn-sm rounded-pill"><i className="bi bi-telegram"></i> Telegram</span>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Финальный баннер */}
      <div className="text-white p-5 rounded-5 text-center shadow-lg" 
           style={{ background: 'linear-gradient(135deg, #ff4081 0%, #ff1744 100%)' }}>
        <h2 className="display-6 fw-bold mb-3">Мы работаем, чтобы вы улыбались</h2>
        <p className="lead mb-0">Спасибо, что выбираете BabyBoom — место, где забота о детях начинается с любви.</p>
      </div>
    </div>
  );
};

export default AboutPage;