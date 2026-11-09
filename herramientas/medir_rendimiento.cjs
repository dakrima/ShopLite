'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const direccion = new URL(process.argv[2] || 'http://127.0.0.1:8888/');
assert.ok(['http:', 'https:'].includes(direccion.protocol), 'Mide una URL HTTP(S) servida como sitio estático.');
const salida = path.resolve(process.argv[3] || 'test-results/rendimiento.json');
const chromeMac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ejecutable = process.env.CHROME_EJECUTABLE || (!process.env.CI && fs.existsSync(chromeMac) ? chromeMac : undefined);
const mediana = valores => valores.slice().sort((a, b) => a - b)[Math.floor(valores.length / 2)];
assert.equal(mediana([5, 1, 3]), 3);

(async () => {
  const navegador = await chromium.launch(ejecutable ? { executablePath: ejecutable } : {});
  const mediciones = [];
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  try {
    for (const ancho of [1440, 390]) for (const fragmento of ['', '#producto/4']) for (let repeticion = 1; repeticion <= 3; repeticion++) {
      const contexto = await navegador.newContext({ viewport: { width: ancho, height: 900 }, deviceScaleFactor: 1 });
      try {
        const pagina = await contexto.newPage();
        const errores = [], solicitudesAPI = [], fallosRed = [];
        pagina.on('pageerror', error => errores.push(error.message));
        pagina.on('requestfailed', solicitud => fallosRed.push(`${solicitud.url()}: ${solicitud.failure()?.errorText}`));
        pagina.on('request', solicitud => { if (new URL(solicitud.url()).pathname.startsWith('/api/')) solicitudesAPI.push(solicitud.url()); });
        const sesion = await contexto.newCDPSession(pagina);
        await sesion.send('Network.enable');
        await sesion.send('Network.setCacheDisabled', { cacheDisabled: true });
        if (ancho === 390) {
          await sesion.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 200000, uploadThroughput: 93750 });
          await sesion.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        }
        await pagina.addInitScript(() => {
          window.metricas = { lcp: 0, cls: 0 };
          let inicioVentana = 0, ultimaEntrada = 0, valorVentana = 0;
          new PerformanceObserver(lista => {
            for (const entrada of lista.getEntries()) window.metricas.lcp = entrada.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver(lista => {
            for (const entrada of lista.getEntries()) {
              if (entrada.hadRecentInput) continue;
              if (entrada.startTime - ultimaEntrada > 1000 || entrada.startTime - inicioVentana > 5000) {
                inicioVentana = entrada.startTime;
                valorVentana = 0;
              }
              ultimaEntrada = entrada.startTime;
              valorVentana += entrada.value;
              window.metricas.cls = Math.max(window.metricas.cls, valorVentana);
            }
          }).observe({ type: 'layout-shift', buffered: true });
        });
        const url = new URL(direccion.href);
        url.hash = fragmento;
        const respuesta = await pagina.goto(url.href);
        assert.equal(respuesta.status(), 200);
        try { await pagina.waitForSelector(fragmento ? '#dialogo-ficha[open]' : '.producto'); }
        catch (error) { console.error({ errores, fallosRed }); throw error; }
        await pagina.waitForTimeout(3200);
        const valores = await pagina.evaluate(() => ({ ...window.metricas, desbordamiento: document.documentElement.scrollWidth > innerWidth, fuentes: document.fonts.status }));
        assert.ok(Number.isFinite(valores.lcp) && valores.lcp > 0, 'La carga debe producir una medición LCP.');
        assert.equal(valores.desbordamiento, false);
        assert.equal(valores.fuentes, 'loaded');
        assert.deepEqual(errores, []);
        assert.deepEqual(fallosRed, []);
        assert.deepEqual(solicitudesAPI, []);
        mediciones.push({ ancho, ruta: fragmento || '/', repeticion, ...valores });
        console.log(`${ancho}px ${fragmento || '/'} #${repeticion}: LCP ${Math.round(valores.lcp)}ms, CLS ${valores.cls.toFixed(5)}`);
      } finally { await contexto.close(); }
    }
    const resumen = [];
    for (const ancho of [1440, 390]) for (const ruta of ['/', '#producto/4']) {
      const conjunto = mediciones.filter(fila => fila.ancho === ancho && fila.ruta === ruta);
      const lcp = mediana(conjunto.map(fila => fila.lcp));
      const cls = mediana(conjunto.map(fila => fila.cls));
      resumen.push({ ancho, ruta, muestras: conjunto.length, lcp_mediana_ms: lcp, cls_mediana: cls, cumple_objetivo_local: lcp < 2500 && cls < 0.1 });
    }
    const informe = {
      fecha: new Date().toISOString(), url: direccion.href, navegador: navegador.version(),
      tipo: 'Medición de laboratorio; no representa percentil 75 de usuarios reales',
      metodo: 'Tres cargas nuevas por pantalla/ruta, caché desactivada y 3,2 s de observación tras load. Móvil 390px: CPU4x, latencia40ms, bajada1,6Mbps. Escritorio1440px: sin limitación adicional. CLS usa ventanas de hasta5s con separación1s.',
      mediciones, resumen
    };
    fs.writeFileSync(salida, JSON.stringify(informe, null, 2) + '\n');
    assert.ok(resumen.every(fila => fila.cumple_objetivo_local), 'Revisar objetivo local LCP <2,5s y CLS <0,1; informe guardado.');
  } finally { await navegador.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
