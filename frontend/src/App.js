import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import LandingPage from './pages/landing/LandingPage';
import AuthPage from './pages/auth/AuthPage';
import WelcomePage from './pages/dashboard/WelcomePage';
import AuctionsPage from './pages/dashboard/AuctionsPage';
import CreateAuctionPage from './pages/dashboard/CreateAuctionPage';
import MyAuctionsPage from './pages/dashboard/MyAuctionsPage';
import MyBidsPage from './pages/dashboard/MyBidsPage';
import FavoritesPage from './pages/dashboard/FavoritesPage';
import StatsPage from './pages/dashboard/StatsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import RecommendationsPage from './pages/dashboard/RecommendationsPage';
import AnalyticsStatsPage from './pages/dashboard/AnalyticsStatsPage';
import Gavel from './components/ui/Gavel';
import './styles/pages.css';

const StatusScreen = ({ code, title, text, to = '/', cta }) => (
  <main className="status-screen">
    <Gavel size={72} className="status-screen__art" />
    <h1 className="display">{code ? `${code}. ` : ''}{title}</h1>
    <p className="muted">{text}</p>
    <Link className="btn btn--primary btn--lg" to={to}>{cta}</Link>
  </main>
);

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* El marco vive fuera de las páginas: conserva su estado y su indicador activo entre rutas. */}
            <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<WelcomePage />} />
              <Route path="auctions" element={<AuctionsPage />} />
              <Route path="create" element={<CreateAuctionPage />} />
              <Route path="my-auctions" element={<MyAuctionsPage />} />
              <Route path="my-bids" element={<MyBidsPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="recommendations" element={<RecommendationsPage />} />
              <Route path="analytics-stats" element={<AnalyticsStatsPage />} />
            </Route>
            <Route
              path="/unauthorized"
              element={<StatusScreen title="Sin acceso" text="No tienes permisos para abrir esta página." to="/dashboard" cta="Volver al inicio" />}
            />
            <Route
              path="*"
              element={<StatusScreen code="404" title="Lote no encontrado" text="Esta página no existe o ya se adjudicó." cta="Ir al inicio" />}
            />
          </Routes>
        </Router>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
