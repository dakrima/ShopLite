# ShopLite como mockup frontend

El alcance acordado es demostrar la interfaz de los sprints 1 al 7 de P04 ShopLite. Las funciones que en una tienda real necesitan servicios se representan con datos y estados locales. La marca SUR y el diseño existente se conservan.

| Sprint | Lo que se puede demostrar en la interfaz |
| --- | --- |
| 1 | Catálogo por categorías, búsqueda, orden, ficha y galería, selección de talla/color, stock, carrito y favoritos persistentes. |
| 2 | Dirección y método de entrega, cálculo de envío, pago aprobado/rechazado simulado, seguimiento de pedidos y Administración de productos, precios y promociones. |
| 3 | Cupones de porcentaje/monto, inventario por variante y alertas de reposición, representación de correos de compra y despacho. |
| 4 | Reseñas tras compra simulada, título/metadatos de producto en el cliente, recursos locales optimizados y diseño adaptable. |
| 5 | Continuidad de los flujos frontend. Caché de servidor, tratamiento real de tarjetas y controles de seguridad backend se asumen realizados; no se implementan en este mockup. |
| 6 | Checkout en una vista, diseño adaptable y publicación estática automática después de pasar las pruebas. |
| 7 | Pruebas E2E reproducibles del flujo completo y manual ilustrado de Administración. La documentación API queda fuera del mockup sin API. |

## Archivos

- `public/index.html`: página y diálogos.
- `public/estilos.css`: diseño y adaptación móvil.
- `public/catalogo.js`: los ocho productos iniciales y sus variantes.
- `public/tienda.js`: datos del navegador y simulaciones de compra/administración.
- `public/app.js`: interacción y representación de las pantallas.
- `public/imagenes` y `public/fuentes`: recursos locales.

El cálculo de descuentos y envío se ejecuta en JavaScript únicamente para sostener la demostración. El envío es gratis desde $80.000 después del descuento; retiro siempre gratuito, despacho RM $3.990 y otras regiones $6.990.

Las rutas de producto usan `#producto/ID` y admiten recarga, enlaces y navegación atrás/adelante sin servidor. Los metadatos de producto se actualizan en el navegador. La preparación estática genera canonical, Open Graph, sitemap y robots para la URL pública; el sitemap solo enumera la página principal, porque los fragmentos no son documentos separados. Los pagos y correos nunca contactan proveedores externos. La validación de formularios y el escape de texto preservan el comportamiento de la interfaz; no constituyen autenticación ni seguridad de una tienda real.

La versión anterior se retiró del proyecto activo y se conservó como copia local fuera de la entrega. No se modificaron las presentaciones ni los documentos de gestión preparados en el otro chat.


## Entrega y mantenimiento

- [Manual ilustrado de Administración](MANUAL_ADMINISTRACION.md).
- [Pruebas, sitemap, rendimiento y GitHub Pages](PUBLICAR.md).
- `npm test`: lógica, interfaz, publicación y seis recorridos Playwright en escritorio/móvil.
- `npm run build -- URL_PUBLICA`: genera los archivos estáticos de `dist`.
- `npm run medir -- URL_PUBLICA`: mide LCP/CLS de laboratorio sin cambiar datos de otros navegadores.
