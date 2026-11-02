import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaBars, FaBell, FaCamera, FaChartBar, FaChevronLeft, FaCog, FaEye, FaHandHolding, FaHeart, FaHome,
  FaListAlt, FaMagic, FaPlus, FaSearch, FaSignOutAlt, FaUser, FaWaveSquare,
} from 'react-icons/fa';
import { useAuth, useAuthActions } from '../../context/AuthContext';
import ProfileModal from '../profile/ProfileModal';
import NotificationPanel from '../common/NotificationPanel';
import Dialog from '../ui/Dialog';
import { Logo } from '../ui/Gavel';
import notificationService from '../../services/notificationService';
import { dur, ease, spring } from '../../lib/motion';
import '../ui/ui.css';
import '../../styles/shell.css';

const buildNav = (tipo) => [
  { icon: FaHome, label: 'Inicio', to: '/dashboard', end: true, primary: true },
  { icon: FaEye, label: 'Explorar', to: '/dashboard/auctions', primary: true },
  ...(tipo === 'vendedor'
    ? [
        { icon: FaPlus, label: 'Crear subasta', short: 'Crear', to: '/dashboard/create', primary: true },
        { icon: FaListAlt, label: 'Mis subastas', short: 'Subastas', to: '/dashboard/my-auctions', primary: true },
      ]
    : [{ icon: FaHandHolding, label: 'Mis pujas', short: 'Pujas', to: '/dashboard/my-bids', primary: true }]),
  { icon: FaHeart, label: 'Favoritos', to: '/dashboard/favorites', primary: tipo !== 'vendedor' },
  { icon: FaMagic, label: 'Para ti', to: '/dashboard/recommendations' },
  { icon: FaChartBar, label: 'Estadísticas', to: '/dashboard/stats' },
  { icon: FaWaveSquare, label: 'Mi actividad', to: '/dashboard/analytics-stats' },
  { icon: FaCog, label: 'Ajustes', to: '/dashboard/settings' },
];

const readStored = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const Avatar = ({ user, image }) => (
  <span className="avatar">
    {image ? <img src={image} alt="" /> : `${user?.nombre?.charAt(0) || ''}${user?.apellido?.charAt(0) || ''}`}
  </span>
);

const Layout = () => {
  const { user } = useAuth();
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(() => readStored('sidebarOpen', 'false') === 'true');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const fileRef = useRef(null);
  const menuRef = useRef(null);
  const nav = buildNav(user?.tipoUsuario);

  useEffect(() => {
    try {
      localStorage.setItem('sidebarOpen', String(open));
    } catch {
      /* preferencia solo de esta sesión */
    }
  }, [open]);

  useEffect(() => {
    const load = () => setProfileImage(readStored(`profileImage_${user?._id}`, null));
    load();
    window.addEventListener('profile-image', load);
    return () => window.removeEventListener('profile-image', load);
  }, [user?._id]);

  useEffect(() => {
    if (!user) return undefined;
    const load = async () => {
      try {
        const res = await notificationService.obtenerContadorNoLeidas();
        setUnread(res.data?.contador || 0);
      } catch (error) {
        console.error('Error cargando contador:', error);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileNav(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // "/" lleva a la búsqueda salvo que ya se esté escribiendo.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(`/dashboard/auctions${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        localStorage.setItem(`profileImage_${user._id}`, reader.result);
      } catch {
        /* imagen demasiado grande para guardarla: se usa solo en esta sesión */
      }
      setProfileImage(reader.result);
      window.dispatchEvent(new Event('profile-image'));
    };
    reader.readAsDataURL(file);
    setMenuOpen(false);
  };

  const handleNotification = (n) => {
    setNotifOpen(false);
    const tipo = n.accion?.tipo;
    if (tipo === 'ver_subasta') navigate('/dashboard/auctions');
    else if (tipo === 'ver_puja' || tipo === 'pagar') navigate('/dashboard/my-bids');
  };

  return (
    <div className={`shell ${open ? 'is-open' : ''}`}>
      <aside className="rail" aria-label="Navegación principal">
        <div className="rail__head">
          <Link to="/" className="rail__logo" aria-label="SubastApp, página pública"><Logo withText={open} /></Link>
        </div>
        <nav className="rail__nav">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="rail__link" aria-label={open ? undefined : item.label}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="rail-active" className="rail__active" transition={spring.ui} />}
                  <item.icon size={18} className="rail__icon" />
                  {open && <span className="rail__label">{item.label}</span>}
                  {!open && <span className="rail__tip" role="tooltip">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="rail__foot">
          <button type="button" className="rail__link" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? 'Contraer menú' : 'Expandir menú'}>
            <motion.span className="rail__icon" animate={{ rotate: open ? 0 : 180 }} transition={spring.ui} style={{ display: 'grid' }}>
              <FaChevronLeft size={15} />
            </motion.span>
            {open && <span className="rail__label">Contraer</span>}
            {!open && <span className="rail__tip" role="tooltip">Expandir</span>}
          </button>
        </div>
      </aside>

      <div className="shell__main">
        <header className="topbar">
          <Link to="/dashboard" className="topbar__logo" aria-label="Inicio"><Logo withText={false} /></Link>
          <form className="search" role="search" onSubmit={handleSearch}>
            <FaSearch size={15} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar lotes"
              aria-label="Buscar subastas"
            />
            <kbd aria-hidden="true">/</kbd>
          </form>
          <div className="topbar__right">
            <button type="button" className="icon-btn" onClick={() => setNotifOpen(true)} aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`}>
              <FaBell size={18} />
              <AnimatePresence>
                {unread > 0 && (
                  <motion.span key="badge" className="badge tnum" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={spring.ui}>
                    {unread > 99 ? '99+' : unread}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <div className="usermenu" ref={menuRef}>
              <button type="button" className="usermenu__btn" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={menuOpen}>
                <Avatar user={user} image={profileImage} />
                <span className="usermenu__id">
                  <strong>{user?.nombre}</strong>
                  <small>{user?.tipoUsuario === 'vendedor' ? 'Vendedor' : 'Comprador'}</small>
                </span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className="popover"
                    role="menu"
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
                    transition={{ duration: dur.fast, ease: ease.out }}
                  >
                    <div className="popover__who">
                      <strong>{user?.nombre} {user?.apellido}</strong>
                      <small>{user?.email}</small>
                    </div>
                    <button role="menuitem" type="button" className="popover__item" onClick={() => { setProfileOpen(true); setMenuOpen(false); }}><FaUser size={14} /> Ver perfil</button>
                    <button role="menuitem" type="button" className="popover__item" onClick={() => fileRef.current?.click()}><FaCamera size={14} /> Cambiar foto</button>
                    <Link role="menuitem" className="popover__item" to="/dashboard/settings"><FaCog size={14} /> Ajustes</Link>
                    <button role="menuitem" type="button" className="popover__item popover__item--danger" onClick={handleLogout}><FaSignOutAlt size={14} /> Cerrar sesión</button>
                  </motion.div>
                )}
              </AnimatePresence>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
            </div>
          </div>
        </header>

        <main className="content">
          {/* Solo entrada: cambiar de sección no debe esperar a una salida. */}
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.ui, ease: ease.out }}>
            <Outlet />
          </motion.div>
        </main>
      </div>

      <nav className="tabbar" aria-label="Navegación móvil">
        {nav.filter((i) => i.primary).slice(0, 4).map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="tabbar__item">
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="tab-active" className="tabbar__active" transition={spring.ui} />}
                <item.icon size={18} />
                <span>{item.short || item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button type="button" className="tabbar__item" onClick={() => setMobileNav(true)} aria-haspopup="dialog">
          <FaBars size={18} />
          <span>Más</span>
        </button>
      </nav>

      <Dialog open={mobileNav} onClose={() => setMobileNav(false)} label="Más secciones">
        <div className="dialog__scroll">
          <ul className="sheetnav">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className="sheetnav__item" onClick={() => setMobileNav(false)}>
                  <item.icon size={18} /> {item.label}
                </NavLink>
              </li>
            ))}
            <li><button type="button" className="sheetnav__item popover__item--danger" onClick={handleLogout}><FaSignOutAlt size={18} /> Cerrar sesión</button></li>
          </ul>
        </div>
      </Dialog>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} onNotificationClick={handleNotification} onCountChange={setUnread} />
    </div>
  );
};

export default Layout;
