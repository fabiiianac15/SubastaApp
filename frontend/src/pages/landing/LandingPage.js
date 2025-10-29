import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 58,
    seconds: 0
  });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        let { hours, minutes, seconds } = prevTime;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAcceptCookies = () => {
    setShowCookieBanner(false);
    localStorage.setItem('cookiesAccepted', 'true');
  };

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (cookiesAccepted === 'true') {
      setShowCookieBanner(false);
    }
  }, []);

  return (
    <div className="landing-page">
      {/* Header/Navbar */}
      <header className="landing-header">
        <div className="landing-container">
          <div className="landing-nav">
            <div className="landing-logo">
              <div className="logo-icon">
                <div className="logo-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
                    <polyline points="7.5 19.79 7.5 14.6 3 12"/>
                    <polyline points="21 12 16.5 14.6 16.5 19.79"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
              </div>
              <div className="logo-text">
                <span className="logo-brand">SUBASTAPP</span>
              </div>
            </div>

            <nav className="landing-menu">
              <a href="#hogar" className="menu-item active">Hogar</a>
              <a href="#acerca" className="menu-item">Acerca de</a>
              <a href="#navegar" className="menu-item">Navegar</a>
              <a href="#blog" className="menu-item">Blog</a>
              <a href="#contacto" className="menu-item">Contacto</a>
              <div className="language-selector">
                <span>Inglés</span>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </nav>

            <div className="landing-actions">
              <div className="favorites-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="badge-count">0</span>
              </div>
              <button className="btn-panel" onClick={() => navigate('/dashboard')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
                </svg>
                Panel
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="hero-content">
            <div className="hero-left">
              <h1 className="hero-title">
                Plataforma De<br/>
                Subastas <br/>
              </h1>
              <p className="hero-subtitle">
                Revolucionando La Excelencia En Las Licitaciones: Donde<br/>
                Cada Segundo Valioso Cuenta
              </p>
              <div className="hero-buttons">
                <button className="btn-start" onClick={() => navigate('/auth')}>
                  Empieza Ahora
                </button>
                <button className="btn-about" onClick={() => navigate('/auth')}>
                  Sobre Nosotros
                </button>
              </div>
            </div>

            <div className="hero-right">
              {/* User Avatars */}
              <div className="user-avatars">
                <div className="avatar avatar-1">
                  <div className="avatar-circle" style={{background: 'linear-gradient(135deg, #fbbf24, #f59e0b)'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                </div>
                <div className="avatar avatar-2">
                  <div className="avatar-circle" style={{background: 'linear-gradient(135deg, #94a3b8, #64748b)'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                </div>
                <div className="avatar avatar-3">
                  <div className="avatar-circle" style={{background: 'linear-gradient(135deg, #ec4899, #db2777)'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Product Card */}
              <div className="product-card">
                {/* Product Images Stack */}
                <div className="product-images">
                  <div className="product-image-item image-back">
                    <div className="image-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="#64748b">
                        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 11l2.5 3.01L15 10l4 5H5l4-4z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="product-image-item image-middle">
                    <div className="image-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="#64748b">
                        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 11l2.5 3.01L15 10l4 5H5l4-4z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="product-image-item image-front">
                    <div className="excavator-image">
                      {/* Excavator SVG Illustration */}
                      <svg viewBox="0 0 200 140" fill="none" className="excavator-svg">
                        {/* Excavator Body */}
                        <rect x="100" y="80" width="60" height="35" fill="#FFA500" rx="3"/>
                        <rect x="105" y="85" width="15" height="10" fill="#1a1a1a" rx="2"/>
                        
                        {/* Excavator Arm */}
                        <rect x="75" y="70" width="35" height="8" fill="#FFA500" rx="2" transform="rotate(-30 75 70)"/>
                        <rect x="50" y="48" width="35" height="8" fill="#FFA500" rx="2" transform="rotate(-60 50 48)"/>
                        
                        {/* Excavator Bucket */}
                        <path d="M 30 35 L 20 45 L 25 50 L 35 40 Z" fill="#2a2a2a"/>
                        <path d="M 20 45 L 15 48 L 18 52 L 25 50 Z" fill="#1a1a1a"/>
                        
                        {/* Tracks */}
                        <rect x="95" y="115" width="70" height="18" fill="#2a2a2a" rx="9"/>
                        <circle cx="102" cy="124" r="6" fill="#1a1a1a"/>
                        <circle cx="120" cy="124" r="6" fill="#1a1a1a"/>
                        <circle cx="138" cy="124" r="6" fill="#1a1a1a"/>
                        <circle cx="156" cy="124" r="6" fill="#1a1a1a"/>
                        
                        {/* Details */}
                        <circle cx="92" cy="74" r="3" fill="#666"/>
                        <circle cx="55" cy="52" r="3" fill="#666"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="product-info">
                  <div className="product-header">
                    <h3 className="product-title">Large Excavator</h3>
                    <span className="product-price">$478</span>
                  </div>

                  <div className="product-stats">
                    <div className="stat-item">
                      <span className="stat-label">HIGHEST BID</span>
                      <div className="stat-value">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="#10b981">
                          <polygon points="5,0 10,10 0,10"/>
                        </svg>
                        <span>$145</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">TOTAL BIDS</span>
                      <div className="stat-value">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span>478</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">TIME LEFT</span>
                      <div className="stat-value">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>{timeLeft.hours}h {timeLeft.minutes}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="product-actions">
                    <button className="btn-bid-now" onClick={() => navigate('/auth')}>
                      Bid Now
                    </button>
                    <button className="btn-favorite">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Effects */}
        <div className="hero-bg-effects">
          <div className="glow-effect glow-1"></div>
          <div className="glow-effect glow-2"></div>
        </div>
      </section>

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="cookie-banner">
          <div className="cookie-content">
            <p>
              Utilizamos cookies para mejorar tu experiencia de navegación, ofrecer anuncios o contenidos personalizados y analizar nuestro tráfico. Al hacer clic en "Aceptar", das tu consentimiento para que utilicemos cookies.
              <a href="#" className="cookie-link">Aprende más</a>
            </p>
            <button className="btn-accept-cookies" onClick={handleAcceptCookies}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
