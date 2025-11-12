import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaPause, 
  FaPlay, 
  FaStop,
  FaChartLine,
  FaUsers,
  FaClock,
  FaDollarSign,
  FaFilter,
  FaSort
} from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import productService from '../../services/productService';
import CreateAuctionModal from '../../components/auctions/CreateAuctionModal';
import Swal from 'sweetalert2';
import './MyAuctionsPage.css';

const MyAuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    estado: 'todas',
    ordenar: '-createdAt'
  });
  const [editingAuction, setEditingAuction] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await productService.obtenerMisSubastas(filters);
      setAuctions(response.data || []);
      setStats(response.estadisticas || {});
    } catch (error) {
      console.error('Error loading auctions:', error);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const changeAuctionStatus = async (auctionId, newStatus) => {
    try {
      await productService.cambiarEstadoSubasta(auctionId, newStatus);
      await loadData();
      Swal.fire({
        title: '¡Estado Actualizado!',
        text: `La subasta ahora está ${newStatus}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo cambiar el estado',
        icon: 'error'
      });
    }
  };

  const handleDelete = async (auction) => {
    // Verificar si hay ofertas
    if (auction.numeroOfertas > 0) {
      const confirmResult = await Swal.fire({
        title: '⚠️ Esta subasta tiene ofertas',
        html: `
          <p>Esta subasta tiene <strong>${auction.numeroOfertas} oferta(s)</strong>.</p>
          <p>Al eliminarla, también se eliminarán todas las ofertas asociadas.</p>
          <p><strong>¿Estás seguro de que deseas continuar?</strong></p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar todo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        focusCancel: true
      });

      if (!confirmResult.isConfirmed) {
        return;
      }

      // Segunda confirmación
      const finalResult = await Swal.fire({
        title: '¿Estás completamente seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar definitivamente',
        cancelButtonText: 'No, conservar',
        confirmButtonColor: '#e53e3e'
      });

      if (!finalResult.isConfirmed) {
        return;
      }

      try {
        // Forzar eliminación aunque haya ofertas
        await productService.eliminarSubasta(auction._id, true);
        await loadData();
        Swal.fire({
          title: 'Eliminada',
          text: 'La subasta y todas sus ofertas fueron eliminadas',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'No se pudo eliminar la subasta',
          icon: 'error'
        });
      }
    } else {
      // Si no hay ofertas, confirmación simple
      const result = await Swal.fire({
        title: '¿Eliminar subasta?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e53e3e'
      });

      if (result.isConfirmed) {
        try {
          await productService.eliminarSubasta(auction._id);
          await loadData();
          Swal.fire({
            title: 'Eliminada',
            text: 'La subasta fue eliminada exitosamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo eliminar la subasta',
            icon: 'error'
          });
        }
      }
    }
  };

  const handleEdit = (auction) => {
    console.log('=== DEBUG EDICIÓN ===');
    console.log('Subasta a editar:', auction);
    console.log('ID de la subasta:', auction._id);
    console.log('Tipo de ID:', typeof auction._id);
    console.log('Longitud del ID:', auction._id?.length);
    
    setEditingAuction(auction);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingAuction(null);
  };

  const handleModalSuccess = () => {
    loadData();
    handleModalClose();
  };

  const getStatusColor = (status) => {
    const colors = {
      borrador: '#718096',
      activo: '#38a169',
      pausado: '#ed8936',
      finalizado: '#3182ce',
      cancelado: '#e53e3e'
    };
    return colors[status] || '#718096';
  };

  const getStatusActions = (auction) => {
    const actions = [];
    
    switch (auction.estado) {
      case 'borrador':
        actions.push({ 
          icon: FaPlay, 
          label: 'Activar', 
          color: '#38a169',
          action: () => changeAuctionStatus(auction._id, 'activo')
        });
        break;
      case 'activo':
        actions.push({ 
          icon: FaPause, 
          label: 'Pausar', 
          color: '#ed8936',
          action: () => changeAuctionStatus(auction._id, 'pausado')
        });
        actions.push({ 
          icon: FaStop, 
          label: 'Finalizar', 
          color: '#3182ce',
          action: () => changeAuctionStatus(auction._id, 'finalizado')
        });
        break;
      case 'pausado':
        actions.push({ 
          icon: FaPlay, 
          label: 'Reanudar', 
          color: '#38a169',
          action: () => changeAuctionStatus(auction._id, 'activo')
        });
        break;
    }
    
    return actions;
  };

  const AuctionCard = ({ auction }) => {
    const STATIC_BASE = (process.env.REACT_APP_API_URL?.replace('/api','')) || 'http://localhost:5000';
    const timeRemaining = productService.calcularTiempoRestante(auction.fechaFin);
    const statusActions = getStatusActions(auction);
    
    return (
      <motion.div
        className="my-auction-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
      >
        <div className="auction-image-section">
          {auction.imagenes && auction.imagenes.length > 0 ? (
            <img
              src={auction.imagenes[0].url?.startsWith('http') 
                ? auction.imagenes[0].url 
                : `${STATIC_BASE}${auction.imagenes[0].url}`}
              alt={auction.titulo}
              className="auction-image"
              onError={(e) => { e.target.src = '/logo512.png'; }}
            />
          ) : (
            <div className="auction-placeholder">
              <FaEye />
            </div>
          )}
          
          <div 
            className="status-badge" 
            style={{ backgroundColor: getStatusColor(auction.estado) }}
          >
            {auction.estado}
          </div>
        </div>
        
        <div className="auction-details">
          <h3 className="auction-title">{auction.titulo}</h3>
          <p className="auction-category">{auction.categoria}</p>
          
          <div className="auction-metrics">
            <div className="metric">
              <FaDollarSign />
              <div>
                <span className="metric-value">
                  {productService.formatearMoneda(auction.precioActual || auction.precioInicial)}
                </span>
                <span className="metric-label">Precio actual</span>
              </div>
            </div>
            
            <div className="metric">
              <FaUsers />
              <div>
                <span className="metric-value">{auction.numeroOfertas || 0}</span>
                <span className="metric-label">Ofertas</span>
              </div>
            </div>
            
            <div className="metric">
              <FaEye />
              <div>
                <span className="metric-value">{auction.vistas || 0}</span>
                <span className="metric-label">Vistas</span>
              </div>
            </div>
            
            {timeRemaining && timeRemaining.total > 0 && (
              <div className="metric">
                <FaClock />
                <div>
                  <span className="metric-value">
                    {productService.formatearTiempo(timeRemaining)}
                  </span>
                  <span className="metric-label">Restante</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="auction-actions">
            <button className="action-btn view" title="Ver detalles">
              <FaEye />
            </button>
            
            <button 
              className="action-btn edit" 
              onClick={() => handleEdit(auction)}
              title="Editar"
            >
              <FaEdit />
            </button>
            
            {statusActions.map((action, index) => (
              <button 
                key={index}
                className="action-btn status"
                style={{ color: action.color }}
                onClick={action.action}
                title={action.label}
              >
                <action.icon />
              </button>
            ))}
            
            <button 
              className="action-btn delete" 
              onClick={() => handleDelete(auction)}
              title={auction.numeroOfertas > 0 ? `Eliminar (${auction.numeroOfertas} ofertas)` : "Eliminar"}
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const StatsCard = ({ icon: Icon, title, value, color }) => (
    <div className="stats-card">
      <div className="stats-icon" style={{ backgroundColor: color }}>
        <Icon />
      </div>
      <div className="stats-content">
        <div className="stats-value">{value}</div>
        <div className="stats-title">{title}</div>
      </div>
    </div>
  );

  return (
    <Layout currentPage="my-auctions">
      <div className="my-auctions-page">
        <div className="page-header">
          <div className="header-content">
            <h1>Mis Subastas</h1>
            <p>Gestiona y monitorea tus subastas activas</p>
          </div>
          
          <button className="create-auction-btn" onClick={() => setShowCreateModal(true)}>
            <FaPlus />
            Nueva Subasta
          </button>
        </div>

        {/* Statistics */}
        <div className="stats-section">
          <StatsCard 
            icon={FaChartLine}
            title="Total Subastas"
            value={auctions.length}
            color="#667eea"
          />
          <StatsCard 
            icon={FaPlay}
            title="Activas"
            value={auctions.filter(a => a.estado === 'activo').length}
            color="#38a169"
          />
          <StatsCard 
            icon={FaUsers}
            title="Total Ofertas"
            value={auctions.reduce((sum, a) => sum + (a.numeroOfertas || 0), 0)}
            color="#ed8936"
          />
          <StatsCard 
            icon={FaDollarSign}
            title="Valor Total"
            value={`$${auctions.reduce((sum, a) => sum + (a.precioActual || a.precioInicial || 0), 0).toLocaleString()}`}
            color="#e53e3e"
          />
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <FaFilter />
            <select 
              value={filters.estado}
              onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
            >
              <option value="todas">Todos los estados</option>
              <option value="borrador">Borradores</option>
              <option value="activo">Activas</option>
              <option value="pausado">Pausadas</option>
              <option value="finalizado">Finalizadas</option>
              <option value="cancelado">Canceladas</option>
            </select>
          </div>
          
          <div className="filter-group">
            <FaSort />
            <select 
              value={filters.ordenar}
              onChange={(e) => setFilters(prev => ({ ...prev, ordenar: e.target.value }))}
            >
              <option value="-createdAt">Más recientes</option>
              <option value="createdAt">Más antiguas</option>
              <option value="-numeroOfertas">Más ofertas</option>
              <option value="-precioActual">Mayor precio</option>
              <option value="fechaFin">Terminan pronto</option>
            </select>
          </div>
        </div>

        {/* Auctions Grid */}
        <div className="auctions-content">
          {loading ? (
            <div className="loading-grid">
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="auction-skeleton" />
              ))}
            </div>
          ) : auctions.length > 0 ? (
            <div className="auctions-grid">
              <AnimatePresence>
                {auctions.map(auction => (
                  <AuctionCard key={auction._id} auction={auction} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="no-auctions">
              <FaChartLine className="no-auctions-icon" />
              <h3>No tienes subastas</h3>
              <p>¡Crea tu primera subasta y comienza a vender!</p>
              <button className="create-first-auction-btn" onClick={() => setShowCreateModal(true)}>
                <FaPlus />
                Crear Primera Subasta
              </button>
            </div>
          )}
        </div>

        {/* Modal de Crear/Editar Subasta */}
        <CreateAuctionModal
          isOpen={showCreateModal || !!editingAuction}
          onClose={handleModalClose}
          auction={editingAuction}
          onSuccess={handleModalSuccess}
        />
      </div>
    </Layout>
  );
};

export default MyAuctionsPage;
