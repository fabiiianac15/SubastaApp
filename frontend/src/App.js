import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthPage from './pages/auth/AuthPage';
import WelcomePage from './pages/dashboard/WelcomePage';
import AuctionsPage from './pages/dashboard/AuctionsPage';
import CreateAuctionPage from './pages/dashboard/CreateAuctionPage';
import MyAuctionsPage from './pages/dashboard/MyAuctionsPage';
import MyBidsPage from './pages/dashboard/MyBidsPage';
import FavoritesPage from './pages/dashboard/FavoritesPage';
import StatsPage from './pages/dashboard/StatsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Ruta por defecto - redirige a auth */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            
            {/* Ruta de autenticación */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Rutas protegidas */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <WelcomePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/auctions" 
              element={
                <ProtectedRoute>
                  <AuctionsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/create" 
              element={
                <ProtectedRoute>
                  <CreateAuctionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/my-auctions" 
              element={
                <ProtectedRoute>
                  <MyAuctionsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/my-bids" 
              element={
                <ProtectedRoute>
                  <MyBidsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/favorites" 
              element={
                <ProtectedRoute>
                  <FavoritesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/stats" 
              element={
                <ProtectedRoute>
                  <StatsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Ruta para usuarios no autorizados */}
            <Route 
              path="/unauthorized" 
              element={
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100vh',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textAlign: 'center',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  <h1>Acceso No Autorizado</h1>
                  <p>No tienes permisos para acceder a esta página</p>
                  <button 
                    onClick={() => window.history.back()}
                    style={{
                      background: 'white',
                      color: '#667eea',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Volver
                  </button>
                </div>
              } 
            />
            
            {/* Ruta 404 */}
            <Route 
              path="*" 
              element={
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100vh',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textAlign: 'center',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  <h1>404 - Página No Encontrada</h1>
                  <p>La página que buscas no existe</p>
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    style={{
                      background: 'white',
                      color: '#667eea',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Ir al Dashboard
                  </button>
                </div>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;