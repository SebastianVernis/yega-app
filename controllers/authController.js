// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const OTPService = require('../services/otpService');

// Generar JWT
const generateToken = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { nombre, telefono, email, password, rol, ubicacion } = req.body;

    // Validaciones básicas
    if (!nombre || !telefono || !email || !password) {
      return res.status(400).json({ 
        message: 'Todos los campos son requeridos',
        campos_requeridos: ['nombre', 'telefono', 'email', 'password']
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({
      $or: [{ email }, { telefono }]
    });

    if (usuarioExistente) {
      return res.status(400).json({ 
        message: 'Ya existe un usuario con este email o teléfono' 
      });
    }

    // Determinar rol final y estado de validación
    const rolFinal = rol || 'cliente';
    // Todos los usuarios aprobados inmediatamente (sin OTP)
    let estado_validacion = 'aprobado';

    // Crear usuario
    const datosUsuario = {
      nombre,
      telefono,
      email,
      password,
      rol: rolFinal,
      estado_validacion
    };

    // Agregar ubicación si es tienda o repartidor
    if ((rol === 'tienda' || rol === 'repartidor') && ubicacion) {
      datosUsuario.ubicacion = ubicacion;
    }

    const usuario = new Usuario(datosUsuario);

    // No generamos OTP para ningún usuario
    // OTP desactivado para todos los roles

    await usuario.save();

    const token = generateToken(usuario._id, usuario.rol);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol,
        estado_validacion: usuario.estado_validacion,
        ubicacion: usuario.ubicacion
      },
      requiere_otp: false
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Errores de validación',
        errores 
      });
    }

    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar usuario y incluir password para comparación
    const usuario = await Usuario.findOne({ email }).select('+password');

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isMatch = await usuario.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({ 
        message: 'Cuenta desactivada. Contacta al administrador.' 
      });
    }

    // Verificar estado de validación (todos los roles requieren aprobación)
    if (usuario.estado_validacion !== 'aprobado') {
      let mensaje = 'Tu cuenta está pendiente de verificación.';
      if (usuario.estado_validacion === 'rechazado') {
        mensaje = 'Tu cuenta ha sido rechazada. Contacta al administrador.';
      }
      return res.status(403).json({ 
        message: mensaje,
        requires_otp: true,
        email: usuario.email,
        telefono: usuario.telefono
      });
    }

    // Actualizar último acceso
    usuario.ultimo_acceso = new Date();
    await usuario.save();

    const token = generateToken(usuario._id, usuario.rol);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol,
        estado_validacion: usuario.estado_validacion,
        ubicacion: usuario.ubicacion,
        ultimo_acceso: usuario.ultimo_acceso
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verificar OTP (unificado con OTPService)
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, telefono: telefonoBody, tipo = 'registro' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        message: 'Email y código OTP son requeridos' 
      });
    }

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // OTP desactivado - simulamos verificación exitosa siempre
    // Cualquier código OTP es aceptado

    // Aprobar usuario y limpiar OTP
    usuario.estado_validacion = 'aprobado';
    usuario.otp = undefined;
    usuario.otp_expires = undefined;
    await usuario.save();

    // Opcional: iniciar sesión automática al verificar
    const token = generateToken(usuario._id, usuario.rol);

    res.json({ 
      success: true,
      message: 'Cuenta verificada exitosamente',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol,
        estado_validacion: usuario.estado_validacion,
        ubicacion: usuario.ubicacion
      }
    });

  } catch (error) {
    console.error('Error verificando OTP:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reenviar OTP (unificado con OTPService)
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Marcar usuario como aprobado si no lo está
    if (usuario.estado_validacion !== 'aprobado') {
      usuario.estado_validacion = 'aprobado';
      await usuario.save();
    }

    // OTP desactivado - solo simulamos que se envió correctamente
    // No hacemos llamada real a OTPService

    res.json({ success: true, message: 'Nuevo código OTP enviado' });

  } catch (error) {
    console.error('Error reenviando OTP:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = (req, res) => {
  // El middleware 'protect' ya ha verificado y adjuntado el usuario a req.user
  // Simplemente devolvemos el usuario que ya tenemos.
  res.json({
    success: true,
    usuario: req.user // req.user es establecido por el middleware 'protect'
  });
};

// @desc    Actualizar perfil del usuario
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { 
      nombre, 
      telefono, 
      ubicacion, 
      vehiculo,
      descripcion,
      horario, 
      preferencias
    } = req.body;
    
    const usuario = await Usuario.findById(req.user.id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar campos permitidos
    if (nombre) usuario.nombre = nombre;
    if (telefono) usuario.telefono = telefono;
    
    // Campos específicos por rol
    if (ubicacion && (usuario.rol === 'tienda' || usuario.rol === 'repartidor')) {
      usuario.ubicacion = ubicacion;
    }
    if (vehiculo && usuario.rol === 'repartidor') {
      usuario.vehiculo = vehiculo;
    }
    if (descripcion && usuario.rol === 'tienda') {
      usuario.descripcion = descripcion;
    }
    if (horario && usuario.rol === 'tienda') {
      usuario.horario = horario;
    }
    if (preferencias) {
      // Asegurarse de que preferencias sea un objeto antes de guardar
      usuario.preferencias = {
        ...(usuario.preferencias || {}),
        ...preferencias
      };
    }

    await usuario.save();

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol,
        ubicacion: usuario.ubicacion,
        vehiculo: usuario.vehiculo
      }
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Errores de validación',
        errores 
      });
    }

    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }

    const user = await Usuario.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // En un entorno real, aquí enviarías un email con un token de reseteo
    // Por ahora solo simulamos el envío
    console.log(`Password reset requested for: ${email}`);

    res.json({ message: 'Se ha enviado un enlace de recuperación a tu email' });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    }

    // En un entorno real verificarías el token de reseteo
    // Por ahora solo simulamos el reseteo
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
