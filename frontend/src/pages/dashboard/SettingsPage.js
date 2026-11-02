import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Segmented, Switch } from '../../components/ui/Controls';
import { getTheme, setTheme } from '../../lib/theme';

const DEFAULTS = {
  language: 'es',
  currency: 'COP',
  notifications: { bids: true, outbid: true, wins: true, newsletter: false },
  privacy: { showProfile: true, showStats: false },
};

const read = (key) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved ? { ...DEFAULTS, ...saved } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

const Row = ({ title, hint, children }) => (
  <div className="setting">
    <div className="setting__text"><strong>{title}</strong>{hint && <small>{hint}</small>}</div>
    {children}
  </div>
);

const SettingsPage = () => {
  const { user } = useAuth();
  const key = useMemo(() => (user?._id ? `prefs_${user._id}` : 'prefs_guest'), [user]);
  const [prefs, setPrefs] = useState(() => read(key));
  const [theme, setThemeState] = useState(getTheme);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(prefs));
    } catch {
      /* preferencias solo de esta sesión */
    }
  }, [key, prefs]);

  const toggle = (group, field) => setPrefs((p) => ({ ...p, [group]: { ...p[group], [field]: !p[group][field] } }));

  const onTheme = (value, e) => {
    setThemeState(value);
    const r = e.currentTarget.getBoundingClientRect();
    setTheme(value, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <div className="page">
      <header className="page-head"><h1 className="display">Ajustes</h1></header>
      <div className="settings">
        <section className="panel" aria-labelledby="set-look">
          <h2 id="set-look" className="display">Apariencia y región</h2>
          <Row title="Tema" hint="Se guarda en este navegador.">
            <Segmented id="theme" label="Tema" value={theme} onChange={onTheme} options={[{ value: 'dark', label: 'Oscuro' }, { value: 'light', label: 'Claro' }]} />
          </Row>
          <Row title="Idioma" hint="Cambia el formato de los números.">
            <Segmented id="lang" label="Idioma" value={prefs.language} onChange={(v) => setPrefs((p) => ({ ...p, language: v }))} options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} />
          </Row>
          <Row title="Moneda" hint="Cambia el símbolo. No convierte los valores.">
            <Segmented id="cur" label="Moneda" value={prefs.currency} onChange={(v) => setPrefs((p) => ({ ...p, currency: v }))} options={[{ value: 'COP', label: 'COP' }, { value: 'USD', label: 'USD' }]} />
          </Row>
        </section>
        <section className="panel" aria-labelledby="set-notif">
          <h2 id="set-notif" className="display">Notificaciones</h2>
          <Row title="Nuevas ofertas en subastas que sigues"><Switch label="Nuevas ofertas" checked={prefs.notifications.bids} onChange={() => toggle('notifications', 'bids')} /></Row>
          <Row title="Cuando superan mi oferta"><Switch label="Cuando superan mi oferta" checked={prefs.notifications.outbid} onChange={() => toggle('notifications', 'outbid')} /></Row>
          <Row title="Cuando gano una subasta"><Switch label="Cuando gano" checked={prefs.notifications.wins} onChange={() => toggle('notifications', 'wins')} /></Row>
          <Row title="Boletín"><Switch label="Boletín" checked={prefs.notifications.newsletter} onChange={() => toggle('notifications', 'newsletter')} /></Row>
        </section>
        <section className="panel" aria-labelledby="set-priv">
          <h2 id="set-priv" className="display">Privacidad</h2>
          <Row title="Perfil público"><Switch label="Perfil público" checked={prefs.privacy.showProfile} onChange={() => toggle('privacy', 'showProfile')} /></Row>
          <Row title="Mostrar mis estadísticas"><Switch label="Mostrar estadísticas" checked={prefs.privacy.showStats} onChange={() => toggle('privacy', 'showStats')} /></Row>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
