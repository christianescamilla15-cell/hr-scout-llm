import { useEffect } from "react";

import { LegalLayout } from "./LegalLayout";

export function TermsPage() {
  useEffect(() => {
    document.title = "Términos de servicio · HRScout";
  }, []);

  return (
    <LegalLayout title="Términos de servicio" lastUpdated="2026-05-17">
      <p>
        Este documento describe los términos bajo los cuales HRScout (operado por Christian Hernandez,
        en adelante &quot;el Servicio&quot;) provee herramientas de análisis y filtrado de currículums
        vitae mediante inteligencia artificial.
      </p>

      <h2>1. Uso del Servicio</h2>
      <p>
        El Servicio está diseñado para apoyar el proceso de reclutamiento profesional.
        Las puntuaciones, fortalezas, brechas y preguntas de entrevista generadas son
        herramientas de apoyo. La decisión final de contratación es responsabilidad
        exclusiva del usuario humano. HRScout no garantiza la idoneidad de ningún
        candidato para un puesto específico.
      </p>

      <h2>2. Cuenta y registro</h2>
      <p>
        Para usar funciones autenticadas, debes registrarte con una cuenta de Google
        válida o crear una cuenta con email y contraseña. Sos responsable de la
        confidencialidad de tu cuenta y de toda actividad realizada bajo ella.
      </p>

      <h2>3. Prueba gratuita</h2>
      <p>
        Ofrecemos 14 días de prueba gratuita sin tarjeta de crédito, limitados a 5
        análisis totales. Una vez consumidos o vencido el periodo, tu cuenta pasa a
        modo de solo lectura hasta que selecciones un plan pago.
      </p>

      <h2>4. Planes y pagos</h2>
      <p>
        Los planes pagos (Individual, Agency) se facturan vía Stripe en USD según
        las tarifas vigentes publicadas en la página de Precios. Los precios pueden
        cambiar; los cambios se notifican con al menos 30 días de anticipación.
        Podés cancelar tu suscripción en cualquier momento desde el portal de
        clientes; conservás acceso hasta el final del periodo pagado.
      </p>

      <h2>5. Propiedad intelectual</h2>
      <p>
        El software, marca y contenidos del Servicio son propiedad de Christian Hernandez.
        Los currículums y descripciones de puesto que cargás son tu propiedad o de tus
        clientes; HRScout obtiene únicamente la licencia limitada necesaria para procesar,
        analizar y mostrarte los resultados.
      </p>

      <h2>6. Limitaciones de responsabilidad</h2>
      <p>
        El Servicio se provee &quot;tal cual&quot;. No nos hacemos responsables de
        decisiones de contratación, omisiones u otros usos derivados de las salidas
        del análisis. La responsabilidad máxima por cualquier reclamación se limita
        al monto pagado por el usuario en los últimos 12 meses.
      </p>

      <h2>7. Cambios a estos términos</h2>
      <p>
        Podemos actualizar estos términos. Te notificaremos por email los cambios
        materiales. El uso continuado del Servicio después de los cambios implica
        aceptación.
      </p>

      <h2>8. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.
        Cualquier controversia se resolverá en tribunales de la Ciudad de México.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para preguntas sobre estos términos: <strong>hola@hrscout.mx</strong>.
      </p>
    </LegalLayout>
  );
}
