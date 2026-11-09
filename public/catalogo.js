'use strict';
const catalogoInicial = [
  {
    "id": 1,
    "nombre": "Cortaviento Ventisquero",
    "categoria": "Chaquetas",
    "descripcion": "Liviano, compacto y listo para la siguiente cumbre. Tela resistente al viento y ajuste en puños.",
    "precio": 49990,
    "precio_anterior": 64990,
    "imagenes": [
      "./imagenes/chaqueta-ventisquero.webp",
      "./imagenes/chaqueta-austral.webp"
    ],
    "variantes": [
      {
        "id": "1-1",
        "talla": "S",
        "color": "Musgo",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "1-2",
        "talla": "S",
        "color": "Negro",
        "stock": 7,
        "umbral": 3
      },
      {
        "id": "1-3",
        "talla": "M",
        "color": "Musgo",
        "stock": 8,
        "umbral": 3
      },
      {
        "id": "1-4",
        "talla": "M",
        "color": "Negro",
        "stock": 9,
        "umbral": 3
      },
      {
        "id": "1-5",
        "talla": "L",
        "color": "Musgo",
        "stock": 10,
        "umbral": 3
      },
      {
        "id": "1-6",
        "talla": "L",
        "color": "Negro",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "1-7",
        "talla": "XL",
        "color": "Musgo",
        "stock": 7,
        "umbral": 3
      },
      {
        "id": "1-8",
        "talla": "XL",
        "color": "Negro",
        "stock": 8,
        "umbral": 3
      }
    ]
  },
  {
    "id": 2,
    "nombre": "Impermeable Austral",
    "categoria": "Chaquetas",
    "descripcion": "Una capa confiable para la lluvia del sur. Costuras selladas, capucha ajustable y bolsillos protegidos.",
    "precio": 89990,
    "precio_anterior": null,
    "imagenes": [
      "./imagenes/chaqueta-austral.webp",
      "./imagenes/chaqueta-ventisquero.webp"
    ],
    "variantes": [
      {
        "id": "2-1",
        "talla": "S",
        "color": "Bosque",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "2-2",
        "talla": "S",
        "color": "Arena",
        "stock": 7,
        "umbral": 3
      },
      {
        "id": "2-3",
        "talla": "M",
        "color": "Bosque",
        "stock": 8,
        "umbral": 3
      },
      {
        "id": "2-4",
        "talla": "M",
        "color": "Arena",
        "stock": 9,
        "umbral": 3
      },
      {
        "id": "2-5",
        "talla": "L",
        "color": "Bosque",
        "stock": 10,
        "umbral": 3
      },
      {
        "id": "2-6",
        "talla": "L",
        "color": "Arena",
        "stock": 6,
        "umbral": 3
      }
    ]
  },
  {
    "id": 3,
    "nombre": "Polar Nativo",
    "categoria": "Polar y capas",
    "descripcion": "Abrigo suave para las mañanas frías. Corte cómodo y cuello alto para acompañarte todo el año.",
    "precio": 34990,
    "precio_anterior": 42990,
    "imagenes": [
      "./imagenes/photo-1556821840-3a63f95609a7.webp",
      "./imagenes/photo-1556821840-3a63f95609a7.webp"
    ],
    "variantes": [
      {
        "id": "3-1",
        "talla": "S",
        "color": "Arena",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "3-2",
        "talla": "S",
        "color": "Grafito",
        "stock": 7,
        "umbral": 3
      },
      {
        "id": "3-3",
        "talla": "M",
        "color": "Arena",
        "stock": 8,
        "umbral": 3
      },
      {
        "id": "3-4",
        "talla": "M",
        "color": "Grafito",
        "stock": 9,
        "umbral": 3
      },
      {
        "id": "3-5",
        "talla": "L",
        "color": "Arena",
        "stock": 10,
        "umbral": 3
      },
      {
        "id": "3-6",
        "talla": "L",
        "color": "Grafito",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "3-7",
        "talla": "XL",
        "color": "Arena",
        "stock": 7,
        "umbral": 3
      },
      {
        "id": "3-8",
        "talla": "XL",
        "color": "Grafito",
        "stock": 8,
        "umbral": 3
      }
    ]
  },
  {
    "id": 4,
    "nombre": "Mochila Travesía 24L",
    "categoria": "Mochilas",
    "descripcion": "Lo esencial para salir por el día. Espalda ventilada, bolsillo frontal y espacio para tu botella.",
    "precio": 59990,
    "precio_anterior": null,
    "imagenes": [
      "./imagenes/photo-1553062407-98eeb64c6a62.webp",
      "./imagenes/photo-1553062407-98eeb64c6a62.webp"
    ],
    "variantes": [
      {
        "id": "4-1",
        "talla": "24 L",
        "color": "Oliva",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "4-2",
        "talla": "24 L",
        "color": "Negro",
        "stock": 7,
        "umbral": 3
      }
    ]
  },
  {
    "id": 5,
    "nombre": "Gorro Cordillera",
    "categoria": "Accesorios",
    "descripcion": "Punto grueso y abrigo simple. Tu compañero para la ciudad, el campamento y el frío de altura.",
    "precio": 14990,
    "precio_anterior": null,
    "imagenes": [
      "./imagenes/photo-1576871337622-98d48d1cf531.webp",
      "./imagenes/photo-1576871337622-98d48d1cf531.webp"
    ],
    "variantes": [
      {
        "id": "5-1",
        "talla": "Única",
        "color": "Terracota",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "5-2",
        "talla": "Única",
        "color": "Arena",
        "stock": 7,
        "umbral": 3
      }
    ]
  },
  {
    "id": 6,
    "nombre": "Botella Río 750 ml",
    "categoria": "Accesorios",
    "descripcion": "Acero inoxidable para recargar y seguir. Doble pared, tapa hermética y capacidad de 750 ml.",
    "precio": 21990,
    "precio_anterior": 27990,
    "imagenes": [
      "./imagenes/photo-1602143407151-7111542de6e8.webp",
      "./imagenes/photo-1602143407151-7111542de6e8.webp"
    ],
    "variantes": [
      {
        "id": "6-1",
        "talla": "750 ml",
        "color": "Musgo",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "6-2",
        "talla": "750 ml",
        "color": "Negro",
        "stock": 7,
        "umbral": 3
      }
    ]
  },
  {
    "id": 7,
    "nombre": "Zapatilla Sendero",
    "categoria": "Calzado",
    "descripcion": "Agarre para explorar con calma. Suela de caucho, refuerzo de puntera y una pisada cómoda.",
    "precio": 74990,
    "precio_anterior": null,
    "imagenes": [
      "./imagenes/photo-1542291026-7eec264c27ff.webp",
      "./imagenes/photo-1542291026-7eec264c27ff.webp"
    ],
    "variantes": [
      {
        "id": "7-1",
        "talla": "38",
        "color": "Piedra",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "7-2",
        "talla": "39",
        "color": "Piedra",
        "stock": 7,
        "umbral": 3
      },
      {
        "id": "7-3",
        "talla": "40",
        "color": "Piedra",
        "stock": 8,
        "umbral": 3
      },
      {
        "id": "7-4",
        "talla": "41",
        "color": "Piedra",
        "stock": 9,
        "umbral": 3
      },
      {
        "id": "7-5",
        "talla": "42",
        "color": "Piedra",
        "stock": 10,
        "umbral": 3
      },
      {
        "id": "7-6",
        "talla": "43",
        "color": "Piedra",
        "stock": 6,
        "umbral": 3
      }
    ]
  },
  {
    "id": 8,
    "nombre": "Polera Horizonte",
    "categoria": "Polar y capas",
    "descripcion": "Una primera capa ligera y de secado rápido. Hecha para moverse entre senderos y días cotidianos.",
    "precio": 19990,
    "precio_anterior": null,
    "imagenes": [
      "./imagenes/photo-1521572163474-6864f9cf17ab.webp",
      "./imagenes/photo-1521572163474-6864f9cf17ab.webp"
    ],
    "variantes": [
      {
        "id": "8-1",
        "talla": "S",
        "color": "Crudo",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "8-2",
        "talla": "S",
        "color": "Bosque",
        "stock": 7,
        "umbral": 3
      },
      {
        "id": "8-3",
        "talla": "M",
        "color": "Crudo",
        "stock": 8,
        "umbral": 3
      },
      {
        "id": "8-4",
        "talla": "M",
        "color": "Bosque",
        "stock": 9,
        "umbral": 3
      },
      {
        "id": "8-5",
        "talla": "L",
        "color": "Crudo",
        "stock": 10,
        "umbral": 3
      },
      {
        "id": "8-6",
        "talla": "L",
        "color": "Bosque",
        "stock": 6,
        "umbral": 3
      },
      {
        "id": "8-7",
        "talla": "XL",
        "color": "Crudo",
        "stock": 7,
        "umbral": 3
      },
      {
        "id": "8-8",
        "talla": "XL",
        "color": "Bosque",
        "stock": 8,
        "umbral": 3
      }
    ]
  }
];
