'use strict';
const fs = require('node:fs');
const path = require('node:path');

const proyecto = path.resolve(__dirname, '..');
const publicos = path.join(proyecto, 'public');
const escapar = (valor) => valor.replace(/[&<>"']/g, (caracter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[caracter]));
function rutaReal(ruta) {
  let existente = ruta;
  while (!fs.existsSync(existente)) existente = path.dirname(existente);
  return path.resolve(fs.realpathSync(existente), path.relative(existente, ruta));
}
function contiene(carpeta, ruta) {
  const relativa = path.relative(carpeta, ruta);
  return relativa === '' || (relativa !== '..' && !relativa.startsWith(`..${path.sep}`) && !path.isAbsolute(relativa));
}

try {
  if (!process.argv[2]) throw new Error('Uso: node herramientas/preparar_publicacion.cjs URL_PUBLICA [DESTINO]');
  const url = new URL(process.argv[2]);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('La URL pública debe usar HTTP o HTTPS, sin credenciales, consulta ni fragmento.');
  url.pathname = url.pathname.replace(/\/index\.html$/, '/').replace(/\/?$/, '/');
  const origen = url.href;
  const destino = rutaReal(path.resolve(process.argv[3] || path.join(proyecto, 'dist')));
  const fuente = fs.realpathSync(publicos);
  if (contiene(destino, fuente) || contiene(fuente, destino)) throw new Error('El destino debe estar separado de public y no puede sobrescribir las fuentes del proyecto.');

  const pagina = fs.readFileSync(path.join(publicos, 'index.html'), 'utf8')
    .replace(/^[ \t]*<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gim, '')
    .replace(/^[ \t]*<meta\b[^>]*\bproperty=["']og:(?:url|image)["'][^>]*>\s*/gim, '')
    .replace('</head>', `  <link rel="canonical" href="${escapar(origen)}">\n  <meta property="og:url" content="${escapar(origen)}">\n  <meta property="og:image" content="${escapar(new URL('imagenes/hero-movil.webp', origen).href)}">\n</head>`);
  fs.cpSync(publicos, destino, { recursive: true });
  fs.writeFileSync(path.join(destino, 'index.html'), pagina);
  // Los fragmentos de producto comparten documento; solo la página real pertenece al sitemap.
  fs.writeFileSync(path.join(destino, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escapar(origen)}</loc></url>\n</urlset>\n`);
  fs.writeFileSync(path.join(destino, 'robots.txt'), `User-agent: *\nAllow: ${url.pathname}\n\nSitemap: ${new URL('sitemap.xml', origen).href}\n`);
  console.log(`Publicación estática preparada en ${destino}\nURL pública: ${origen}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
