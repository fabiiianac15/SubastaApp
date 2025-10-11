const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const multer = require('multer');
const path = require('path');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Usar ruta absoluta para evitar problemas de cwd
    const dest = path.join(__dirname, '../uploads/products');
    cb(null, dest);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: function(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
}).array('imagenes', 5); // Máximo 5 imágenes

// @desc    Crear nueva subasta
// @route   POST /api/products
// @access  Private (Solo vendedores)
const crearProducto = async (req, res) => {
  try {
    // Primero ejecutar multer para procesar multipart/form-data
    upload(req, res, async function(err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      // Debug detallado de subida
      try {
        console.log('== CrearProducto Debug ==');
        console.log('req.user:', req.user && { id: req.user._id, tipo: req.user.tipoUsuario });
        console.log('req.files length:', req.files ? req.files.length : 0);
        if (req.files && req.files.length) {
          console.log('Archivos:', req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, filename: f.filename, size: f.size })));
        }
        console.log('req.body keys:', Object.keys(req.body));
      } catch (logErr) {
        console.log('Error logeando debug crearProducto:', logErr.message);
      }

      // Verificar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const {
        titulo,
        descripcion,
        categoria,
        precioInicial,
        porcentajeMinimo,
        fechaInicio,
        fechaFin,
        tipoSubasta,
        condiciones,
        tags,
        usuariosInvitados
      } = req.body;

      // Coerciones y saneo de datos desde FormData (strings)
      const precioInicialNum = Number(precioInicial);
      const porcentajeMinimoNum = Number(porcentajeMinimo);
      if (Number.isNaN(precioInicialNum) || precioInicialNum <= 0) {
        return res.status(400).json({ success: false, message: 'El precio inicial es inválido' });
      }
      if (Number.isNaN(porcentajeMinimoNum) || porcentajeMinimoNum < 1 || porcentajeMinimoNum > 50) {
        return res.status(400).json({ success: false, message: 'El porcentaje mínimo es inválido' });
      }

      // Procesar imágenes
      const imagenes = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          imagenes.push({
            url: `/uploads/products/${file.filename}`,
            alt: `${titulo} - imagen ${index + 1}`,
            esPortada: index === 0
          });
        });
      }

      // Calcular incremento mínimo basado en porcentaje
      const incrementoMinimo = Math.ceil(precioInicialNum * (porcentajeMinimoNum / 100));

      const producto = await Product.create({
        titulo,
        descripcion,
        categoria,
        precioInicial: precioInicialNum,
        porcentajeMinimo: porcentajeMinimoNum,
        incrementoMinimo,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        tipoSubasta: tipoSubasta || 'publica',
        imagenes,
        vendedor: req.user._id,
        condiciones,
        tags: Array.isArray(tags)
          ? tags
          : (typeof tags === 'string' && tags.length > 0
              ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
              : []),
        usuariosInvitados: usuariosInvitados || [],
        estado: new Date(fechaInicio) <= new Date() ? 'activo' : 'borrador'
      });

      res.status(201).json({
        success: true,
        message: 'Subasta creada exitosamente',
        data: producto
      });
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Obtener todas las subastas
// @route   GET /api/products
// @access  Public
const obtenerProductos = async (req, res) => {
  try {
    const {
      categoria,
      estado = 'activo',
      tipoSubasta = 'publica',
      precioMin,
      precioMax,
      busqueda,
      ordenar = '-createdAt',
      pagina = 1,
      limite = 12
    } = req.query;

    // Construir query
    let query = { tipoSubasta };

    // Solo mostrar subastas públicas o del usuario actual
    if (req.user) {
      query = {
        $or: [
          { tipoSubasta: 'publica' },
          { vendedor: req.user._id },
          { usuariosInvitados: req.user._id }
        ]
      };
    }

    if (categoria && categoria !== 'todas') {
      query.categoria = categoria;
    }

    if (estado && estado !== 'todas') {
      query.estado = estado;
    }

    if (precioMin || precioMax) {
      query.precioActual = {};
      if (precioMin) query.precioActual.$gte = Number(precioMin);
      if (precioMax) query.precioActual.$lte = Number(precioMax);
    }

    if (busqueda) {
      query.$or = [
        { titulo: { $regex: busqueda, $options: 'i' } },
        { descripcion: { $regex: busqueda, $options: 'i' } },
        { tags: { $in: [new RegExp(busqueda, 'i')] } }
      ];
    }

    // Agregar filtro de tiempo para subastas activas
    if (estado === 'activo') {
      query.fechaInicio = { $lte: new Date() };
      query.fechaFin = { $gt: new Date() };
    }

    const skip = (pagina - 1) * limite;

    const productos = await Product.find(query)
      .populate('vendedor', 'nombre apellido')
      .sort(ordenar)
      .limit(Number(limite))
      .skip(skip);

    const total = await Product.countDocuments(query);
    const totalPaginas = Math.ceil(total / limite);

    res.json({
      success: true,
      data: productos,
      pagination: {
        paginaActual: Number(pagina),
        totalPaginas,
        total,
        limite: Number(limite)
      }
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Obtener subasta por ID
// @route   GET /api/products/:id
// @access  Public
const obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id)
      .populate('vendedor', 'nombre apellido email fechaRegistro')
      .populate('ofertaGanadora')
      .populate('ganador', 'nombre apellido');

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Subasta no encontrada'
      });
    }

    // Verificar permisos para subastas privadas
    if (req.user && !producto.puedeVerSubasta(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta subasta'
      });
    }

    // Incrementar vistas solo si no es el vendedor
    if (!req.user || req.user._id.toString() !== producto.vendedor._id.toString()) {
      await Product.findByIdAndUpdate(req.params.id, { $inc: { vistas: 1 } });
    }

    // Obtener las últimas ofertas
    const ofertas = await Bid.find({ producto: req.params.id })
      .populate('postor', 'nombre apellido')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...producto.toJSON(),
        ultimasOfertas: ofertas
      }
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Actualizar subasta
// @route   PUT /api/products/:id
// @access  Private (Solo el vendedor)
const actualizarProducto = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Subasta no encontrada'
      });
    }

    // Verificar que sea el vendedor (soporta vendedor poblado u ObjectId)
    const vendedorId = producto.vendedor && producto.vendedor._id ? producto.vendedor._id : producto.vendedor;
    if (String(vendedorId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta subasta'
      });
    }

    // No permitir edición si ya hay ofertas (excepto ciertos campos)
    if (producto.numeroOfertas > 0) {
      const camposPermitidos = ['descripcion', 'condiciones', 'fechaFin'];
      const camposEnviados = Object.keys(req.body);
      const camposNoPermitidos = camposEnviados.filter(campo => !camposPermitidos.includes(campo));
      
      if (camposNoPermitidos.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'No puedes modificar estos campos cuando ya hay ofertas',
          camposNoPermitidos
        });
      }
    }

    const productoActualizado = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Subasta actualizada exitosamente',
      data: productoActualizado
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Eliminar subasta
// @route   DELETE /api/products/:id
// @access  Private (Solo el vendedor)
const eliminarProducto = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Subasta no encontrada'
      });
    }

    // Verificar que sea el vendedor (soporta vendedor poblado u ObjectId)
    const vendedorId = producto.vendedor && producto.vendedor._id ? producto.vendedor._id : producto.vendedor;
    if (String(vendedorId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta subasta'
      });
    }

    // No permitir eliminación si ya hay ofertas
    if (producto.numeroOfertas > 0) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar una subasta que ya tiene ofertas. Puedes cancelarla en su lugar.'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Subasta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Obtener subastas del vendedor
// @route   GET /api/products/mis-subastas
// @access  Private (Solo vendedores)
const obtenerMisSubastas = async (req, res) => {
  try {
    const {
      estado,
      ordenar = '-createdAt',
      pagina = 1,
      limite = 12
    } = req.query;

    let query = { vendedor: req.user._id };

    if (estado && estado !== 'todas') {
      query.estado = estado;
    }

    const skip = (pagina - 1) * limite;

    const productos = await Product.find(query)
      .sort(ordenar)
      .limit(Number(limite))
      .skip(skip);

    const total = await Product.countDocuments(query);
    const totalPaginas = Math.ceil(total / limite);

    // Obtener estadísticas
    const estadisticas = await Product.aggregate([
      { $match: { vendedor: req.user._id } },
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
          totalVentas: { $sum: '$precioActual' }
        }
      }
    ]);

    res.json({
      success: true,
      data: productos,
      estadisticas,
      pagination: {
        paginaActual: Number(pagina),
        totalPaginas,
        total,
        limite: Number(limite)
      }
    });
  } catch (error) {
    console.error('Error obteniendo mis subastas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Cambiar estado de subasta
// @route   PATCH /api/products/:id/estado
// @access  Private (Solo el vendedor)
const cambiarEstadoSubasta = async (req, res) => {
  try {
    const { estado } = req.body;
    const producto = await Product.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Subasta no encontrada'
      });
    }

    // Verificar que sea el vendedor (soporta vendedor poblado u ObjectId)
    const vendedorId = producto.vendedor && producto.vendedor._id ? producto.vendedor._id : producto.vendedor;
    if (String(vendedorId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de esta subasta'
      });
    }

    // Validar transiciones de estado
    const transicionesValidas = {
      'borrador': ['activo', 'cancelado'],
      'activo': ['pausado', 'finalizado', 'cancelado'],
      'pausado': ['activo', 'cancelado'],
      'finalizado': [],
      'cancelado': []
    };

    if (!transicionesValidas[producto.estado].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de ${producto.estado} a ${estado}`
      });
    }

    producto.estado = estado;
    await producto.save();

    res.json({
      success: true,
      message: `Subasta ${estado === 'activo' ? 'activada' : estado} exitosamente`,
      data: producto
    });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
  obtenerMisSubastas,
  cambiarEstadoSubasta,
  upload
};
