export const botContextData = {
  informacionGeneral: {
    nombre: "Auto Escuela Americana",
    ubicacion: "Torreón #49, Roma Sur, CDMX.",
    whatsappContacto: "525634433212",
    enlaces: {
      agenda: "/agenda",
      catalogo: "/catalogo",
      pagos: "/pagos",
      terminos: "/terminos",
    },
  },
  catalogoCursos: [
    {
      nombre: "Curso Principiante (Automático)",
      precioMXN: 3900.00,
      descripcion: "Para novatos, enfocado en reglas y maniobras esenciales.",
    },
    {
      nombre: "Curso Principiante (Estándar)",
      precioMXN: 3400.00,
      descripcion: "Para aprender a manejar transmisión manual desde cero.",
    },
    {
      nombre: "Curso Intermedio",
      precioMXN: 2600.00,
      descripcion: "Para perfeccionar técnica y ganar confianza.",
    },
    {
      nombre: "Curso de Reforzamiento",
      precioMXN: 1800.00,
      descripcion: "Para quienes dejaron de manejar y quieren retomar la confianza.",
    },
    {
      nombre: "Curso para Personas Nerviosas",
      precioMXN: 5100.00,
      descripcion: "Programa especial con paciencia y técnicas para superar la ansiedad.",
    },
    {
      nombre: "Curso Mixto (Automático y Estándar)",
      precioMXN: 5100.00,
      descripcion: "Para dominar ambos tipos de transmisión.",
    },
    {
      nombre: "Curso en Coche Propio",
      precioMXN: 3900.00,
      descripcion: "Clases personalizadas en el vehículo del alumno.",
    },
    {
      nombre: "English Driving Course",
      precioMXN: 4800.00,
      descripcion: "Clases en inglés para todos los niveles.",
    },
    {
      nombre: "Curso de Motocicleta",
      precioMXN: 4300.00,
      descripcion: "8 horas para aprender a manejar moto de forma segura.",
    },
  ],
  tramitesAdicionales: {
    constanciaMenorEdad: {
        descripcion: "Constancia para permiso de menor de edad.",
        costoAdicionalMXN: 500.00,
    }
  },
  procesoAgendar: [
    "Ir a la página de Agenda (/agenda).",
    "Elegir hasta 6 días en el calendario.",
    "Completar el formulario con datos personales, horario, transmisión y punto de encuentro.",
    "Enviar el formulario para preparar un mensaje de WhatsApp y generar una ficha PDF.",
  ],
  metodosPago: {
    transferencia: "Transferencia Bancaria a la cuenta de Eduardo W. Czaplewski (BBVA).",
    deposito: "Depósito en Efectivo en Walmart, Sanborns, OXXO, 7-Eleven.",
    tarjeta: "Pago con Tarjeta (Crédito/Débito) a través de un enlace de Openpay con opción a Meses Sin Intereses.",
    importante: "Siempre se debe poner el nombre del alumno en el concepto y enviar el comprobante por WhatsApp."
  },
  politicas: {
      cancelaciones: "Se requiere avisar con 24 horas de anticipación para cancelar o reprogramar. Si no, se pierde la clase.",
      vigencia: "Los cursos tienen una vigencia de 3 meses para ser completados.",
      confidencialidad: "Los datos del alumno y del instructor son confidenciales."
  },
  preguntasFrecuentes: [
    {
      pregunta: "¿Qué necesito para inscribirme?",
      respuesta: "Para inscribirte, solo necesitas ser mayor de 16 años y realizar el pago del curso. Si eres menor de edad, tu padre o tutor debe dar su autorización. Puedes iniciar el proceso de inscripción desde la página de Agenda en /agenda."
    },
    {
      pregunta: "¿Los precios ya incluyen IVA?",
      respuesta: "Sí, todos los precios que ves en nuestro catálogo en /catalogo ya incluyen el IVA. No hay costos ocultos."
    },
    {
      pregunta: "¿Puedo tomar clases en fines de semana?",
      respuesta: "La disponibilidad para fines de semana puede variar. Te recomendamos consultar directamente con un asesor a través de nuestro WhatsApp para confirmar los horarios. El calendario en la página de agenda te muestra los días disponibles que puedes solicitar."
    },
    {
      pregunta: "¿Qué pasa si llueve el día de mi clase?",
      respuesta: "Las clases no se cancelan por lluvia. De hecho, consideramos que es una excelente oportunidad para que aprendas a conducir en condiciones climáticas adversas, siempre con la seguridad y guía de tu instructor."
    },
    {
      pregunta: "¿Cuánto dura cada clase?",
      respuesta: "La duración y el número de sesiones dependen del paquete de curso que elijas. Por ejemplo, los cursos para principiantes suelen consistir en varias clases para cubrir todos los fundamentos. Puedes ver más detalles en nuestro catálogo (/catalogo)."
    },
    {
      pregunta: "¿Tengo que ir hasta la sucursal para mis clases?",
      respuesta: "No necesariamente. Ofrecemos mucha flexibilidad. Al agendar tu clase en /agenda, puedes elegir entre: iniciar en nuestra sucursal de la colonia Roma, que te recojamos en tu domicilio, o acordar un punto de encuentro conveniente para ambos."
    },
    {
      pregunta: "¿Puedo pagar el curso en partes?",
      respuesta: "El pago del curso se debe realizar en su totalidad antes de la primera clase. Sin embargo, si pagas con tarjeta de crédito, tienes opciones de financiamiento como Meses Sin Intereses con tarjetas American Express y BBVA, o pagos diferidos con otros bancos a través de Openpay."
    },
    {
      pregunta: "¿El coche para las prácticas lo ponen ustedes?",
      respuesta: "Sí, nosotros proporcionamos el vehículo para tus clases, ya sea automático o estándar. Está en perfectas condiciones y cuenta con doble control para tu seguridad. También ofrecemos el 'Curso en Coche Propio' si prefieres aprender en tu vehículo."
    }
  ]
};
