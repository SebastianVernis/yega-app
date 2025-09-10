# Tarea Siguiente: Implementar Activación de OTP por Correo Electrónico

Esta tarea se enfoca en activar completamente la funcionalidad de One-Time Password (OTP) a través de correo electrónico para la verificación de usuarios. Actualmente, la generación y verificación de OTP están simuladas o desactivadas.

## Pasos a Seguir:

1.  **Reactivar el uso de `OTPService` en `authController.js`:**
    *   Descomentar o re-añadir la importación de `OTPService`.
    *   Modificar la función `registerUser` para que realmente llame a `OTPService.generateOTP` después de crear el usuario, y establecer `estado_validacion` a `pendiente` o similar hasta que el OTP sea verificado.
    *   Modificar la función `verifyOTP` para que realmente llame a `OTPService.verifyOTP` para validar el código ingresado por el usuario.
    *   Modificar la función `resendOTP` para que realmente llame a `OTPService.generateOTP` para generar y enviar un nuevo OTP.

2.  **Implementar el envío real de correos electrónicos en `otpService.js`:**
    *   Integrar `otpService.js` con `utils/sendEmail.js` para enviar el OTP generado al correo electrónico del usuario. Asegurarse de que el contenido del correo sea claro y contenga el código OTP.

3.  **Verificar y ajustar el modelo `Usuario` (`models/Usuario.js`):**
    *   Confirmar que el modelo `Usuario` tiene los campos necesarios para almacenar el OTP (`otp`) y su fecha de expiración (`otp_expires`), y que estos campos se utilizan correctamente durante la generación y verificación.

4.  **Consideraciones de seguridad y configuración:**
    *   Asegurar que las variables de entorno relacionadas con el envío de correos (servidor SMTP, credenciales, etc.) estén configuradas y sean accesibles.
    *   Implementar un mecanismo para limitar los intentos de verificación de OTP para prevenir ataques de fuerza bruta.

5.  **Pruebas:**
    *   Realizar pruebas exhaustivas de registro, inicio de sesión, verificación de OTP y reenvío de OTP para asegurar que la funcionalidad es robusta y segura.

Una vez completada esta tarea, la verificación de usuarios por correo electrónico estará completamente operativa.
