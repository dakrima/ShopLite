'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const proyecto = path.resolve(__dirname, '..');
const preparar = path.join(proyecto, 'herramientas/preparar_publicacion.cjs');
assert.ok(fs.existsSync(preparar), 'Falta la preparación de la publicación estática.');
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'shoplite-publicacion-'));
const original = fs.readFileSync(path.join(proyecto, 'public/index.html'), 'utf8');
const ejecutar = (url, destino) => spawnSync(process.execPath, [preparar, url, destino], { cwd: temporal, encoding: 'utf8' });
try {
  const destino = path.join(temporal, 'sitio');
  const resultado = ejecutar('https://tienda.example/coleccion&equipo', destino);
  assert.equal(resultado.status, 0, resultado.stderr);
  const pagina = fs.readFileSync(path.join(destino, 'index.html'), 'utf8');
  assert.match(pagina, /<link rel="canonical" href="https:\/\/tienda\.example\/coleccion&amp;equipo\/">/);
  assert.match(pagina, /<meta property="og:url" content="https:\/\/tienda\.example\/coleccion&amp;equipo\/">/);
  assert.match(pagina, /<meta property="og:image" content="https:\/\/tienda\.example\/coleccion&amp;equipo\/imagenes\/portada-sendero\.webp">/);
  const sitemap = fs.readFileSync(path.join(destino, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /<loc>https:\/\/tienda\.example\/coleccion&amp;equipo\/<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) || []).length, 1, 'Solo la página real entra en el sitemap; los fragmentos no son páginas indexables.');
  assert.doesNotMatch(sitemap, /#producto/);
  assert.match(fs.readFileSync(path.join(destino, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/tienda\.example\/coleccion&equipo\/sitemap\.xml/);
  for (const nombre of ['index.html', 'app.js', 'tienda.js', 'catalogo.js', 'estilos.css', 'imagenes', 'fuentes']) assert.ok(fs.existsSync(path.join(destino, nombre)), nombre);
  for (const nombre of ['node_modules', 'docs', 'pruebas', 'package.json', '.github', 'datos']) assert.equal(fs.existsSync(path.join(destino, nombre)), false, nombre);
  assert.equal(fs.readFileSync(path.join(proyecto, 'public/index.html'), 'utf8'), original, 'La preparación no cambia las fuentes.');

  const repetido = ejecutar('https://tienda.example/coleccion&equipo/', destino);
  assert.equal(repetido.status, 0, repetido.stderr);
  assert.equal((fs.readFileSync(path.join(destino, 'index.html'), 'utf8').match(/rel="canonical"/g) || []).length, 1);
  assert.equal(ejecutar('http://localhost:8888/index.html', path.join(temporal, 'local')).status, 0);
  for (const url of ['file:///tmp/index.html', 'javascript:alert(1)', 'https://tienda.example/#producto/1', 'https://tienda.example/?token=privado', 'https://persona:clave@tienda.example/']) {
    const invalido = ejecutar(url, path.join(temporal, 'invalido'));
    assert.notEqual(invalido.status, 0, url);
    assert.equal(fs.existsSync(path.join(temporal, 'invalido')), false, 'Una URL inválida no escribe archivos.');
  }
  for (const destinoPeligroso of [proyecto, path.join(proyecto, 'public'), path.join(proyecto, 'public/salida')]) {
    assert.notEqual(ejecutar('https://tienda.example/', destinoPeligroso).status, 0, destinoPeligroso);
  }
  const enlace = path.join(temporal, 'fuentes');
  fs.symlinkSync(path.join(proyecto, 'public'), enlace, 'dir');
  assert.notEqual(ejecutar('https://tienda.example/', path.join(enlace, 'salida')).status, 0, 'Un enlace simbólico tampoco puede sobrescribir las fuentes.');
  assert.equal(fs.readFileSync(path.join(proyecto, 'public/index.html'), 'utf8'), original);
  console.log('Publicación estática: URL, subruta, sitemap real, recursos, fuentes intactas y destinos seguros correctos.');
} finally {
  fs.rmSync(temporal, { recursive: true, force: true });
}
