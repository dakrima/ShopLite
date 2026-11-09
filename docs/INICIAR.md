# Abrir ShopLite

Haz doble clic en `abrir.command`, o abre `public/index.html` en Chrome o Safari. La carpeta `public` completa también se puede publicar en un alojamiento estático. No hay instalación, compilación ni servidor de aplicación.

## Probar la presentación

1. Explora productos, busca, filtra y elige talla y color.
2. Guarda favoritos y agrega productos a la bolsa. Se conservan al recargar.
3. En el checkout prueba `SUR10` (10 %) o `SUR5000` ($5.000), envío a domicilio y retiro.
4. En esa misma vista elige un pago aprobado o rechazado y confirma el pedido. Ante rechazo, cambia el resultado y reintenta: se conserva el mismo pedido. No se realizan cargos.
5. Revisa Mis pedidos. Después de un pago aprobado puedes escribir una reseña del producto.
6. En Administración usa `SurDemo2026!`. Edita precios, agrega productos, cambia stock y umbrales, crea cupones y avanza un pedido a enviado y entregado.
7. En Correos revisa la representación de las notificaciones de confirmación y despacho. Son registros simulados, no mensajes enviados.

## Datos locales

El catálogo inicial está en `public/catalogo.js`. Los cambios de esta demostración se guardan en el navegador de este equipo mediante `localStorage`; el acceso de Administración usa `sessionStorage`. Abrir otro navegador, otro perfil o una dirección distinta crea una demostración independiente. Borrar los datos del sitio devuelve el catálogo inicial. No uses datos personales reales en los formularios.

El navegador debe permitir almacenamiento local. La clave muestra el flujo de acceso y no ofrece protección real: todo el código y los datos están en el navegador.

## Manual y comprobaciones

El [manual de Administración](MANUAL_ADMINISTRACION.md) explica productos, promociones, inventario, cupones, pedidos y notificaciones con capturas. La [guía de publicación](PUBLICAR.md) describe las pruebas reproducibles, el sitemap, GitHub Pages y las mediciones.

Con Node.js 20 o posterior, desde la carpeta del proyecto:

```sh
npm ci
npx playwright install chromium
npm test
```

Node y Playwright se usan para las pruebas y la preparación estática; no hacen falta para abrir la página. No se incluyen base de datos, API, servicios de correo, procesamiento de pagos ni contenedores. Los aspectos exclusivamente backend se asumen resueltos fuera del alcance del mockup, según la indicación del profesor.
