// Script para crear usuarios de prueba
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/yega', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  process.exit(1);
});

// Definir el schema directamente aquí para evitar problemas de importación
const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  telefono: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['cliente', 'tienda', 'repartidor', 'administrador'], default: 'cliente' },
  estado_validacion: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
  ubicacion: {
    latitud: Number,
    longitud: Number,
    direccion: String,
    timestamp: { type: Date, default: Date.now }
  },
  activo: { type: Boolean, default: true },
  ultimo_acceso: Date
}, { timestamps: true });

const Usuario = mongoose.model('Usuario', UsuarioSchema);

async function seedUsers() {
  try {
    // Limpiar usuarios existentes (opcional)
    await Usuario.deleteMany({});
    console.log('🗑️  Usuarios existentes eliminados');

    // Hash de contraseñas
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Usuarios de prueba
    const usuarios = [
      {
        nombre: 'Administrador',
        telefono: '+52 1234567890',
        email: 'admin@manda2.com',
        password: hashedPassword,
        rol: 'administrador',
        estado_validacion: 'aprobado',
        activo: true
      },
      {
        nombre: 'Cliente Demo',
        telefono: '+52 1234567891',
        email: 'cliente@manda2.com',
        password: hashedPassword,
        rol: 'cliente',
        estado_validacion: 'aprobado',
        activo: true
      },
      {
        nombre: 'Tienda Demo',
        telefono: '+52 1234567892',
        email: 'tienda@manda2.com',
        password: hashedPassword,
        rol: 'tienda',
        estado_validacion: 'aprobado',
        activo: true,
        ubicacion: {
          latitud: 19.4326,
          longitud: -99.1332,
          direccion: 'Ciudad de México, CDMX',
          timestamp: new Date()
        }
      },
      {
        nombre: 'Repartidor Demo',
        telefono: '+52 1234567893',
        email: 'repartidor@manda2.com',
        password: hashedPassword,
        rol: 'repartidor',
        estado_validacion: 'aprobado',
        activo: true,
        ubicacion: {
          latitud: 19.4326,
          longitud: -99.1332,
          direccion: 'Ciudad de México, CDMX',
          timestamp: new Date()
        }
      }
    ];

    // Insertar usuarios
    const result = await Usuario.insertMany(usuarios);
    console.log(`✅ ${result.length} usuarios creados exitosamente`);
    
    console.log('\n📋 Usuarios de prueba:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    usuarios.forEach(u => {
      console.log(`👤 ${u.rol.toUpperCase()}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Password: admin123`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
    process.exit(1);
  }
}

seedUsers();
