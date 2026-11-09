'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const almacenamiento = () => {
  const valores = new Map();
  return { getItem: (clave) => valores.get(clave) ?? null, setItem: (clave, valor) => valores.set(clave, valor), removeItem: (clave) => valores.delete(clave) };
};
function cargar(localStorage = almacenamiento(), sessionStorage = almacenamiento()) {
  assert.ok(fs.existsSync(path.join(base, 'public/tienda.js')), 'Falta la tienda local de frontend');
  const contexto = vm.createContext({ localStorage, sessionStorage, console });
  vm.runInContext(fs.readFileSync(path.join(base, 'public/catalogo.js'), 'utf8'), contexto);
  vm.runInContext(fs.readFileSync(path.join(base, 'public/tienda.js'), 'utf8') + '\nglobalThis.resultado = tienda;', contexto);
  return contexto.resultado;
}
let comprobaciones = 0;
function probar(nombre, accion) { accion(); comprobaciones++; console.log('OK', nombre); }
const datosPedido = (lineas, extras = {}) => ({ nombre: 'Ana Pérez', email: 'ana@example.com', direccion: 'Calle 123', comuna: 'Providencia', region: 'Metropolitana de Santiago', envio: 'domicilio', lineas, ...extras });
const linea = [{ producto_id: 1, variante_id: '1-1', cantidad: 1 }];

probar('catálogo independiente y carrito persistente al recargar', () => {
  const guardado = almacenamiento();
  const tienda = cargar(guardado);
  assert.equal(tienda.catalogo().productos.length, 8);
  const catalogo = tienda.catalogo(); catalogo.productos[0].nombre = 'Cambiado';
  assert.notEqual(tienda.catalogo().productos[0].nombre, 'Cambiado');
  tienda.guardarCarrito({ lineas: linea, favoritos: [1] });
  const recargada = cargar(guardado).carrito();
  assert.equal(recargada.lineas[0].producto.nombre, 'Cortaviento Ventisquero');
  assert.equal(recargada.lineas[0].variante.id, '1-1');
  assert.equal(recargada.favoritos[0], 1);
  assert.throws(() => tienda.guardarCarrito({ lineas: [{ ...linea[0], cantidad: 9999 }], favoritos: [] }), /cantidad|stock/i);
});
probar('cupones, redondeo y envío según subtotal descontado', () => {
  const tienda = cargar();
  const normal = tienda.cotizar(datosPedido(linea));
  assert.equal(normal.total, 53980);
  assert.equal(tienda.cotizar(datosPedido(linea, { cupon: 'SUR10' })).descuento, 4999);
  assert.equal(tienda.cotizar(datosPedido(linea, { cupon: 'SUR5000' })).descuento, 5000);
  assert.equal(tienda.cotizar(datosPedido(linea, { envio: 'retiro' })).costo_envio, 0);
  assert.equal(tienda.cotizar(datosPedido(linea, { region: 'Los Ríos' })).costo_envio, 6990);
  const dos = [{ ...linea[0], cantidad: 2 }];
  assert.equal(tienda.cotizar(datosPedido(dos)).costo_envio, 0);
  tienda.ingresar('SurDemo2026!');
  tienda.crearCupon({ codigo: 'MENOS30', tipo: 'porcentaje', valor: 30, activo: true });
  assert.equal(tienda.cotizar(datosPedido(dos, { cupon: 'MENOS30' })).costo_envio, 3990);
  assert.throws(() => tienda.cotizar(datosPedido(linea, { cupon: 'INVALIDO' })), /cupón/i);
  tienda.actualizarCupon('SUR10', { activo: false });
  assert.throws(() => tienda.cotizar(datosPedido(linea, { cupon: 'SUR10' })), /cupón/i);
  assert.throws(() => tienda.crearCupon({ codigo: 'MUCHO', tipo: 'porcentaje', valor: 101, activo: true }), /valor|porcentaje/i);
});
probar('pago rechazado, aprobado idempotente y estado del pedido', () => {
  const tienda = cargar();
  tienda.guardarCarrito({ lineas: linea, favoritos: [1] });
  const stock = tienda.catalogo().productos[0].variantes[0].stock;
  const { pedido } = tienda.crearPedido(datosPedido(linea));
  assert.equal(pedido.estado, 'pendiente');
  tienda.pagarPedido(pedido.id, 'rechazado');
  assert.equal(tienda.catalogo().productos[0].variantes[0].stock, stock);
  tienda.pagarPedido(pedido.id, 'aprobado');
  tienda.pagarPedido(pedido.id, 'aprobado');
  assert.equal(tienda.catalogo().productos[0].variantes[0].stock, stock - 1);
  assert.equal(tienda.carrito().lineas.length, 0);
  assert.equal(tienda.carrito().favoritos[0], 1);
  assert.equal(tienda.pedidos().pedidos[0].estado, 'pagado');
  tienda.ingresar('SurDemo2026!');
  assert.throws(() => tienda.cambiarEstado(pedido.id, 'entregado'), /estado|avance/i);
  tienda.cambiarEstado(pedido.id, 'enviado');
  tienda.cambiarEstado(pedido.id, 'entregado');
  assert.equal(tienda.pedidos().pedidos[0].estado, 'entregado');
  assert.equal(tienda.correos().correos.length, 2);
  assert.ok(tienda.correos().correos.every((correo) => correo.simulado && correo.estado === 'enviado'));
});
probar('reseñas después de comprar, una por producto y texto conservado', () => {
  const tienda = cargar();
  assert.equal(tienda.resenas(1).puede_resenar, false);
  assert.throws(() => tienda.publicarResena(1, { calificacion: 5, comentario: 'Bien' }), /compra/i);
  const { pedido } = tienda.crearPedido(datosPedido(linea)); tienda.pagarPedido(pedido.id, 'aprobado');
  assert.equal(tienda.resenas(1).puede_resenar, true);
  const comentario = '<img src=x onerror="alert(1)">';
  tienda.publicarResena(1, { calificacion: 5, comentario });
  const resenas = tienda.resenas(1);
  assert.equal(resenas.resenas[0].nombre, 'Ana');
  assert.equal(resenas.resenas[0].comentario, comentario);
  assert.equal(resenas.promedio, 5);
  assert.equal(resenas.puede_resenar, false);
  assert.throws(() => tienda.publicarResena(1, { calificacion: 4, comentario: 'Otro' }), /opinión|reseña/i);
});
probar('administración, inventario, producto y validación de imágenes', () => {
  const tienda = cargar();
  assert.throws(() => tienda.inventario(), /Administración/i);
  assert.throws(() => tienda.ingresar('otra'), /clave/i);
  tienda.ingresar('SurDemo2026!');
  assert.equal(tienda.sesion().comerciante, true);
  tienda.guardarInventario('1-1', { stock: 2, umbral: 3 });
  assert.equal(tienda.inventario().variantes[0].stock_bajo, true);
  tienda.actualizarProducto(1, { precio: 45000, precio_anterior: 55000 });
  assert.equal(tienda.catalogo().productos[0].precio, 45000);
  assert.throws(() => tienda.actualizarProducto(1, { precio: -1 }), /precio/i);
  const producto = { nombre: 'Mochila prueba', categoria: 'Mochilas', descripcion: 'Ligera', precio: 1000, precio_anterior: null, imagenes: ['./imagenes/hero-movil.webp'], variantes: [{ talla: 'Única', color: 'Verde', stock: 5 }] };
  assert.throws(() => tienda.publicarProducto({ ...producto, imagenes: ['javascript:alert(1)'] }), /imagen|HTTPS/i);
  const nuevo = tienda.publicarProducto(producto).producto;
  assert.equal(nuevo.id, 9);
  assert.equal(tienda.catalogo().productos.length, 9);
  tienda.salir(); assert.equal(tienda.sesion().comerciante, false);
});
probar('almacenamiento dañado recupera semilla y fallo de escritura no muta datos', () => {
  const guardado = almacenamiento();
  guardado.setItem('shoplite-frontend-v1', '{datos rotos');
  const tienda = cargar(guardado);
  assert.equal(tienda.catalogo().productos.length, 8);
  guardado.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => tienda.guardarCarrito({ lineas: linea, favoritos: [] }), /guardar|almacenamiento/i);
  assert.equal(tienda.carrito().lineas.length, 0);
});
console.log(`${comprobaciones} pruebas de tienda local correctas.`);
