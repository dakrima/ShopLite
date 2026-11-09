# QA de diseño: Sendero editorial

Fecha: 9 de noviembre de 2026.

Resultado final: **passed**.

## Referencia y alcance

El usuario eligió la propuesta 1, Sendero editorial. La imagen seleccionada mide 946 × 1663 px y se conserva en [referencia.jpg](docs/diseno/referencia.jpg). Se implementó en la tienda existente, conservando los ocho productos, precios, variantes, stock, pedidos, favoritos y Administración. No cambian `tienda.js`, `catalogo.js` ni el almacenamiento del navegador.

La referencia y la implementación se compararon juntas a 946 px de ancho CSS y DPR 1, con las fuentes cargadas: [comparacion.jpg](docs/diseno/comparacion.jpg). La [captura completa](docs/diseno/implementacion-946.jpg) incluye las dos filas reales del catálogo y el resto de la página.

## Fidelidad visual

| Superficie | Resultado |
| --- | --- |
| Composición | Portada panorámica, senderista a la derecha, título a la izquierda, cuatro categorías fotográficas y catálogo de cuatro columnas. |
| Tipografía | Libre Caslon Display en titulares y DM Sans en interfaz, servidas localmente. Tamaños fluidos y jerarquía equivalente a la propuesta. |
| Color y detalle | Verde bosque, crema y acentos terracota; bordes discretos, controles táctiles y Phosphor Light. Se conserva la marca SUR original. |
| Imágenes | Recursos individuales para portada, categorías, ocho productos y paisaje editorial; WebP con recorte móvil y categorías responsivas. |
| Contenido | Textos editables en HTML. El anuncio está centrado. Administración conserva su nombre. No se reintroducen los rótulos ni separadores retirados por el usuario. |

La primera comparación detectó un CTA demasiado grande y bajo. Se corrigieron su tamaño, separación y proporción de la portada antes de la comparación final. La revisión visual independiente no encontró P0, P1 ni P2 pendientes; las observaciones P3 de altura tipográfica y texto de disponibilidad no impiden la entrega.

Las diferencias deliberadas son funcionales: se muestran ocho productos reales del mockup en vez de cuatro ilustrativos, se conservan las categorías y filtros existentes en vez de inventar navegación por género, y los colores y descuentos proceden de los datos actuales.

## Interacción y adaptación

- Inspección manual en el navegador integrado a 320, 390, 720, 900, 946 y 1440 px, sin desbordamiento horizontal. Dos columnas de productos en móvil y cuatro en escritorio.
- Menú móvil: categoría Mochilas filtra un producto y cierra el menú. Limpiar filtros restablece los ocho productos.
- Seleccionar Negro en una tarjeta abre la ficha con Negro seleccionado. Enter abre la ficha; Escape la cierra y devuelve el foco al control de origen.
- Bolsa: una unidad de $49.990 muestra el avance correspondiente al umbral de $80.000; dos unidades completan el indicador. Se retiraron las líneas de prueba al terminar.
- Imágenes cargadas, fuentes locales cargadas y sin errores de consola durante la revisión local.
- `npm test`: grupos unitarios de tienda, interfaz y publicación aprobados; seis casos E2E aprobados en escritorio y móvil, sin omisiones ni casos inestables. Incluyen categorías, búsqueda, favoritos, variantes, compra, pedidos y Administración.
- Revisión estática independiente sin bugs P0-P2. `git diff --check` aprobado.

En la primera comprobación pública se detectó HTML nuevo con CSS y JavaScript antiguos conservados por la caché del navegador (los archivos remotos ya coincidían con main; Pages indicaba `max-age=600`). La preparación de publicación añade ahora un hash de contenido a las URLs de CSS y JavaScript. Las fotos locales se solicitan con la versión Sendero sin alterar las rutas guardadas en las sesiones. Las URLs externas conservan sus consultas. Ambas regresiones se reprodujeron con tests fallidos antes de corregirlas y quedaron cubiertas por los tests de interfaz y publicación.

## Rendimiento y límites

Medición local con tres cargas por ruta y tamaño, caché desactivada. En móvil de 390 px se aplicaron CPU 4×, latencia 40 ms y bajada de 1,6 Mbps. Tras optimizar portada y categorías, LCP mediana de inicio: **2236 ms**; ficha de mochila: **2116 ms**. CLS mediana: **0,000157**. En escritorio de 1440 px, LCP mediana: 108 ms y 88 ms respectivamente; CLS 0. Las cuatro combinaciones cumplen los objetivos locales de LCP menor a 2500 ms y CLS menor a 0,1.

Estos resultados son de laboratorio local, no datos de usuarios reales ni una medición de GitHub Pages. No se verificó Safari ni un lector de pantalla. La tienda sigue siendo un mockup frontend con persistencia local; las fotos son ilustrativas y no representan cada color de variante.
