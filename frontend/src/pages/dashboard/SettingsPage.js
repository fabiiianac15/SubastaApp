import React, { useEffect, useMemo, useState } from 'react';
import { FaBell, FaGlobe, FaLock, FaMoon, FaSun, FaWallet } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const SettingsPage = () => {
  const { user } = useAuth();
  const key = useMemo(() => user?._id ? `prefs_${user._id}` : 'prefs_guest', [user]);
  const [prefs, setPrefs] = useState({
    theme: 'light', // 'light' | 'dark'
    language: 'es', // 'es' | 'en'
    currency: 'COP', // 'COP' | 'USD'
    notifications: {
      bids: true,
      outbid: true,
      wins: true,
      newsletter: false
    },
    privacy: {
      showProfile: true,
      showStats: false
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setPrefs(JSON.parse(saved));
    } catch {}
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(prefs));
    // Opcional: aplicar tema al body
    document.body.dataset.theme = prefs.theme;
  }, [key, prefs]);

  const toggle = (path) => {
    setPrefs(prev => {
      const next = { ...prev };
      const [group, field] = path.split('.');
      next[group][field] = !prev[group][field];
      return next;
    });
  };

  return (
    <Layout currentPage="settings">
      <div className="modern-dashboard">
        <div className="stats-overview">
          <div className="stats-header">
            <h2>Configuración y Preferencias</h2>
          </div>
          <div className="stats-grid">
            {/* Tema */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                {prefs.theme === 'light' ? <FaSun/> : <FaMoon/>}
              </div>
              <div className="stat-content">
                <h3>Tema</h3>
                <p>Elige entre claro u oscuro</p>
                <div className="time-filter">
                  <button className={prefs.theme === 'light' ? 'active' : ''} onClick={() => setPrefs(p => ({ ...p, theme: 'light' }))}>Claro</button>
                  <button className={prefs.theme === 'dark' ? 'active' : ''} onClick={() => setPrefs(p => ({ ...p, theme: 'dark' }))}>Oscuro</button>
                </div>
              </div>
            </div>

            {/* Idioma */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
                <FaGlobe/>
              </div>
              <div className="stat-content">
                <h3>Idioma</h3>
                <p>Selecciona tu idioma preferido</p>
                <div className="time-filter">
                  <button className={prefs.language === 'es' ? 'active' : ''} onClick={() => setPrefs(p => ({ ...p, language: 'es' }))}>Español</button>
                  <button className={prefs.language === 'en' ? 'active' : ''} onClick={() => setPrefs(p => ({ ...p, language: 'en' }))}>English</button>
                </div>
              </div>
            </div>

            {/* Moneda */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)' }}>
                <FaWallet/>
              </div>
              <div className="stat-content">
                <h3>Moneda</h3>
                <p>Formato de precios</p>
                <div className="time-filter">
                  <button className={prefs.currency === 'COP' ? 'active' : ''} onClick={() => setPrefs(p => ({ ...p, currency: 'COP' }))}>COP</button>
                  <button className={prefs.currency === 'USD' ? 'active' : ''} onClick={() => setPrefs(p => ({ ...p, currency: 'USD' }))}>USD</button>
                </div>
              </div>
            </div>

            {/* Notificaciones */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                <FaBell/>
              </div>
              <div className="stat-content">
                <h3>Notificaciones</h3>
                <p>Elige qué eventos te notificamos</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <label><input type="checkbox" checked={prefs.notifications.bids} onChange={() => toggle('notifications.bids')}/> Nuevas ofertas en subastas seguidas</label>
                  <label><input type="checkbox" checked={prefs.notifications.outbid} onChange={() => toggle('notifications.outbid')}/> Me superan en mi oferta</label>
                  <label><input type="checkbox" checked={prefs.notifications.wins} onChange={() => toggle('notifications.wins')}/> Gané una subasta</label>
                  <label><input type="checkbox" checked={prefs.notifications.newsletter} onChange={() => toggle('notifications.newsletter')}/> Newsletter</label>
                </div>
              </div>
            </div>

            {/* Privacidad */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                <FaLock/>
              </div>
              <div className="stat-content">
                <h3>Privacidad</h3>
                <p>Controla tu visibilidad</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <label><input type="checkbox" checked={prefs.privacy.showProfile} onChange={() => toggle('privacy.showProfile')}/> Mostrar mi perfil público</label>
                  <label><input type="checkbox" checked={prefs.privacy.showStats} onChange={() => toggle('privacy.showStats')}/> Mostrar mis estadísticas</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
