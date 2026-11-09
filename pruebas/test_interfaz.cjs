'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const publicos = path.resolve(__dirname, '../public');
assert.ok(fs.existsSync(path.join(publicos, 'tienda.js')), 'La interfaz necesita la tienda local, sin peticiones al backend.');

const elementos = new Map();
const oyentes = new Map();
const elemento = (selector) => {
  if (!elementos.has(selector)) elementos.set(selector, {
    value: '', textContent: '', innerHTML: '', hidden: false, disabled: false,
    required: false, open: false, isConnected: true, dataset: {},
    addEventListener() {}, setAttribute() {}, removeAttribute() {}, remove() {}, append() {},
    close() { this.open = false; }, showModal() { this.open = true; },
    classList: { toggle() {} }, querySelectorAll: () => [],
    querySelector: () => elemento(`${selector} button`),
  });
  return elementos.get(selector);
};
const almacenamiento = () => {
  const valores = new Map();
  return { getItem: (clave) => valores.get(clave) ?? null, setItem: (clave, valor) => valores.set(clave, String(valor)), removeItem: (clave) => valores.delete(clave) };
};
const contexto = vm.createContext({
  console, Intl, URL, URLSearchParams,
  localStorage: almacenamiento(), sessionStorage: almacenamiento(),
  setTimeout: () => 0, clearTimeout() {},
  fetch: () => { throw new Error('El mockup no debe realizar peticiones.'); },
  document: {
    title: 'SUR Equipados para salir | ShopLite', baseURI: 'file:///ShopLite/public/index.html',
    querySelector: elemento, querySelectorAll: () => [], addEventListener: (tipo, manejador) => oyentes.set(tipo, manejador),
    createElement: () => elemento('elemento-nuevo'), head: { append() {} }, body: { append() {} },
  },
  window: { location: { hash: '', href: 'file:///ShopLite/public/index.html' }, history: { pushState() {}, replaceState() {} }, addEventListener() {} },
  FormData: class { constructor(formulario) { return Object.entries(formulario.datos); } },
});
for (const nombre of ['catalogo.js', 'tienda.js', 'app.js']) {
  const codigo = fs.readFileSync(path.join(publicos, nombre), 'utf8');
  vm.runInContext(nombre === 'app.js' ? codigo.replace(/iniciar\(\);\s*$/, '') : codigo, contexto, { filename: nombre });
}
const ejecutar = (codigo) => vm.runInContext(codigo, contexto);

(async () => {
  ejecutar(`
    tienda.guardarCarrito({ lineas: [{ producto_id: 1, variante_id: '1-1', cantidad: 2 }], favoritos: [1] });
    estado.productos = tienda.catalogo().productos;
    estado.lineas = tienda.carrito().lineas;
    estado.favoritos = tienda.carrito().favoritos;
  `);
  ejecutar('pintarCatalogo(); pintarCarrito();');
  assert.equal((elemento('#productos').innerHTML.match(/class="producto"/g) || []).length, 8);
  assert.match(elemento('#productos').innerHTML, /src="\.\/imagenes\/chaqueta-ventisquero\.webp\?v=sendero-1"/);
  assert.equal(ejecutar(`imagenActual('https://fotos.example/prenda.jpg?firma=abc')`), 'https://fotos.example/prenda.jpg?firma=abc', 'Las imágenes externas conservan su URL.');
  assert.match(elemento('#productos').innerHTML, /class="muestra-color"[^>]*data-producto="1"[^>]*data-color="Negro"/);
  assert.match(elemento('#productos').innerHTML, /\.\/iconos\/corazon-lleno\.svg/);
  assert.doesNotMatch(elemento('#productos').innerHTML, /FAVORITO DEL CAMINO|[♥♡]/);
  assert.match(elemento('#contenido-carrito').innerHTML, /role="progressbar"[^>]*aria-valuenow="80000"[^>]*aria-valuemax="80000"/);
  assert.match(elemento('#contenido-carrito').innerHTML, /class="progreso-envio-barra" style="width:100%"/);
  ejecutar(`estado.lineas = [estado.lineas[0]]; estado.lineas[0].cantidad = 1; pintarCarrito();`);
  assert.match(elemento('#contenido-carrito').innerHTML, /aria-valuenow="49990"/);
  assert.match(elemento('#contenido-carrito').innerHTML, /Te faltan \$30\.010/);
  assert.match(elemento('#contenido-carrito').innerHTML, /\.\/iconos\/menos\.svg/);
  const porcentajeEnvio = Number(elemento('#contenido-carrito').innerHTML.match(/progreso-envio-barra" style="width:([\d.]+)%/)[1]);
  assert.ok(porcentajeEnvio > 0 && porcentajeEnvio < 100);
  ejecutar(`
    const abrirFichaOriginal = abrirFicha;
    const actualizarTallasOriginal = actualizarTallas;
    abrirFicha = (identificador) => { estado.productoActual = estado.productos.find((producto) => producto.id === identificador); };
    actualizarTallas = () => { globalThis.colorSeleccionado = $('#color-ficha').value; };
  `);
  const botonColor = { dataset: { producto: '1', color: 'Negro' }, tagName: 'BUTTON', hasAttribute: () => false };
  await oyentes.get('click')({ target: { closest: () => botonColor }, preventDefault() {} });
  assert.equal(ejecutar('colorSeleccionado'), 'Negro', 'La muestra abre la ficha con el color escogido.');
  ejecutar(`abrirFicha = abrirFichaOriginal; actualizarTallas = actualizarTallasOriginal; estado.lineas = tienda.carrito().lineas;`);
  elemento('#envio-checkout').value = 'domicilio';
  elemento('#region-checkout').value = 'Metropolitana de Santiago';
  await ejecutar(`actualizarEnvio('SUR10')`);
  assert.equal(elemento('#total-checkout').textContent, '$89.982');
  assert.equal(elemento('#descuento-checkout').textContent, '−$9.998');
  assert.equal(elemento('#precio-envio').textContent, 'Gratis');

  await ejecutar(`actualizarEnvio('SUR5000')`);
  assert.equal(elemento('#total-checkout').textContent, '$94.980');
  await ejecutar(`actualizarEnvio('NOEXISTE', true)`);
  assert.equal(ejecutar('estado.cupon'), 'SUR5000', 'Un cupón inválido conserva el descuento anterior.');
  assert.match(elemento('#estado-cupon').textContent, /Cupón no aplicado:/);
  assert.equal(elemento('#formulario-checkout button').disabled, false);
  elemento('#envio-checkout').value = 'retiro';
  await ejecutar(`actualizarEnvio(null)`);
  assert.equal(elemento('#total-checkout').textContent, '$99.980');
  assert.equal(elemento('#campos-direccion').hidden, true);

  ejecutar(`
    const pedidoPrueba = tienda.crearPedido({ nombre: '<Ana>', email: 'ana@example.com', envio: 'retiro', region: 'Metropolitana de Santiago', lineas: lineasParaGuardar() }).pedido;
    tienda.pagarPedido(pedidoPrueba.id, 'aprobado');
    tienda.publicarResena(1, { calificacion: 5, comentario: '<img src=x onerror="alert(1)">' });
    estado.productoActual = tienda.catalogo().productos.find((producto) => producto.id === 1);
  `);
  await ejecutar(`cargarResenas(1)`);
  assert.match(elemento('#contenido-resenas').innerHTML, /&lt;Ana&gt;/);
  assert.match(elemento('#contenido-resenas').innerHTML, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(elemento('#contenido-resenas').innerHTML, /<img|<form/);

  ejecutar(`tienda.ingresar('SurDemo2026!'); estado.sesion = tienda.sesion(); estado.tabAdmin = 'cupones';`);
  await ejecutar(`pintarCupones()`);
  assert.match(elemento('#vista-admin').innerHTML, /SUR10/);
  assert.match(elemento('#vista-admin').innerHTML, /SUR5000/);
  const patronCupon = elemento('#vista-admin').innerHTML.match(/pattern="([^"]+)"/)[1];
  assert.doesNotThrow(() => new RegExp(patronCupon, 'v'));

  ejecutar(`
    tienda.guardarCarrito({ lineas: [{ producto_id: 1, variante_id: '1-1', cantidad: 1 }], favoritos: [1] });
    estado.lineas = tienda.carrito().lineas;
  `);
  elemento('#precio-1').value = '54990';
  elemento('#anterior-1').value = '69990';
  const boton = { disabled: false };
  contexto.botonPrueba = boton;
  await ejecutar(`guardarPrecio(1, botonPrueba)`);
  assert.equal(ejecutar('estado.productos.find((producto) => producto.id === 1).precio'), 54990);
  assert.equal(ejecutar('estado.lineas[0].producto.precio'), 54990, 'El cambio de precio se refleja también en el carrito visible.');
  assert.equal(boton.disabled, false);
  await ejecutar(`abrirCheckout()`);
  assert.match(elemento('#contenido-checkout').innerHTML, /id="resultado-pago"/, 'El resultado de pago se elige en la misma vista que la dirección y el resumen.');
  assert.match(elemento('#contenido-checkout').innerHTML, /id="confirmar-compra"/);
  elemento('#resultado-pago').value = 'rechazado';
  contexto.formularioPrueba = { datos: { nombre: 'Ana Pérez', email: 'ana@example.com', envio: 'retiro', region: 'Metropolitana de Santiago' }, querySelector: () => elemento('#confirmar-compra') };
  const pedidosAntes = ejecutar('tienda.pedidos().pedidos.length');
  const stockAntes = ejecutar('tienda.catalogo().productos[0].variantes[0].stock');
  await ejecutar(`crearPedido(formularioPrueba)`);
  const pedidoPendiente = ejecutar('estado.pedidoActual.id');
  assert.equal(ejecutar('estado.pedidoActual.estado'), 'pendiente');
  assert.match(elemento('#estado-pago-checkout').textContent, /rechazado/i);
  assert.equal(ejecutar('tienda.pedidos().pedidos.length'), pedidosAntes + 1);
  ejecutar(`tienda.actualizarProducto(1, { precio: 59990, precio_anterior: 69990 }); tienda.guardarCarrito({ lineas: [], favoritos: [] }); estado.lineas = [];`);
  await ejecutar(`retomarPago(${pedidoPendiente})`);
  assert.match(elemento('#contenido-checkout').innerHTML, /id="formulario-checkout"/);
  assert.equal(ejecutar('estado.pedidoActual.id'), pedidoPendiente);
  assert.equal(elemento('#total-checkout').textContent, '$54.990', 'Retomar conserva el total original aunque cambien el catálogo o el carrito.');
  elemento('#resultado-pago').value = 'aprobado';
  await Promise.all([ejecutar(`crearPedido(formularioPrueba)`), ejecutar(`crearPedido(formularioPrueba)`)]);
  assert.equal(ejecutar('tienda.pedidos().pedidos.length'), pedidosAntes + 1, 'Reintentar o pulsar dos veces no crea otro pedido.');
  assert.equal(ejecutar('tienda.catalogo().productos[0].variantes[0].stock'), stockAntes - 1);
  assert.match(elemento('#contenido-checkout').innerHTML, /id="resultado-pedidos"/);
  console.log('Interfaz local: colores, iconos, avance de envío, cupones, reseñas, precios y checkout único correctos; sin peticiones.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
