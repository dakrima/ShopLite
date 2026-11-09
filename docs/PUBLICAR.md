# Pruebas y publicación de ShopLite

El sitio es HTML, CSS y JavaScript estáticos. Para abrirlo localmente no se necesita Node: usa `abrir.command` o `public/index.html`. Node.js 20 o posterior se utiliza para las pruebas y la preparación de la publicación.

## Comprobar el proyecto

```sh
npm ci
npx playwright install chromium
npm test
```

En macOS se puede usar el Chrome instalado automáticamente. `CHROME_EJECUTABLE` permite indicar otra ubicación. En CI se instala Chromium con `npx playwright install --with-deps chromium`.

`npm test` ejecuta las pruebas Node y seis recorridos E2E, tres en escritorio y tres en móvil. Las pruebas del mockup abren archivos locales con la conexión desactivada y contextos aislados, para no cambiar los datos de quien presenta la tienda. El informe está en `test-results/resultados.json`; ante un fallo se conserva una traza en `test-results/artefactos`.

## Preparar una publicación estática

```sh
npm run build -- https://dakrima.github.io/ShopLite/
```

El comando copia solo `public` a `dist`, añade canonical y Open Graph para la dirección recibida y genera `sitemap.xml` y `robots.txt`. No publica datos del navegador ni archivos de desarrollo.

Las fichas usan fragmentos como `#producto/4` y comparten el mismo documento HTML. Por eso el sitemap contiene la página principal y no presenta esos fragmentos como páginas indexables separadas.

## Flujo en GitHub

Repositorio de destino: https://github.com/dakrima/ShopLite

Sitio previsto de GitHub Pages: https://dakrima.github.io/ShopLite/

El workflow `.github/workflows/ci.yml` ejecuta **Validar frontend** en pull requests y cambios de `main`. Después de pasar las pruebas en `main`, consulta la URL real de Pages, prepara `dist` y publica únicamente esos archivos con las acciones oficiales de GitHub Pages.

Para los cambios siguientes, crea una rama, abre un pull request y espera a que pase **Validar frontend** antes de integrarlo a `main`. La protección de `main` exige ese control y un pull request; bloquea borrados y force pushes. La activación efectiva y el enlace al despliegue se registran en el informe de entrega.

## Medir el rendimiento

Con el sitio servido por un servidor estático o publicado:

```sh
npm run medir -- https://dakrima.github.io/ShopLite/
```

El informe `test-results/rendimiento.json` registra tres cargas por combinación de inicio/ficha y escritorio/móvil. Desactiva la caché; en móvil aplica CPU 4x, latencia de 40 ms y descarga de 1,6 Mbps. Comprueba las medianas LCP <2,5 s y CLS <0,1. Estas mediciones de laboratorio no equivalen a datos de usuarios reales.

Referencias: [workflow de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [ramas protegidas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [Playwright en CI](https://playwright.dev/docs/ci-intro).
