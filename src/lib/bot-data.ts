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
  }
};
