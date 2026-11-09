const { test, expect } = require('@playwright/test');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const inicio = pathToFileURL(resolve(__dirname, '../public/index.html')).href;
const observaciones = new WeakMap();

test.beforeEach(async ({ page }) => {
  const incidencias = { errores: [], solicitudesHTTP: [] };
  observaciones.set(page, incidencias);
  page.on('pageerror', error => incidencias.errores.push(error.message));
  page.on('request', solicitud => {
    if (/^https?:/.test(solicitud.url())) incidencias.solicitudesHTTP.push(solicitud.url());
  });
  await page.goto(inicio);
  await expect(page.locator('.producto')).toHaveCount(8);
});

test.afterEach(async ({ page }) => {
  expect(observaciones.get(page).errores, 'Sin errores JavaScript').toEqual([]);
  expect(observaciones.get(page).solicitudesHTTP, 'El mockup funciona sin servicios externos').toEqual([]);
});

async function agregarEquipo(pagina) {
  await pagina.locator('[data-producto="1"]').first().click();
  await pagina.locator('#agregar-carrito').click();
  await expect(pagina.locator('#dialogo-carrito')).toBeVisible();
  await pagina.locator('#ir-checkout').click();
  await expect(pagina.locator('#formulario-checkout')).toBeVisible();
}

async function completarDireccion(pagina) {
  await pagina.locator('[name="nombre"]').fill('Ana Pérez');
  await pagina.locator('[name="email"]').fill('ana@example.com');
  await pagina.locator('[name="direccion"]').fill('Calle de ejemplo 123');
  await pagina.locator('[name="comuna"]').fill('Providencia');
}

test('compra en una vista, reseña y seguimiento desde Administración', async ({ page }) => {
  await agregarEquipo(page);
  await completarDireccion(page);
  await expect(page.locator('#resultado-pago')).toBeVisible();
  await page.locator('#codigo-cupon').fill('SUR10');
  await page.locator('#aplicar-cupon').click();
  await expect(page.locator('#total-checkout')).toHaveText('$48.981');
  await page.locator('#resultado-pago').selectOption('aprobado');
  await page.locator('#confirmar-compra').click();
  await expect(page.locator('#resultado-pedidos')).toBeVisible();
  await page.locator('#resultado-pedidos').click();
  await expect(page.locator('#contenido-pedidos .pedido .estado')).toHaveText('pagado');
  await page.locator('[aria-label="Cerrar pedidos"]').click();

  await page.locator('[data-producto="1"]').first().click();
  const comentario = '<img src=x onerror="window.__intrusion=1"> Buen equipo.';
  await page.locator('[name="comentario"]').fill(comentario);
  await page.locator('#formulario-resena [type="submit"]').click();
  await expect(page.locator('.resena-comentario')).toHaveText(comentario);
  await expect(page.locator('.resena-comentario img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__intrusion)).toBeUndefined();
  await page.locator('[aria-label="Cerrar ficha"]').click();
  await expect(page).toHaveTitle(/Equipados para salir/);

  await page.locator('#ver-comerciante').click();
  await page.locator('[name="clave"]').fill('SurDemo2026!');
  await page.locator('#formulario-ingreso button').click();
  await page.locator('[data-tab="pedidos"]').click();
  await page.locator('[data-estado="enviado"]').click();
  await page.locator('[data-estado="entregado"]').click();
  await expect(page.locator('#vista-admin .pedido .estado')).toHaveText('entregado');
  await page.locator('[data-tab="correos"]').click();
  await expect(page.locator('.correo')).toHaveCount(2);
  await expect(page.locator('.correo .estado')).toHaveText(['Envío simulado', 'Envío simulado']);
  expect(await page.evaluate(() => tienda.pedidos().pedidos.length)).toBe(1);
});

test('rechazo y reanudación conservan el pedido y descuentan stock una vez', async ({ page }) => {
  const stockInicial = await page.evaluate(() => tienda.catalogo().productos[0].variantes[0].stock);
  await agregarEquipo(page);
  await completarDireccion(page);
  await page.locator('#resultado-pago').selectOption('rechazado');
  await page.locator('#confirmar-compra').click();
  await expect(page.locator('#estado-pago-checkout')).toContainText(/rechaz|no pasó/i);
  await expect(page.locator('[name="nombre"]')).toHaveValue('Ana Pérez');
  const pendiente = await page.evaluate(() => tienda.pedidos().pedidos[0]);
  expect(pendiente.estado).toBe('pendiente');
  expect(await page.evaluate(() => tienda.catalogo().productos[0].variantes[0].stock)).toBe(stockInicial);

  await page.locator('[aria-label="Cerrar compra"]').click();
  await page.locator('#ver-pedidos').click();
  await page.locator(`[data-retomar="${pendiente.id}"]`).click();
  await expect(page.locator('[name="direccion"]')).toHaveValue('Calle de ejemplo 123');
  await expect(page.locator('#total-checkout')).toHaveText('$53.980');
  await page.locator('#resultado-pago').selectOption('aprobado');
  await page.locator('#confirmar-compra').click();
  await expect(page.locator('#resultado-pedidos')).toBeVisible();
  const resultado = await page.evaluate(() => ({ pedidos: tienda.pedidos().pedidos, stock: tienda.catalogo().productos[0].variantes[0].stock, lineas: tienda.carrito().lineas }));
  expect(resultado.pedidos).toHaveLength(1);
  expect(resultado.pedidos[0].id).toBe(pendiente.id);
  expect(resultado.pedidos[0].estado).toBe('pagado');
  expect(resultado.stock).toBe(stockInicial - 1);
  expect(resultado.lineas).toHaveLength(0);
});

test('catálogo y bolsa persistentes, cupones y entrega sin conexión', async ({ page, isMobile }) => {
  if (isMobile) {
    await page.locator('#menu-movil summary').click();
    await expect(page.locator('#menu-movil')).toHaveAttribute('open', '');
    await page.locator('#menu-movil [data-categoria="Mochilas"]').click();
    await expect(page.locator('#menu-movil')).not.toHaveAttribute('open', '');
    await expect(page.locator('.producto')).toHaveCount(1);
    await page.locator('#limpiar-filtros').click();
  }
  await page.locator('.categorias-visuales [data-categoria="Mochilas"]').click();
  await expect(page.locator('.producto')).toHaveCount(1);
  await expect(page.locator('.producto-titulo')).toHaveText('Mochila Travesía 24L');
  await page.locator('#limpiar-filtros').click();
  await page.locator('.categorias [data-categoria="Chaquetas"]').click();
  await expect(page.locator('.producto')).toHaveCount(2);
  await page.locator('#limpiar-filtros').click();
  await page.locator('#busqueda').fill('Mochila');
  await expect(page.locator('.producto')).toHaveCount(1);
  await page.locator('#limpiar-filtros').click();
  await page.locator('.muestra-color[data-producto="1"][data-color="Negro"]').click();
  await expect(page.locator('#color-ficha')).toHaveValue('Negro');
  await page.locator('#favorito-ficha').click();
  await page.locator('#agregar-carrito').click();
  await expect(page).toHaveURL(/#catalogo$/);
  await page.reload();
  await expect(page.locator('#cantidad-carrito')).toHaveText('1');
  await expect(page.locator('#cantidad-favoritos')).toHaveText('1');
  await page.locator('#ver-carrito').click();
  await expect(page.locator('.linea-carrito .variante')).toContainText('Negro');
  await page.locator('#ir-checkout').click();
  await page.locator('#codigo-cupon').fill('NOEXISTE');
  await page.locator('#aplicar-cupon').click();
  await expect(page.locator('#estado-cupon')).toContainText('no aplicado');
  await page.locator('#codigo-cupon').fill('SUR5000');
  await page.locator('#aplicar-cupon').click();
  await expect(page.locator('#total-checkout')).toHaveText('$48.980');
  await page.locator('#region-checkout').selectOption('Los Ríos');
  await expect(page.locator('#total-checkout')).toHaveText('$51.980');
  await page.locator('#envio-checkout').selectOption('retiro');
  await expect(page.locator('#total-checkout')).toHaveText('$44.990');
  await expect(page.locator('[name="direccion"]')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.locator('#dialogo-checkout').evaluate(elemento => elemento.scrollWidth <= elemento.clientWidth)).toBe(true);
});
