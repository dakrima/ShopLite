'use strict';

const $ = (selector) => document.querySelector(selector);
const pesos = (valor) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor);
const escapar = (valor) => String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caracter]));
const icono = (nombre, clase = '') => `<img class="icono-grafico ${escapar(clase)}" src="./iconos/${escapar(nombre)}.svg" alt="" aria-hidden="true">`;
const coloresMuestra = { Musgo: '#43523c', Negro: '#292b29', Bosque: '#344b3e', Arena: '#d2c5ad', Grafito: '#555b5d', Oliva: '#6c714d', Terracota: '#b35d3b', Piedra: '#8d8a7a', Crudo: '#e6dfcb' };
const estado = { productos: [], lineas: [], favoritos: [], sesion: {}, categoria: 'Todas', busqueda: '', orden: 'destacados', soloFavoritos: false, soloOfertas: false, ocupado: false, productoActual: null, varianteActual: null, pedidoActual: null, tabAdmin: 'productos', cupon: null, cotizacion: null };
let temporizadorAviso;
let solicitudCotizacion = 0;

function avisar(mensaje) {
  clearTimeout(temporizadorAviso);
  const aviso = $('#aviso');
  const dialogo = [...document.querySelectorAll('dialog[open]')].at(-1);
  (dialogo || document.body).append(aviso);
  aviso.textContent = mensaje;
  aviso.hidden = false;
  temporizadorAviso = setTimeout(() => { $('#aviso').hidden = true; }, 4500);
}
function abrirDialogo(selector) {
  const dialogo = $(selector);
  if (!dialogo.open) dialogo.showModal();
}
function lineasParaGuardar(lineas = estado.lineas) {
  return lineas.map(({ producto_id, variante_id, cantidad }) => ({ producto_id, variante_id, cantidad }));
}
function actualizarContadores() {
  const cantidad = estado.lineas.reduce((total, linea) => total + linea.cantidad, 0);
  $('#cantidad-carrito').textContent = cantidad;
  $('#ver-carrito').setAttribute('aria-label', `Abrir carrito, ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`);
  $('#cantidad-favoritos').textContent = estado.favoritos.length;
  $('#cantidad-favoritos').hidden = !estado.favoritos.length;
  $('#ver-favoritos').setAttribute('aria-pressed', String(estado.soloFavoritos));
}
async function guardarCarrito(lineas, favoritos = estado.favoritos) {
  if (estado.ocupado) return false;
  estado.ocupado = true;
  try {
    const contenido = await tienda.guardarCarrito({ lineas: lineasParaGuardar(lineas), favoritos });
    estado.lineas = contenido.lineas;
    estado.favoritos = contenido.favoritos;
    actualizarContadores();
    pintarCatalogo();
    if ($('#dialogo-carrito').open) pintarCarrito();
    return true;
  } finally { estado.ocupado = false; }
}
function seleccionarCategoria(categoria) {
  estado.categoria = categoria;
  estado.soloFavoritos = false;
  estado.soloOfertas = false;
  $('#menu-movil')?.removeAttribute('open');
  pintarCatalogo();
  $('#catalogo').scrollIntoView({ behavior: 'smooth' });
}
function pintarCatalogo() {
  let productos = estado.productos.filter((producto) => (estado.categoria === 'Todas' || producto.categoria === estado.categoria) && (!estado.soloFavoritos || estado.favoritos.includes(producto.id)) && (!estado.soloOfertas || producto.precio_anterior > producto.precio) && `${producto.nombre} ${producto.categoria} ${producto.descripcion}`.toLocaleLowerCase('es').includes(estado.busqueda.toLocaleLowerCase('es')));
  if (estado.orden === 'precio-menor') productos.sort((a, b) => a.precio - b.precio);
  if (estado.orden === 'precio-mayor') productos.sort((a, b) => b.precio - a.precio);
  if (estado.orden === 'nombre') productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  $('#titulo-catalogo').textContent = estado.soloFavoritos ? 'Tus próximos destinos.' : estado.soloOfertas ? 'Buenas oportunidades.' : 'Listos para salir.';
  $('#resumen-catalogo').textContent = `${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}${estado.soloFavoritos ? ' en tus favoritos' : ''}`;
  $('#limpiar-filtros').hidden = !(estado.soloFavoritos || estado.soloOfertas || estado.categoria !== 'Todas' || estado.busqueda);
  document.querySelectorAll('.categorias [data-categoria]').forEach((boton) => { const activo = boton.dataset.categoria === estado.categoria; boton.classList.toggle('activa', activo); boton.setAttribute('aria-pressed', String(activo)); });
  $('#productos').setAttribute('aria-busy', 'false');
  $('#productos').innerHTML = productos.length ? productos.map((producto) => {
    const favorito = estado.favoritos.includes(producto.id);
    const stock = producto.variantes.reduce((total, variante) => total + variante.stock, 0);
    const colores = [...new Set(producto.variantes.map((variante) => variante.color))];
    const oferta = producto.precio_anterior > producto.precio;
    return `<article class="producto"><div class="producto-foto"><a class="abrir-producto" href="#producto/${producto.id}" data-producto="${producto.id}" aria-label="Ver ${escapar(producto.nombre)}"><img src="${escapar(producto.imagenes[0])}" alt="${escapar(producto.nombre)}" loading="lazy" fetchpriority="low" width="400" height="470"></a>${stock === 0 ? '<span class="etiqueta">AGOTADO</span>' : oferta ? '<span class="etiqueta oferta">ÚLTIMA OPORTUNIDAD</span>' : ''}<button type="button" class="favorito${favorito ? ' seleccionado' : ''}" data-favorito="${producto.id}" aria-label="${favorito ? 'Quitar' : 'Guardar'} ${escapar(producto.nombre)} ${favorito ? 'de' : 'en'} favoritos" aria-pressed="${favorito}">${icono(favorito ? 'corazon-lleno' : 'corazon')}</button></div><div class="producto-info"><span class="ceja">${escapar(producto.categoria)}</span><a class="producto-titulo" href="#producto/${producto.id}" data-producto="${producto.id}">${escapar(producto.nombre)}</a><p class="precio">${pesos(producto.precio)}${oferta ? `<del>${pesos(producto.precio_anterior)}</del>` : ''}</p><div class="colores-producto" role="group" aria-label="Colores de ${escapar(producto.nombre)}">${colores.map((color) => `<button type="button" class="muestra-color" data-producto="${producto.id}" data-color="${escapar(color)}" style="--color:${Object.hasOwn(coloresMuestra, color) ? coloresMuestra[color] : '#8a8b82'}" aria-label="${escapar(producto.nombre)}, color ${escapar(color)}" title="${escapar(color)}"></button>`).join('')}</div><div class="detalle-producto"><span>${colores.length} ${colores.length === 1 ? 'color' : 'colores'}, ${stock ? 'disponible' : 'sin stock'}</span></div><button type="button" class="agregar-rapido" data-producto="${producto.id}" aria-label="Elegir variante de ${escapar(producto.nombre)}">${icono('mas')}</button></div></article>`;
  }).join('') : `<div class="sin-resultados"><h3>${estado.soloFavoritos ? 'Guarda tu próxima aventura.' : 'Todavía hay caminos por encontrar.'}</h3><p>${estado.soloFavoritos ? 'Toca el corazón en un producto para guardarlo aquí.' : 'Prueba otra búsqueda o limpia los filtros.'}</p><button class="texto-boton" data-limpiar style="margin-top:20px">Ver todo el equipo ↗</button></div>`;
  actualizarContadores();
}
function limpiarFiltros() {
  estado.categoria = 'Todas'; estado.busqueda = ''; estado.soloFavoritos = false; estado.soloOfertas = false;
  $('#busqueda').value = '';
  pintarCatalogo();
}
const tituloInicio = document.title;
const descripcionInicio = $('meta[name="description"]').content;
function actualizarMetadatos(producto) {
  document.title = producto ? `${producto.nombre} | SUR` : tituloInicio;
  $('meta[name="description"]').content = producto ? producto.descripcion : descripcionInicio;
  $('#datos-producto')?.remove();
  if (!producto) return;
  const datos = document.createElement('script');
  datos.id = 'datos-producto';
  datos.type = 'application/ld+json';
  datos.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: producto.nombre, description: producto.descripcion, image: producto.imagenes.map((imagen) => new URL(imagen, document.baseURI).href), offers: { '@type': 'Offer', priceCurrency: 'CLP', price: producto.precio, availability: producto.variantes.some((variante) => variante.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } });
  document.head.append(datos);
}
function abrirFicha(identificador, actualizarRuta = true) {
  const producto = estado.productos.find((elemento) => elemento.id === identificador);
  if (!producto) return;
  estado.productoActual = producto;
  estado.varianteActual = producto.variantes.find((variante) => variante.stock > 0) || producto.variantes[0];
  const colores = [...new Set(producto.variantes.map((variante) => variante.color))];
  $('#contenido-ficha').innerHTML = `<div class="galeria"><img class="foto-principal" id="foto-principal" src="${escapar(producto.imagenes[0])}" alt="${escapar(producto.nombre)}" width="475" height="490"><div class="miniaturas">${producto.imagenes.map((imagen, indice) => `<button class="${indice === 0 ? 'activa' : ''}" data-imagen="${indice}" aria-label="Ver imagen ${indice + 1}" aria-pressed="${indice === 0}"><img src="${escapar(imagen)}" alt="Vista ${indice + 1}"></button>`).join('')}</div></div><div class="ficha-info"><span class="ceja verde">SUR / ${escapar(producto.categoria)}</span><h2 id="titulo-ficha">${escapar(producto.nombre)}</h2><p class="precio">${pesos(producto.precio)}${producto.precio_anterior > producto.precio ? `<del>${pesos(producto.precio_anterior)}</del>` : ''}</p><p class="descripcion">${escapar(producto.descripcion)}</p><label class="campo">Color<select id="color-ficha">${colores.map((color) => `<option${color === estado.varianteActual.color ? ' selected' : ''}>${escapar(color)}</option>`).join('')}</select></label><label class="campo">Talla<select id="talla-ficha"></select></label><p class="stock" id="stock-ficha"></p><button class="boton" id="agregar-carrito">Agregar a la bolsa <span>↗</span></button><button class="texto-boton" id="favorito-ficha" data-favorito="${producto.id}" style="margin-top:18px">${icono(estado.favoritos.includes(producto.id) ? 'corazon-lleno' : 'corazon')}<span>${estado.favoritos.includes(producto.id) ? 'Guardado en favoritos' : 'Guardar para después'}</span></button><p class="nota">Retiro gratuito y despacho a todo Chile<br>Envío gratis en compras desde $80.000.</p></div>`;
  actualizarTallas();
  abrirDialogo('#dialogo-ficha');
  actualizarMetadatos(producto);
  if (actualizarRuta && window.location.hash !== `#producto/${producto.id}`) window.history.pushState({ ficha: true }, '', `#producto/${producto.id}`);
  $('#contenido-ficha').insertAdjacentHTML('beforeend', `<section class="resenas" aria-labelledby="titulo-resenas"><div class="resenas-cabecera"><div><span class="ceja verde">HISTORIAS DEL CAMINO</span><h3 id="titulo-resenas">Quienes ya salieron.</h3></div><a class="texto-boton" href="#producto/${producto.id}">Enlace al producto ↗</a></div><div id="contenido-resenas"><p class="nota">Cargando opiniones…</p></div></section>`);
  cargarResenas(producto.id).catch((error) => { if (estado.productoActual?.id === producto.id && $('#contenido-resenas')) $('#contenido-resenas').innerHTML = `<p class="error-mensaje">${escapar(error.message)}</p>`; });
}
async function cargarResenas(identificador) {
  const contenido = await tienda.resenas(identificador);
  if (estado.productoActual?.id !== identificador || !$('#contenido-resenas')) return;
  $('#contenido-resenas').innerHTML = `<p class="resenas-resumen">${contenido.total ? `<strong>${Number(contenido.promedio).toLocaleString('es-CL', { maximumFractionDigits: 1 })} / 5</strong> de ${contenido.total} ${contenido.total === 1 ? 'opinión' : 'opiniones'}` : 'Sé la primera persona en contar cómo te fue.'}</p>${contenido.resenas.map((resena) => `<article class="resena"><div class="resena-encabezado"><strong>${escapar(resena.nombre)}</strong><span aria-label="${Number(resena.calificacion)} de 5 estrellas">${'★'.repeat(Number(resena.calificacion))}${'☆'.repeat(5 - Number(resena.calificacion))}</span></div><p class="compra-verificada">Compra verificada</p><p class="resena-comentario">${escapar(resena.comentario)}</p><time datetime="${escapar(resena.fecha)}">${new Date(resena.fecha).toLocaleDateString('es-CL')}</time></article>`).join('')}${contenido.puede_resenar ? `<form id="formulario-resena" class="formulario-resena"><h4>Tu experiencia ayuda a elegir.</h4><label class="campo">Calificación<select name="calificacion" required><option value="5">5 estrellas</option><option value="4">4 estrellas</option><option value="3">3 estrellas</option><option value="2">2 estrellas</option><option value="1">1 estrella</option></select></label><label class="campo">Cuéntanos tu experiencia<textarea name="comentario" required minlength="1" maxlength="2000" placeholder="¿Cómo te acompañó este equipo?"></textarea></label><button class="boton" type="submit">Publicar opinión ↗</button></form>` : '<p class="nota">Las opiniones se habilitan después de comprar este producto y confirmar el pago. Puedes compartir una opinión por producto comprado.</p>'}`;
}
async function publicarResena(formulario) {
  const boton = formulario.querySelector('[type="submit"]');
  boton.disabled = true;
  try {
    const datos = Object.fromEntries(new FormData(formulario));
    await tienda.publicarResena(estado.productoActual.id, { calificacion: Number(datos.calificacion), comentario: datos.comentario.trim() });
    await cargarResenas(estado.productoActual.id);
    avisar('Gracias. Tu opinión ya acompaña a este equipo.');
  } finally { boton.disabled = false; }
}
function actualizarTallas() {
  const variantes = estado.productoActual.variantes.filter((variante) => variante.color === $('#color-ficha').value);
  $('#talla-ficha').innerHTML = variantes.map((variante) => `<option value="${escapar(variante.id)}"${variante.id === estado.varianteActual?.id ? ' selected' : ''}>${escapar(variante.talla)}${variante.stock ? '' : ' — Agotada'}</option>`).join('');
  actualizarVariante();
}
function actualizarVariante() {
  estado.varianteActual = estado.productoActual.variantes.find((variante) => variante.id === $('#talla-ficha').value);
  $('#stock-ficha').textContent = estado.varianteActual.stock ? `${estado.varianteActual.stock} unidades disponibles` : 'Esta combinación está agotada. Prueba otra talla o color.';
  $('#agregar-carrito').disabled = !estado.varianteActual.stock;
}
async function agregarAlCarrito() {
  if (estado.ocupado || !estado.varianteActual?.stock) return;
  const producto = estado.productoActual;
  const variante = estado.varianteActual;
  const lineas = lineasParaGuardar();
  const existente = lineas.find((linea) => linea.producto_id === producto.id && linea.variante_id === variante.id);
  if (existente) existente.cantidad += 1;
  else lineas.push({ producto_id: producto.id, variante_id: variante.id, cantidad: 1 });
  if (await guardarCarrito(lineas)) { $('#dialogo-ficha').close(); pintarCarrito(); abrirDialogo('#dialogo-carrito'); avisar('Listo. Tu equipo está en la bolsa.'); }
}
async function alternarFavorito(identificador) {
  const favoritos = estado.favoritos.includes(identificador) ? estado.favoritos.filter((id) => id !== identificador) : [...estado.favoritos, identificador];
  if (await guardarCarrito(estado.lineas, favoritos)) {
    const boton = $('#favorito-ficha');
    if (boton) boton.innerHTML = `${icono(estado.favoritos.includes(identificador) ? 'corazon-lleno' : 'corazon')}<span>${estado.favoritos.includes(identificador) ? 'Guardado en favoritos' : 'Guardar para después'}</span>`;
    avisar(estado.favoritos.includes(identificador) ? 'Guardado para tu próxima salida.' : 'Producto quitado de favoritos.');
  }
}
function subtotalCarrito() {
  return estado.lineas.reduce((total, linea) => total + (linea.producto?.precio || 0) * linea.cantidad, 0);
}
function pintarCarrito() {
  const subtotal = subtotalCarrito();
  const avanceEnvio = Math.min(subtotal, 80000);
  const mensajeEnvio = subtotal >= 80000 ? 'Tu compra tiene envío gratis a todo Chile.' : `Te faltan ${pesos(80000 - subtotal)} para envío gratis.`;
  $('#contenido-carrito').innerHTML = estado.lineas.length ? `<div class="envio-bolsa"><p class="nota">${mensajeEnvio}</p><div class="progreso-envio" role="progressbar" aria-label="Avance para envío gratis" aria-valuemin="0" aria-valuenow="${avanceEnvio}" aria-valuemax="80000" aria-valuetext="${escapar(mensajeEnvio)}"><span class="progreso-envio-barra" style="width:${avanceEnvio / 80000 * 100}%"></span></div></div>${estado.lineas.map((linea, indice) => `<article class="linea-carrito"><img src="${escapar(linea.producto.imagenes[0])}" alt="${escapar(linea.producto.nombre)}"><div><h3>${escapar(linea.producto.nombre)}</h3><p class="variante">${escapar(linea.variante.color)} / ${escapar(linea.variante.talla)}</p><p class="precio">${pesos(linea.producto.precio * linea.cantidad)}</p><div class="controles-linea"><div class="cantidad"><button type="button" data-cantidad="${indice}" data-cambio="-1" aria-label="Reducir cantidad de ${escapar(linea.producto.nombre)}">${icono('menos')}</button><span>${linea.cantidad}</span><button type="button" data-cantidad="${indice}" data-cambio="1" aria-label="Aumentar cantidad de ${escapar(linea.producto.nombre)}"${linea.cantidad >= linea.variante.stock ? ' disabled' : ''}>${icono('mas')}</button></div><button class="eliminar" data-eliminar="${indice}">Quitar</button></div></div></article>`).join('')}<div class="resumen-compra"><div class="fila-total total"><span>Subtotal</span><span>${pesos(subtotal)}</span></div><p class="nota">El envío se calcula con tu dirección. Retiro siempre gratis.</p><button class="boton ancho" id="ir-checkout">Continuar con la compra ${icono('flecha-arriba-derecha')}</button><button class="texto-boton" data-cerrar style="margin-top:20px">Seguir explorando</button></div>` : `<div class="vacio"><h3>Tu bolsa pide aventura.</h3><p>Elige tu equipo y empieza a planear la próxima salida.</p><button class="boton" data-cerrar>Explorar el equipo ${icono('flecha-arriba-derecha')}</button></div>`;
}
async function cambiarCantidad(indice, cambio, quitar = false) {
  const lineas = lineasParaGuardar();
  if (!lineas[indice]) return;
  lineas[indice].cantidad = quitar ? 0 : lineas[indice].cantidad + cambio;
  await guardarCarrito(lineas.filter((linea) => linea.cantidad > 0));
}
const regiones = ['Metropolitana de Santiago', 'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', "O’Higgins", 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'];
function abrirCheckout(pedido = null) {
  if (!pedido && !estado.lineas.length) return;
  estado.pedidoActual = pedido;
  const lineas = pedido ? pedido.lineas.map((linea) => ({ ...linea, producto: { nombre: linea.nombre, precio: linea.precio }, variante: { color: linea.color, talla: linea.talla } })) : estado.lineas;
  $('#dialogo-carrito').close();
  $('#contenido-checkout').innerHTML = `<form id="formulario-checkout" class="formulario-checkout"><div><fieldset id="datos-entrega"><label class="campo">Nombre completo<input name="nombre" autocomplete="name" required maxlength="100" placeholder="Tu nombre y apellido"></label><label class="campo">Correo electrónico<input name="email" type="email" autocomplete="email" required maxlength="200" placeholder="tu@correo.cl"></label><label class="campo">¿Cómo quieres recibirlo?<select name="envio" id="envio-checkout"><option value="domicilio">Despacho a domicilio</option><option value="retiro">Retiro gratuito en tienda</option></select></label><div id="campos-direccion"><label class="campo">Dirección<input name="direccion" autocomplete="street-address" maxlength="250" required placeholder="Calle, número, departamento"></label><div class="campos-dobles"><label class="campo">Comuna<input name="comuna" autocomplete="address-level2" maxlength="100" required placeholder="Tu comuna"></label><label class="campo">Región<select name="region" id="region-checkout" autocomplete="address-level1">${regiones.map((region) => `<option>${escapar(region)}</option>`).join('')}</select></label></div></div><p class="nota" id="nota-retiro" hidden>Retiro de demostración: Tienda SUR, Providencia, Santiago. Se coordina al estar listo el pedido.</p></fieldset><label class="campo">Resultado del pago simulado<select id="resultado-pago" name="resultado"><option value="aprobado">Pago aprobado</option><option value="rechazado">Pago rechazado</option></select></label><div class="aviso-demo">Operación simulada. No se realizarán cargos ni se pedirán datos bancarios.</div><p id="estado-pago-checkout" class="error-mensaje" role="status" aria-live="polite" hidden></p><button class="boton ancho" id="confirmar-compra" type="submit">Confirmar pedido <span>↗</span></button></div><aside class="resumen-checkout"><h3>Tu próxima salida</h3>${lineas.map((linea) => `<div class="mini-linea"><span>${linea.cantidad} × ${escapar(linea.producto.nombre)}<br><small>${escapar(linea.variante.color)} / ${escapar(linea.variante.talla)}</small></span><strong>${pesos(linea.producto.precio * linea.cantidad)}</strong></div>`).join('')}<hr class="separador"><label class="campo" for="codigo-cupon">¿Tienes un cupón?</label><div class="control-cupon"><input id="codigo-cupon" maxlength="30" autocomplete="off" placeholder="Código de descuento" aria-label="Código de cupón"><button class="texto-boton" type="button" id="aplicar-cupon">Aplicar</button></div><p id="estado-cupon" class="nota" role="status" aria-live="polite"></p><button id="quitar-cupon" class="texto-boton" type="button" hidden>Quitar cupón</button><p id="error-cotizacion" class="error-mensaje" role="alert" hidden></p><div class="fila-total"><span>Subtotal</span><span id="subtotal-checkout">${pesos(subtotalCarrito())}</span></div><div class="fila-total" id="fila-descuento" hidden><span>Descuento</span><span id="descuento-checkout"></span></div><div class="fila-total"><span>Envío</span><span id="precio-envio">Calculando…</span></div><div class="fila-total total"><span>Total</span><span id="total-checkout">Calculando…</span></div><p class="nota">Precios en pesos chilenos.<br>RM: $3.990<br>Otras regiones: $6.990<br>Desde $80.000 después del descuento: envío gratis.</p></aside></form>`;
  for (const campo of ['nombre', 'email', 'direccion', 'comuna', 'envio', 'region']) {
    const control = $(`#formulario-checkout [name="${campo}"]`);
    if (pedido && control) control.value = pedido[campo] || '';
  }
  if (pedido) bloquearDatosPedido();
  actualizarEnvio();
  abrirDialogo('#dialogo-checkout');
}
function bloquearDatosPedido() {
  $('#datos-entrega').disabled = true;
  document.querySelectorAll('#codigo-cupon, #aplicar-cupon, #quitar-cupon').forEach((control) => { control.disabled = true; });
  $('#confirmar-compra').textContent = 'Reintentar pago ↗';
}
function pintarCotizacion(cotizacion) {
  estado.cupon = cotizacion.cupon;
  estado.cotizacion = cotizacion;
  $('#subtotal-checkout').textContent = pesos(cotizacion.subtotal);
  $('#precio-envio').textContent = cotizacion.costo_envio ? pesos(cotizacion.costo_envio) : 'Gratis';
  $('#total-checkout').textContent = pesos(cotizacion.total);
  $('#fila-descuento').hidden = !cotizacion.descuento;
  $('#descuento-checkout').textContent = `−${pesos(cotizacion.descuento)}`;
  $('#codigo-cupon').value = cotizacion.cupon || '';
  $('#estado-cupon').textContent = cotizacion.cupon ? `Cupón ${cotizacion.cupon} aplicado.` : '';
  $('#quitar-cupon').hidden = !cotizacion.cupon;
}
async function actualizarEnvio(codigo = estado.cupon, aplicar = false) {
  const solicitudActual = ++solicitudCotizacion;
  const retiro = $('#envio-checkout').value === 'retiro';
  $('#campos-direccion').hidden = retiro;
  $('#nota-retiro').hidden = !retiro;
  $('#campos-direccion').querySelectorAll('input').forEach((campo) => { campo.required = !retiro; });
  const boton = $('#formulario-checkout').querySelector('[type="submit"]');
  boton.disabled = true;
  estado.cotizacion = null;
  $('#error-cotizacion').hidden = true;
  if (estado.pedidoActual) { pintarCotizacion(estado.pedidoActual); boton.disabled = false; return true; }
  try {
    const cotizacion = await tienda.cotizar({ lineas: lineasParaGuardar(), ...(codigo ? { cupon: codigo } : {}), envio: $('#envio-checkout').value, region: $('#region-checkout').value });
    if (solicitudActual !== solicitudCotizacion || !$('#total-checkout')) return false;
    pintarCotizacion(cotizacion);
    boton.disabled = false;
    return true;
  } catch (error) {
    if (solicitudActual !== solicitudCotizacion || !$('#total-checkout')) return false;
    if (aplicar) {
      const solicitudRespaldo = solicitudCotizacion + 1;
      await actualizarEnvio(estado.cupon);
      if (solicitudRespaldo === solicitudCotizacion && $('#estado-cupon')) $('#estado-cupon').textContent = `Cupón no aplicado: ${error.message}`;
    } else {
      $('#error-cotizacion').textContent = error.message || 'No pudimos confirmar el total. Vuelve a intentarlo.';
      $('#error-cotizacion').hidden = false;
      $('#total-checkout').textContent = 'No disponible';
      $('#precio-envio').textContent = 'Sin confirmar';
    }
    return false;
  }
}
async function crearPedido(formulario) {
  if (estado.ocupado) return;
  const boton = formulario.querySelector('[type="submit"]');
  boton.disabled = true;
  try {
    if (!estado.cotizacion) throw new Error('Confirma el total antes de crear el pedido.');
    if (!estado.pedidoActual) {
      const datos = Object.fromEntries(new FormData(formulario));
      const { pedido } = tienda.crearPedido({ ...datos, ...(estado.cupon ? { cupon: estado.cupon } : {}), lineas: lineasParaGuardar() });
      estado.pedidoActual = pedido;
      bloquearDatosPedido();
    }
    await pagarPedido($('#resultado-pago').value);
  } finally { if (boton.isConnected) boton.disabled = !estado.cotizacion; }
}
async function pagarPedido(resultado) {
  if (estado.ocupado) return;
  estado.ocupado = true;
  $('#contenido-checkout').querySelectorAll('button').forEach((boton) => { boton.disabled = true; });
  try {
    const { pedido } = await tienda.pagarPedido(estado.pedidoActual.id, resultado);
    estado.pedidoActual = pedido;
    if (resultado === 'rechazado') {
      $('#estado-pago-checkout').textContent = `Pago rechazado. El pedido ${pedido.codigo || pedido.id} sigue pendiente. Elige otro resultado y reintenta; no se realizó ningún cargo.`;
      $('#estado-pago-checkout').hidden = false;
      return;
    }
    $('#contenido-checkout').innerHTML = `<div class="resultado"><span class="simbolo-resultado">✓</span><span class="ceja verde" style="margin-top:22px">PAGO DE DEMOSTRACIÓN</span><h3>Nos vemos afuera.</h3><p class="numero-pedido">${escapar(pedido.codigo || pedido.id)} PAGADO</p><p style="margin-top:18px">Tu pedido de ${pesos(pedido.total)} está confirmado.<br>Puedes seguir su avance en Mis pedidos.</p><div class="aviso-demo">Operación simulada. No se ha realizado ningún cargo real.</div><button class="boton" id="resultado-pedidos">Ver mi pedido ↗</button></div>`;
    const catalogo = tienda.catalogo();
    const carrito = tienda.carrito();
    estado.productos = catalogo.productos; estado.lineas = carrito.lineas; estado.favoritos = carrito.favoritos;
    pintarCatalogo();
  } finally {
    estado.ocupado = false;
    $('#contenido-checkout').querySelectorAll('button').forEach((boton) => { boton.disabled = false; });
    if ($('#formulario-checkout')) bloquearDatosPedido();
  }
}
function pedidoHTML(pedido, administrador = false) {
  const estados = ['pendiente', 'pagado', 'enviado', 'entregado'];
  const avance = estados.indexOf(pedido.estado);
  const siguiente = pedido.estado === 'pagado' ? 'enviado' : pedido.estado === 'enviado' ? 'entregado' : null;
  return `<article class="pedido"><div class="pedido-encabezado"><div><h3>${escapar(pedido.codigo || `Pedido ${pedido.id}`)}</h3><time datetime="${escapar(pedido.fecha)}">${new Date(pedido.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}${administrador ? `, ${escapar(pedido.nombre)}` : ''}</time></div><span class="estado ${escapar(pedido.estado)}">${escapar(pedido.estado)}</span></div><p class="pedido-lineas">${pedido.lineas.map((linea) => `${linea.cantidad} × ${escapar(linea.nombre)} (${escapar(linea.talla)} / ${escapar(linea.color)})`).join('<br>')}</p><div class="pedido-pie"><strong>${pesos(pedido.total)}</strong>${administrador && siguiente ? `<button class="boton" data-estado-pedido="${pedido.id}" data-estado="${siguiente}">Marcar ${siguiente} ↗</button>` : !administrador && pedido.estado === 'pendiente' ? `<button class="boton secundario" data-retomar="${pedido.id}">Simular pago ↗</button>` : ''}</div><div class="pedido-seguimiento">${estados.map((paso, indice) => `<span class="paso ${indice <= avance ? 'completo' : ''}">${paso}</span>`).join('')}</div><p class="nota">${pedido.envio === 'retiro' ? 'Retiro en tienda sin costo de envío' : `Despacho a ${escapar(pedido.direccion)}, ${escapar(pedido.comuna)}, ${escapar(pedido.region)}`}<br>Pago de demostración${pedido.pago === 'rechazado' ? ' Último intento rechazado' : ''}</p></article>`;
}
async function verPedidos() {
  $('#titulo-pedidos').textContent = estado.sesion.comerciante ? 'Pedidos de la tienda.' : 'Mis pedidos.';
  $('#contenido-pedidos').innerHTML = '<p class="nota">Cargando tus pedidos…</p>';
  abrirDialogo('#dialogo-pedidos');
  const { pedidos } = await tienda.pedidos();
  $('#contenido-pedidos').innerHTML = pedidos.length ? pedidos.map((pedido) => pedidoHTML(pedido, estado.sesion.comerciante)).join('') : '<div class="vacio"><h3>El próximo destino está por llegar.</h3><p>Cuando hagas tu primera compra, verás su avance aquí.</p><button class="boton" data-cerrar>Volver a explorar ↗</button></div>';
}
async function retomarPago(identificador) {
  const { pedidos } = await tienda.pedidos();
  const pedido = pedidos.find((elemento) => elemento.id === identificador);
  if (!pedido) return;
  $('#dialogo-pedidos').close();
  abrirCheckout(pedido);
}
async function verComerciante() {
  abrirDialogo('#dialogo-comerciante');
  if (!estado.sesion.comerciante) {
    $('#contenido-comerciante').innerHTML = `<form id="formulario-ingreso" class="formulario-ingreso"><p class="nota" style="margin-bottom:22px">Gestiona el catálogo, los precios y los pedidos de SUR.</p><label class="campo">Clave de acceso<input name="clave" type="password" autocomplete="current-password" required placeholder="Ingresa tu clave"></label><button class="boton ancho" type="submit">Ingresar a Administración ↗</button></form>`;
    return;
  }
  $('#contenido-comerciante').innerHTML = `<div class="barra-admin"><div class="tabs-admin" role="group" aria-label="Secciones de Administración">${[['productos', 'Catálogo y precios'], ['nuevo', 'Nuevo producto'], ['pedidos', 'Pedidos'], ['inventario', 'Inventario'], ['cupones', 'Cupones'], ['correos', 'Correos']].map(([clave, nombre]) => `<button data-tab="${clave}" class="${estado.tabAdmin === clave ? 'activa' : ''}" aria-pressed="${estado.tabAdmin === clave}">${nombre}</button>`).join('')}</div><button class="texto-boton" id="salir-comerciante">Salir</button></div><div id="vista-admin"></div>`;
  if (estado.tabAdmin === 'productos') pintarProductosAdmin();
  if (estado.tabAdmin === 'nuevo') pintarNuevoProducto();
  if (estado.tabAdmin === 'inventario') await pintarInventario();
  if (estado.tabAdmin === 'cupones') await pintarCupones();
  if (estado.tabAdmin === 'correos') await pintarCorreos();
  if (estado.tabAdmin === 'pedidos') {
    $('#vista-admin').innerHTML = '<p class="nota">Cargando pedidos…</p>';
    const { pedidos } = await tienda.pedidos();
    $('#vista-admin').innerHTML = pedidos.length ? pedidos.map((pedido) => pedidoHTML(pedido, true)).join('') : '<p class="nota">Todavía no hay pedidos. Crea uno desde la tienda para probar el flujo completo.</p>';
  }
}
async function pintarInventario() {
  $('#vista-admin').innerHTML = '<p class="nota">Consultando existencias…</p>';
  const { variantes, alertas } = await tienda.inventario();
  if (estado.tabAdmin !== 'inventario') return;
  $('#vista-admin').innerHTML = `<div class="encabezado-admin"><div><h3>El equipo disponible.</h3><p class="nota">${alertas ? `${alertas} ${alertas === 1 ? 'variante requiere' : 'variantes requieren'} reposición.` : 'Todas las variantes están sobre su umbral de reposición.'} El stock se actualiza con las compras de esta demostración.</p></div><button class="texto-boton" data-tab="inventario">Actualizar ↻</button></div><div class="tabla-scroll"><table class="tabla-admin tabla-inventario"><thead><tr><th>Producto / variante</th><th>Stock disponible</th><th>Avisar desde</th><th>Estado</th><th></th></tr></thead><tbody>${variantes.map((variante, indice) => `<tr class="${variante.stock_bajo ? 'stock-bajo' : ''}"><td>${escapar(variante.nombre)}<br><small>${escapar(variante.talla)} / ${escapar(variante.color)}</small></td><td><label class="sr-only" for="stock-${indice}">Stock de ${escapar(variante.nombre)}, ${escapar(variante.talla)}, ${escapar(variante.color)}</label><input id="stock-${indice}" type="number" min="0" max="1000000" step="1" value="${variante.stock}" required></td><td><label class="sr-only" for="umbral-${indice}">Umbral de reposición</label><input id="umbral-${indice}" type="number" min="0" max="1000000" step="1" value="${variante.umbral}" required></td><td><span class="estado${variante.stock_bajo ? ' pendiente' : ''}">${variante.stock_bajo ? 'Reponer' : 'Disponible'}</span></td><td><button data-inventario="${escapar(variante.id)}" data-indice="${indice}">Guardar ↗</button></td></tr>`).join('')}</tbody></table></div>`;
}
async function guardarInventario(boton) {
  const indice = Number(boton.dataset.indice);
  const stock = Number($(`#stock-${indice}`).value);
  const umbral = Number($(`#umbral-${indice}`).value);
  if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(umbral) || umbral < 0) throw new Error('Stock y umbral deben ser enteros iguales o mayores a cero.');
  boton.disabled = true;
  try {
    await tienda.guardarInventario(boton.dataset.inventario, { stock, umbral });
    const catalogo = tienda.catalogo();
    const carrito = tienda.carrito();
    estado.productos = catalogo.productos; estado.lineas = carrito.lineas; estado.favoritos = carrito.favoritos;
    pintarCatalogo(); await pintarInventario(); avisar('Existencias actualizadas.');
  } finally { boton.disabled = false; }
}
async function pintarCupones() {
  $('#vista-admin').innerHTML = '<p class="nota">Consultando cupones…</p>';
  const { cupones } = await tienda.cupones();
  if (estado.tabAdmin !== 'cupones') return;
  $('#vista-admin').innerHTML = `<div class="encabezado-admin"><div><h3>Una razón más para salir.</h3><p class="nota">Un cupón por pedido. El descuento se calcula antes del costo de envío.</p></div></div><div class="tabla-scroll"><table class="tabla-admin"><thead><tr><th>Código</th><th>Descuento</th><th>Estado</th><th></th></tr></thead><tbody>${cupones.map((cupon) => `<tr><td><strong>${escapar(cupon.codigo)}</strong></td><td>${cupon.tipo === 'porcentaje' ? `${Number(cupon.valor)} %` : pesos(cupon.valor)}</td><td><span class="estado${cupon.activo ? '' : ' pendiente'}">${cupon.activo ? 'Activo' : 'Inactivo'}</span></td><td><button data-cupon="${escapar(cupon.codigo)}" data-activo="${!cupon.activo}">${cupon.activo ? 'Desactivar' : 'Activar'} ↗</button></td></tr>`).join('')}</tbody></table></div><form id="formulario-cupon" class="formulario-cupon"><h4>Nuevo cupón</h4><div class="campos-dobles"><label class="campo">Código<input name="codigo" maxlength="30" pattern="[A-Za-z0-9_\\-]+" required placeholder="Ej. CAMINO10"><small>Letras, números, guion y guion bajo.</small></label><label class="campo">Tipo de descuento<select name="tipo" id="tipo-cupon"><option value="porcentaje">Porcentaje</option><option value="monto">Monto fijo en CLP</option></select></label></div><div class="campos-dobles"><label class="campo">Valor<input name="valor" id="valor-cupon" type="number" min="1" max="100" step="1" required></label><label class="campo">Estado<select name="activo"><option value="true">Activo</option><option value="false">Inactivo</option></select></label></div><button class="boton" type="submit">Crear cupón ↗</button></form>`;
}
async function crearCupon(formulario) {
  const datos = Object.fromEntries(new FormData(formulario));
  const boton = formulario.querySelector('[type="submit"]');
  boton.disabled = true;
  try {
    await tienda.crearCupon({ codigo: datos.codigo.trim().toUpperCase(), tipo: datos.tipo, valor: Number(datos.valor), activo: datos.activo === 'true' });
    await pintarCupones(); avisar('Cupón creado.');
  } finally { boton.disabled = false; }
}
async function alternarCupon(boton) {
  boton.disabled = true;
  try { await tienda.actualizarCupon(boton.dataset.cupon, { activo: boton.dataset.activo === 'true' }); await pintarCupones(); avisar('Estado del cupón actualizado.'); }
  finally { boton.disabled = false; }
}
async function pintarCorreos() {
  $('#vista-admin').innerHTML = '<p class="nota">Consultando notificaciones…</p>';
  const { correos } = await tienda.correos();
  if (estado.tabAdmin !== 'correos') return;
  $('#vista-admin').innerHTML = `<div class="encabezado-admin"><div><h3>Noticias de cada pedido.</h3><p class="nota">Vista previa de la confirmación de compra y el aviso de envío. Las notificaciones se simulan en este navegador.</p></div><button class="texto-boton" data-tab="correos">Actualizar ↻</button></div>${correos.length ? correos.map((correo) => `<article class="correo"><div class="pedido-encabezado"><div><h4>${escapar(correo.asunto)}</h4><p class="nota">Para: ${escapar(correo.destinatario)}<br>Pedido ${escapar(correo.pedido_id)} / ${new Date(correo.fecha).toLocaleString('es-CL')}</p></div><span class="estado${correo.estado === 'enviado' ? '' : ' pendiente'}">${correo.estado === 'enviado' ? 'Envío simulado' : escapar(correo.estado)}</span></div><details><summary>Ver mensaje</summary><p class="correo-cuerpo">${escapar(correo.cuerpo)}</p></details>${correo.error ? `<p class="error-mensaje">${escapar(correo.error)}</p>` : ''}${correo.estado !== 'enviado' ? `<button class="texto-boton" data-reintentar-correo="${correo.id}">Simular envío ↗</button>` : ''}</article>`).join('') : '<p class="nota">Todavía no hay notificaciones. Se crean al confirmar el pago y al marcar un pedido como enviado.</p>'}`;
}
async function reintentarCorreo(boton) {
  boton.disabled = true;
  try { const { correo } = await tienda.reintentarCorreo(Number(boton.dataset.reintentarCorreo)); await pintarCorreos(); avisar(correo.estado === 'enviado' ? 'Envío simulado.' : 'Notificación pendiente de simular.'); }
  finally { boton.disabled = false; }
}
function pintarProductosAdmin() {
  $('#vista-admin').innerHTML = `<p class="nota" style="margin-bottom:15px">Precio actual: lo que paga el cliente. Precio anterior: completa solo para mostrar una promoción, debe ser mayor al actual.</p><div class="tabla-scroll"><table class="tabla-admin"><thead><tr><th>Producto</th><th>Precio actual</th><th>Anterior / promoción</th><th></th></tr></thead><tbody>${estado.productos.map((producto) => `<tr><td>${escapar(producto.nombre)}<br><small>${escapar(producto.categoria)}</small></td><td><label class="sr-only" for="precio-${producto.id}">Precio de ${escapar(producto.nombre)}</label><input type="number" min="1" max="10000000" step="1" value="${producto.precio}" id="precio-${producto.id}"></td><td><label class="sr-only" for="anterior-${producto.id}">Precio anterior de ${escapar(producto.nombre)}</label><input type="number" min="1" max="10000000" step="1" value="${producto.precio_anterior || ''}" placeholder="Sin oferta" id="anterior-${producto.id}"></td><td><button data-guardar-precio="${producto.id}">Guardar ↗</button></td></tr>`).join('')}</tbody></table></div>`;
}
function pintarNuevoProducto() {
  $('#vista-admin').innerHTML = `<form id="formulario-producto" class="formulario-producto"><h3>Un nuevo compañero de camino.</h3><div class="campos-dobles"><label class="campo">Nombre del producto<input name="nombre" maxlength="100" required placeholder="Ej. Mochila Ventisquero 25L"></label><label class="campo">Categoría<select name="categoria">${['Chaquetas', 'Polar y capas', 'Mochilas', 'Accesorios', 'Calzado'].map((categoria) => `<option>${categoria}</option>`).join('')}</select></label></div><label class="campo">Descripción<textarea name="descripcion" maxlength="2000" required placeholder="Materiales, uso y características principales"></textarea></label><div class="campos-dobles"><label class="campo">Precio actual (CLP)<input name="precio" type="number" min="1" max="10000000" step="1" required></label><label class="campo">Precio anterior, opcional<input name="precio_anterior" type="number" min="1" max="10000000" step="1"><small>Mayor al actual para mostrar promoción.</small></label></div><label class="campo">Imágenes, una dirección por línea<textarea name="imagenes" required placeholder="https://images.unsplash.com/…"></textarea><small>Entre 1 y 8 fotografías HTTPS o de ./imagenes/. Usa imágenes propias o con permiso.</small></label><label class="campo">Variantes: talla, color, stock<textarea name="variantes" required placeholder="S, Verde bosque, 5&#10;M, Verde bosque, 8&#10;L, Naranja, 3"></textarea><small>Una variante por línea. Usa “Única” para productos sin talla.</small></label><button class="boton" type="submit">Publicar producto <span>↗</span></button></form>`;
}
async function ingresarComerciante(formulario) {
  const boton = formulario.querySelector('button'); boton.disabled = true;
  try { await tienda.ingresar(new FormData(formulario).get('clave')); estado.sesion = await tienda.sesion(); await verComerciante(); avisar('Bienvenido a Administración de SUR.'); }
  finally { boton.disabled = false; }
}
async function guardarPrecio(identificador, boton) {
  const precio = Number($(`#precio-${identificador}`).value);
  const anterior = $(`#anterior-${identificador}`).value;
  if (!Number.isInteger(precio) || precio <= 0 || (anterior && (!Number.isInteger(Number(anterior)) || Number(anterior) <= precio))) throw new Error('El precio debe ser un entero positivo y el anterior debe superar al actual.');
  boton.disabled = true;
  try { const { producto } = await tienda.actualizarProducto(identificador, { precio, precio_anterior: anterior ? Number(anterior) : null }); estado.productos = estado.productos.map((elemento) => elemento.id === producto.id ? producto : elemento); const carrito = await tienda.carrito(); estado.lineas = carrito.lineas; pintarCatalogo(); avisar('Precio y promoción actualizados.'); }
  finally { boton.disabled = false; }
}
async function publicarProducto(formulario) {
  const datos = Object.fromEntries(new FormData(formulario));
  const variantes = datos.variantes.split('\n').filter((linea) => linea.trim()).map((linea) => {
    const partes = linea.split(',').map((parte) => parte.trim());
    if (partes.length !== 3 || !partes[0] || !partes[1] || !/^\d+$/.test(partes[2])) throw new Error('Cada variante debe tener talla, color y stock entero igual o mayor a cero.');
    return { talla: partes[0], color: partes[1], stock: Number(partes[2]) };
  });
  const boton = formulario.querySelector('[type="submit"]'); boton.disabled = true;
  try {
    const { producto } = await tienda.publicarProducto({ nombre: datos.nombre, categoria: datos.categoria, descripcion: datos.descripcion, precio: Number(datos.precio), precio_anterior: datos.precio_anterior ? Number(datos.precio_anterior) : null, imagenes: datos.imagenes.split('\n').map((linea) => linea.trim()).filter(Boolean), variantes });
    estado.productos.push(producto); pintarCatalogo(); estado.tabAdmin = 'productos'; await verComerciante(); avisar('Producto publicado en el catálogo.');
  } finally { boton.disabled = false; }
}
async function cambiarEstadoPedido(identificador, siguiente, boton) {
  boton.disabled = true;
  try { await tienda.cambiarEstado(identificador, siguiente); if ($('#dialogo-comerciante').open) await verComerciante(); if ($('#dialogo-pedidos').open) await verPedidos(); avisar(`Pedido marcado como ${siguiente}.`); }
  finally { boton.disabled = false; }
}

// Un solo punto de entrada conserva el manejo de errores en todos los controles dinámicos.
document.addEventListener('click', async (evento) => {
  const boton = evento.target.closest('button, a[data-producto]');
  if (!boton) return;
  try {
    if (boton.hasAttribute('data-cerrar')) { boton.closest('dialog').close(); return; }
    if (boton.dataset.categoria) return seleccionarCategoria(boton.dataset.categoria);
    if (boton.dataset.producto) {
      if (boton.tagName === 'A' && (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey)) return;
      evento.preventDefault();
      abrirFicha(Number(boton.dataset.producto));
      if (boton.dataset.color && estado.productoActual.variantes.some((variante) => variante.color === boton.dataset.color)) {
        $('#color-ficha').value = boton.dataset.color;
        actualizarTallas();
      }
      return;
    }
    if (boton.dataset.favorito) return await alternarFavorito(Number(boton.dataset.favorito));
    if (boton.hasAttribute('data-limpiar') || boton.id === 'limpiar-filtros') return limpiarFiltros();
    if (boton.hasAttribute('data-imagen')) { const indice = Number(boton.dataset.imagen); $('#foto-principal').src = estado.productoActual.imagenes[indice]; document.querySelectorAll('.miniaturas button').forEach((miniatura) => { const activa = miniatura === boton; miniatura.classList.toggle('activa', activa); miniatura.setAttribute('aria-pressed', String(activa)); }); return; }
    if (boton.hasAttribute('data-cantidad')) return await cambiarCantidad(Number(boton.dataset.cantidad), Number(boton.dataset.cambio));
    if (boton.hasAttribute('data-eliminar')) return await cambiarCantidad(Number(boton.dataset.eliminar), 0, true);
    if (boton.dataset.retomar) return await retomarPago(Number(boton.dataset.retomar));
    if (boton.dataset.tab) { estado.tabAdmin = boton.dataset.tab; return await verComerciante(); }
    if (boton.dataset.guardarPrecio) return await guardarPrecio(Number(boton.dataset.guardarPrecio), boton);
    if (boton.dataset.estadoPedido) return await cambiarEstadoPedido(Number(boton.dataset.estadoPedido), boton.dataset.estado, boton);
    if (boton.dataset.inventario) return await guardarInventario(boton);
    if (boton.dataset.cupon) return await alternarCupon(boton);
    if (boton.dataset.reintentarCorreo) return await reintentarCorreo(boton);
    switch (boton.id) {
      case 'ver-carrito': pintarCarrito(); abrirDialogo('#dialogo-carrito'); break;
      case 'ver-favoritos': estado.soloFavoritos = !estado.soloFavoritos; estado.soloOfertas = false; estado.categoria = 'Todas'; pintarCatalogo(); $('#catalogo').scrollIntoView({ behavior: 'smooth' }); break;
      case 'ver-ofertas': $('#menu-movil')?.removeAttribute('open'); estado.soloOfertas = true; estado.soloFavoritos = false; estado.categoria = 'Todas'; pintarCatalogo(); $('#catalogo').scrollIntoView({ behavior: 'smooth' }); break;
      case 'agregar-carrito': await agregarAlCarrito(); break;
      case 'ir-checkout': abrirCheckout(); break;
      case 'aplicar-cupon': await actualizarEnvio($('#codigo-cupon').value.trim().toUpperCase(), true); break;
      case 'quitar-cupon': await actualizarEnvio(null); break;
      case 'ver-pedidos': await verPedidos(); break;
      case 'resultado-pedidos': $('#dialogo-checkout').close(); await verPedidos(); break;
      case 'ver-comerciante': await verComerciante(); break;
      case 'salir-comerciante': await tienda.salir(); estado.sesion = await tienda.sesion(); await verComerciante(); avisar('Sesión de Administración cerrada.'); break;
    }
  } catch (error) { avisar(error.message || 'No se pudo completar la acción. Intenta nuevamente.'); }
});
document.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  try {
    if (evento.target.id === 'formulario-checkout') await crearPedido(evento.target);
    if (evento.target.id === 'formulario-ingreso') await ingresarComerciante(evento.target);
    if (evento.target.id === 'formulario-producto') await publicarProducto(evento.target);
    if (evento.target.id === 'formulario-cupon') await crearCupon(evento.target);
    if (evento.target.id === 'formulario-resena') await publicarResena(evento.target);
  } catch (error) { avisar(error.message || 'No se pudo guardar. Intenta nuevamente.'); }
});
document.addEventListener('change', (evento) => {
  if (evento.target.id === 'color-ficha') actualizarTallas();
  if (evento.target.id === 'talla-ficha') actualizarVariante();
  if (evento.target.id === 'envio-checkout' || evento.target.id === 'region-checkout') actualizarEnvio();
  if (evento.target.id === 'orden') { estado.orden = evento.target.value; pintarCatalogo(); }
  if (evento.target.id === 'tipo-cupon') $('#valor-cupon').max = evento.target.value === 'porcentaje' ? '100' : '10000000';
});
document.addEventListener('keydown', (evento) => {
  if (evento.target.id === 'codigo-cupon' && evento.key === 'Enter') { evento.preventDefault(); actualizarEnvio(evento.target.value.trim().toUpperCase(), true); }
});
$('#busqueda').addEventListener('input', (evento) => { estado.busqueda = evento.target.value; pintarCatalogo(); });
document.querySelectorAll('dialog').forEach((dialogo) => { dialogo.addEventListener('click', (evento) => { if (evento.target === dialogo) { const limites = dialogo.getBoundingClientRect(); if (evento.clientX < limites.left || evento.clientX > limites.right || evento.clientY < limites.top || evento.clientY > limites.bottom) dialogo.close(); } }); });
$('#dialogo-ficha').addEventListener('close', () => {
  if (/^#producto\/\d+$/.test(window.location.hash)) window.history.replaceState({}, '', '#catalogo');
  actualizarMetadatos();
});
window.addEventListener('hashchange', () => {
  const ficha = window.location.hash.match(/^#producto\/(\d+)$/);
  if (ficha) abrirFicha(Number(ficha[1]), false);
  else if ($('#dialogo-ficha').open) $('#dialogo-ficha').close();
});

async function iniciar() {
  try {
    estado.sesion = await tienda.sesion();
    const catalogo = tienda.catalogo();
    const carrito = tienda.carrito();
    estado.productos = catalogo.productos; estado.lineas = carrito.lineas; estado.favoritos = carrito.favoritos;
    pintarCatalogo();
    const ficha = window.location.hash.match(/^#producto\/(\d+)$/);
    if (ficha) abrirFicha(Number(ficha[1]), false);
  } catch (error) {
    $('#productos').setAttribute('aria-busy', 'false');
    $('#productos').innerHTML = `<div class="sin-resultados"><h3>No pudimos cargar el equipo.</h3><p>${escapar(error.message)}</p><a class="boton" href="./index.html" style="margin-top:20px">Volver a intentar ↗</a></div>`;
    $('#resumen-catalogo').textContent = 'Error al cargar el catálogo';
  }
}
iniciar();
