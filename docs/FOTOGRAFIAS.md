# Fotografías de referencia

Las fotografías ilustran productos ficticios para una demostración académica. No representan inventario real de SUR, afiliación con las marcas visibles ni permiso para una explotación comercial. Sustituirlas por fotografías propias o licenciadas antes de publicar una tienda real.

Paisaje y fotografías de polar, mochila, botella y polera: imágenes de referencia de Unsplash, con los identificadores conservados en `public/imagenes`.

Las imágenes inicialmente descargadas de chaquetas de cuero y denim se sustituyeron por fotografías coherentes con las chaquetas del catálogo:

- `chaqueta-ventisquero.jpg`: https://www.flatspot.com/products/patagonia-torrentshell-3l-jacket-metric-orange
- `chaqueta-austral.jpg`: https://www.fatbuddhastore.com/products/patagonia-torrentshell-3l-jacket-pollinator-orange
- `gorro-cordillera.jpg` y su alias usado por la semilla `photo-1576871337622-98d48d1cf531.jpg`: https://www.theuniformedit.com.au/product/as-colour-cuff-beanie-army/
- `zapatilla-sendero.jpg` y su alias usado por la semilla `photo-1542291026-7eec264c27ff.jpg`: fotografía de referencia del catálogo Walmart Canadá, https://www.walmart.ca/fr/ip/Chaussures-de-Randonn-e-Imperm-ables-pour-Hommes-L-g-res-Respirantes-Marche-Femmes-Antid-rapantes-randonn-e-en-Plein-Air-Camping/5APPNQ1FO2AO

La galería demuestra selección de imágenes. Las fotografías no muestran todas las combinaciones de talla y color de los datos ficticios.

La versión anterior usaba estas referencias también en WebP y `hero-movil.webp` para la portada. La dirección actual sustituye los WebP de producto según se detalla más abajo.

Fuentes locales: DM Sans y Libre Caslon Display, distribuidas bajo SIL Open Font License. Los textos de licencia se incluyen en `public/fuentes/OFL_DM_Sans.txt` y `public/fuentes/OFL_Libre_Caslon_Display.txt`.

## Dirección Sendero editorial (noviembre de 2026)

La portada, los cuatro accesos fotográficos, el paisaje editorial y las ocho fotografías de estudio actuales se generaron individualmente con Image Gen a partir de la propuesta visual 1 elegida por el usuario. Son imágenes ilustrativas de productos ficticios, sin logos de terceros. Se optimizaron a WebP para el sitio; los originales de trabajo permanecen fuera del repositorio.

`portada-sendero.webp` (1760 px) y su versión móvil (600 px) presentan el mismo paisaje con un recorte adaptado. La precarga escoge una sola portada según la pantalla. `categoria-chaquetas.webp`, `categoria-mochilas.webp`, `categoria-capas.webp` y `categoria-accesorios.webp` corresponden a los accesos del inicio; cada una tiene una variante de 360 px para reducir la transferencia móvil. `editorial-patagonia.webp` ilustra la sección inferior.

Las nuevas fotos de producto sustituyen los WebP utilizados por el catálogo inicial; se conservaron los nombres de archivo anteriores para que las sesiones locales existentes muestren la nueva presentación sin borrar pedidos, stock o cambios administrativos. Los JPG históricos se conservan como referencias de la versión anterior. Las fotos ilustran el producto y no representan cada combinación de talla y color.

Los iconos de interfaz pertenecen a Phosphor Icons 2.1.1, peso Light y corazón Fill. Se incluyen únicamente los SVG usados y su licencia MIT en `public/iconos/LICENCIA.txt`; no se añadió una dependencia de aplicación. Fuente: https://github.com/phosphor-icons/core.
