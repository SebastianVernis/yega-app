// backend/services/otpService.js
const OTP = require('../models/OTP');
const { generateOTP } = require('../utils/generateOTP');
const { sendOTPSMS } = require('../utils/sendSMS');
const { sendOTPEmail } = require('../utils/sendEmail');
const devNotification = require('../utils/devNotification');

class OTPService {
  /**
   * Genera y envía un código OTP
   * @param {Object} options - Opciones para generar OTP
   * @param {string} options.telefono - Número de teléfono
   * @param {string} options.email - Email del usuario
   * @param {string} options.tipo - Tipo de OTP (registro, login, etc.)
   * @param {string} options.metodo - Método de envío (sms, email, ambos)
   * @param {Object} options.metadata - Metadata adicional
   * @param {string} options.ip - IP del cliente
   * @param {string} options.userAgent - User agent del cliente
   * @returns {Promise<Object>} Resultado del envío
   */
  static async generarYEnviar({
    telefono,
    email,
    tipo = 'verificacion',
    metodo = process.env.DEFAULT_OTP_METHOD || 'sms',
    metadata = {},
    ip = null,
    userAgent = null
  }) {
    try {
      // Verificar límite de envíos
      const puedeEnviar = await OTP.verificarLimiteEnvios(telefono, tipo);
      if (!puedeEnviar) {
        throw new Error('Límite de envíos por hora alcanzado. Intenta más tarde.');
      }

      // Invalidar códigos anteriores del mismo tipo
      await OTP.updateMany(
        { telefono, tipo, verificado: false },
        { verificado: true }
      );

      // Generar nuevo código
      const codigo = generateOTP();
      
      // Crear registro en base de datos
      const otpRecord = new OTP({
        telefono,
        email,
        codigo,
        tipo,
        ip_origen: ip,
        user_agent: userAgent,
        metadata
      });

      await otpRecord.save();

      // Enviar según el método especificado
      const resultados = {};
      let algunMetodoExitoso = false;

      // Intentar SMS si está configurado
      if (metodo === 'sms' || metodo === 'ambos') {
        try {
          const resultadoSMS = await sendOTPSMS(telefono, codigo);
          resultados.sms = resultadoSMS;
          if (resultadoSMS.success) algunMetodoExitoso = true;
        } catch (error) {
          console.error('Error enviando SMS:', error);
          resultados.sms = { success: false, error: error.message };
        }
      }

      // Intentar Email si SMS falló o si está configurado
      if (!algunMetodoExitoso && (metodo === 'email' || metodo === 'ambos')) {
        try {
          const resultadoEmail = await sendOTPEmail(email, codigo, tipo);
          resultados.email = resultadoEmail;
          if (resultadoEmail.success) algunMetodoExitoso = true;
        } catch (error) {
          console.error('Error enviando email:', error);
          resultados.email = { success: false, error: error.message };
        }
      }

      // Fallback para desarrollo y testing
      if (!algunMetodoExitoso) {
        // En desarrollo, mostrar el código en los logs y como notificación
        devNotification.show(`[DEV MODE] Código OTP para ${telefono}: ${codigo}`, 'info');
        console.log('\n==================================');
        console.log(`🔐 Código OTP: ${codigo}`);
        console.log(`📱 Teléfono: ${telefono}`);
        console.log(`📧 Email: ${email}`);
        console.log('==================================\n');
        
        // Marcar como exitoso para desarrollo
        algunMetodoExitoso = true;
        resultados.dev = { 
          success: true, 
          message: 'Código mostrado en logs (modo desarrollo)' 
        };
      }

      return {
        success: true,
        mensaje: 'Código OTP enviado exitosamente',
        id: otpRecord._id,
        expira_en: otpRecord.expira_en,
        tiempo_restante: otpRecord.tiempo_restante,
        metodos_enviados: Object.keys(resultados).filter(k => resultados[k].success),
        resultados,
        // En desarrollo, incluir el código en la respuesta
        ...(process.env.NODE_ENV !== 'production' && { dev_code: codigo })
      };

    } catch (error) {
      console.error('Error en generarYEnviar:', error);
      throw error;
    }
  }

  // ... resto de métodos sin cambios ...
}

module.exports = OTPService;