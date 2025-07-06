export const botContextData = {
  informacionGeneral: {
    nombre: "Auto Escuela Americana",
    ubicacion: "Torreón #49, Roma Sur, CDMX.",
    cobertura: "Ciudad de México (CDMX) únicamente.",
    horariosGenerales: "Los horarios principales para iniciar clases son 7am, 10am, 13pm, 16pm y 19pm, todos los días. Se debe confirmar disponibilidad al agendar.",
    tiposDeVehiculo: "Enseñamos en coches con transmisión automática y estándar.",
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
      descripcion: "Perfecto si nunca has manejado. Aprende a conducir un coche automático con facilidad y confianza, enfocándote en las reglas de tránsito y maniobras esenciales.",
    },
    {
      nombre: "Curso Principiante (Estándar)",
      precioMXN: 3400.00,
      descripcion: "Aprende a dominar la transmisión manual desde cero. Este curso cubre el control del clutch, cambios de marcha y los fundamentos de la conducción segura.",
    },
    {
      nombre: "Curso Intermedio",
      precioMXN: 2600.00,
      descripcion: "Para personas que ya saben manejar pero quieren perfeccionar su técnica y ganar confianza.",
    },
    {
      nombre: "Curso de Reforzamiento",
      precioMXN: 1800.00,
      descripcion: "Para quienes dejaron de manejar y quieren retomar la confianza.",
    },
    {
      nombre: "Curso para Personas Nerviosas",
      precioMXN: 5100.00,
      descripcion: "Un programa especial con paciencia y técnicas para superar la ansiedad al volante.",
    },
    {
      nombre: "Curso Mixto (Automático y Estándar)",
      precioMXN: 5100.00,
      descripcion: "Aprende a dominar ambos tipos de transmisión y amplía tus habilidades de conducción.",
    },
    {
      nombre: "Curso en Coche Propio",
      precioMXN: 3900.00,
      descripcion: "Clases personalizadas en el vehículo del alumno para que se familiarice con él.",
    },
    {
      nombre: "English Driving Course",
      precioMXN: 4800.00,
      descripcion: "Clases de manejo completas para todos los niveles, impartidas totalmente en inglés.",
    },
    {
      nombre: "Curso de Motocicleta",
      precioMXN: 4300.00,
      descripcion: "Curso de 8 horas para aprender a manejar motocicleta de forma segura.",
    },
  ],
  tramitesAdicionales: {
    constanciaMenorEdad: {
        descripcion: "Constancia para el trámite del permiso de conducir de menor de edad.",
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
      respuesta: "Cada clase tiene una duración de dos horas y media. Esto nos permite tener tiempo suficiente para practicar en diversas situaciones sin prisas."
    },
    {
      pregunta: "¿Ofrecen servicio a domicilio? / ¿Pueden recogerme en mi casa o trabajo?",
      respuesta: "Sí, generalmente ofrecemos servicio a domicilio. Podemos recogerte en tu casa o trabajo, siempre que sea dentro de nuestra área de cobertura en CDMX. Para las primeras clases, buscamos que el lugar sea seguro y sin pendientes pronunciadas, para que te familiarices con el coche tranquilamente."
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
    },
    {
      pregunta: "¿La constancia para el permiso de menor de edad tiene costo extra?",
      respuesta: "Sí, el trámite para generar la constancia que se presenta ante SEMOVI para el permiso de conducir de menor de edad tiene un costo adicional de $500 MXN. Puedes solicitarla al momento de agendar tu curso."
    },
    {
      pregunta: "¿Qué pasa si falto a una clase sin avisar?",
      respuesta: "Según nuestros términos y condiciones, es necesario cancelar o reprogramar con al menos 24 horas de anticipación. Si no se cumple este plazo, la clase se considerará como tomada y no podrá ser repuesta."
    },
    {
      pregunta: "¿En qué zonas dan servicio? / ¿Cuál es su área de cobertura?",
      respuesta: "Por el momento, nuestra cobertura es exclusivamente en la Ciudad de México (CDMX)."
    },
    {
      pregunta: "¿Qué horarios manejan?",
      respuesta: "Nuestros horarios generales para iniciar clases son a las 7am, 10am, 13pm, 16pm y 19pm, todos los días. Sin embargo, te recomendamos siempre confirmar la disponibilidad al momento de agendar tu curso."
    },
    {
      pregunta: "¿Tienen cursos para menores de edad?",
      respuesta: "Sí, claro. Ofrecemos cursos para menores de edad y también tramitamos la constancia para su permiso de conducir por un costo adicional."
    },
    {
      pregunta: "Do you offer courses in English?",
      respuesta: "Yes, we have an 'English Driving Course' available. All lessons are conducted entirely in English."
    },
    {
      pregunta: "¿Dan clases de moto?",
      respuesta: "Sí, tenemos un curso de 8 horas para aprender a manejar motocicleta de forma segura. Puedes ver los detalles y el precio en nuestro catálogo /catalogo."
    },
    {
      pregunta: "¿Qué tipo de coches usan? / ¿Tienen automáticos o estándar?",
      respuesta: "Contamos con vehículos de transmisión automática y estándar para que puedas aprender en el que prefieras. Ambos están equipados con doble control por seguridad."
    },
    {
      pregunta: "¿Cuánto cuestan los cursos? / ¿Cuáles son los precios?",
      respuesta: "Tenemos varios cursos para adaptarnos a tus necesidades. Por ejemplo, el Curso Principiante Estándar cuesta $3400 MXN. Te recomiendo ver todos nuestros cursos y precios actualizados en nuestro catálogo en la página /catalogo."
    },
    {
      pregunta: "¿Dónde están ubicados? / ¿Cuál es su dirección?",
      respuesta: "Nuestra sucursal principal está en Torreón #49, Roma Sur, en la Ciudad de México. Sin embargo, ofrecemos servicio a domicilio en gran parte de CDMX, ¡así que podemos ir a donde tú estés! Puedes ver un mapa en nuestra página principal."
    },
    {
      pregunta: "¿Tienen espacio disponible? / ¿Cómo sé si hay lugar?",
      respuesta: "Sí, constantemente tenemos espacios disponibles. Nuestros horarios principales para iniciar son a las 7am, 10am, 13pm, 16pm y 19pm. La mejor forma de ver la disponibilidad y solicitar tu lugar es a través de nuestra página de agenda en /agenda. Ahí puedes seleccionar los días que te interesan."
    }
  ]
};
