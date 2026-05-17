import { useEffect } from "react";

import { LegalLayout } from "./LegalLayout";

export function PrivacyPage() {
  useEffect(() => {
    document.title = "Aviso de Privacidad · HRScout";
  }, []);

  return (
    <LegalLayout title="Aviso de Privacidad (LFPDPPP)" lastUpdated="2026-05-17">
      <p>
        En cumplimiento de la <strong>Ley Federal de Protección de Datos
        Personales en Posesión de los Particulares</strong> (LFPDPPP) y su
        Reglamento, HRScout pone a tu disposición el presente Aviso de
        Privacidad.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        Christian Hernandez (HRScout), con domicilio en México. Contacto:
        <strong> hola@hrscout.mx</strong>.
      </p>

      <h2>2. Datos personales que recabamos</h2>
      <p>
        <strong>Sobre vos (usuario reclutador):</strong> nombre, email, foto de
        perfil de Google (si usás OAuth), información de pago procesada por
        Stripe (no almacenamos tarjetas).
      </p>
      <p>
        <strong>Sobre los candidatos cuyos CV cargás:</strong> el texto del CV,
        nombre y email cuando los proveés o se extraen heurísticamente del
        archivo. Estos datos los procesás vos como responsable primario; nosotros
        actuamos como encargado del tratamiento bajo tus instrucciones.
      </p>

      <h2>3. Finalidades del tratamiento</h2>
      <ul>
        <li>Operar el Servicio: análisis, almacenamiento y consulta de CVs.</li>
        <li>Autenticar tu cuenta y mantener tu sesión activa.</li>
        <li>Procesar pagos y suscripciones.</li>
        <li>Enviarte comunicaciones operativas (bienvenida, recordatorios de prueba, recibos).</li>
        <li>Mejorar el Servicio mediante métricas agregadas (sin contenido de CVs).</li>
      </ul>

      <h2>4. Medidas de seguridad</h2>
      <p>
        Los datos personales sensibles (nombre, email del candidato) se cifran en
        reposo usando AES-128-CBC + HMAC (algoritmo Fernet). El archivo original
        del CV (PDF o DOCX) <strong>no se almacena</strong>: solo conservamos el
        texto extraído necesario para el análisis. La conexión web está protegida
        con HTTPS/TLS.
      </p>

      <h2>5. Transferencias a terceros</h2>
      <p>
        Compartimos datos estrictamente necesarios con los siguientes encargados:
      </p>
      <ul>
        <li><strong>Anthropic / Groq</strong> (procesamiento de IA del CV)</li>
        <li><strong>Stripe Inc.</strong> (procesamiento de pagos)</li>
        <li><strong>Google LLC</strong> (autenticación OAuth)</li>
        <li><strong>Render Inc.</strong> (alojamiento backend)</li>
        <li><strong>Vercel Inc.</strong> (alojamiento frontend)</li>
        <li><strong>Resend</strong> (envío de emails transaccionales)</li>
      </ul>
      <p>
        Ninguno de estos terceros usa tus datos para fines distintos a los que
        contratamos.
      </p>

      <h2>6. Derechos ARCO</h2>
      <p>
        Podés ejercer en cualquier momento tus derechos de <strong>Acceso,
        Rectificación, Cancelación y Oposición</strong> (ARCO) a tus datos
        personales escribiendo a <strong>hola@hrscout.mx</strong>. Atenderemos
        tu solicitud dentro de los 20 días hábiles previstos por la Ley.
      </p>

      <h2>7. Retención y eliminación</h2>
      <p>
        Al eliminar un candidato o una vacante, marcamos los registros como
        eliminados (soft delete) y los purgamos definitivamente dentro de los
        30 días siguientes. Al cancelar tu cuenta, eliminamos todos tus datos
        en un plazo máximo de 30 días, salvo obligaciones fiscales que requieran
        retención mayor (5 años para facturas).
      </p>

      <h2>8. Cookies</h2>
      <p>
        Usamos cookies estrictamente necesarias para mantener tu sesión iniciada
        (cookie <code>hrscout_session</code>, httpOnly, SameSite=Lax). No usamos
        cookies de seguimiento publicitario. Ver más detalle en nuestra
        <a href="/cookies"> Política de Cookies</a>.
      </p>

      <h2>9. Cambios a este Aviso</h2>
      <p>
        Cualquier cambio sustancial te será notificado por email con al menos
        15 días de anticipación.
      </p>
    </LegalLayout>
  );
}
