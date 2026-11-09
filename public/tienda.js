'use strict';

const tienda = (() => {
  const claveDatos = 'shoplite-frontend-v1';
  const claveAdministracion = 'shoplite-administracion';
  const copiar = (valor) => JSON.parse(JSON.stringify(valor));
  const iniciales = () => ({ productos: copiar(catalogoInicial), lineas: [], favoritos: [], pedidos: [], resenas: [], correos: [], cupones: [{ codigo: 'SUR10', tipo: 'porcentaje', valor: 10, activo: true }, { codigo: 'SUR5000', tipo: 'monto', valor: 5000, activo: true }] });
  let datos;
  try {
    datos = JSON.parse(localStorage.getItem(claveDatos));
    if (!datos || !['productos', 'lineas', 'favoritos', 'pedidos', 'resenas', 'correos', 'cupones'].every((campo) => Array.isArray(datos[campo])) || !datos.productos.every((producto) => Number.isInteger(producto.id) && Number.isInteger(producto.precio) && Array.isArray(producto.imagenes) && Array.isArray(producto.variantes))) datos = iniciales();
  } catch { datos = iniciales(); }

  function guardar(accion) {
    const nuevos = copiar(datos);
    const resultado = accion(nuevos);
    try { localStorage.setItem(claveDatos, JSON.stringify(nuevos)); }
    catch { throw new Error('No se pudieron guardar los cambios. Habilita el almacenamiento del navegador o libera espacio.'); }
    datos = nuevos;
    return copiar(resultado ?? {});
  }
  function sesion() {
    try { return { comerciante: sessionStorage.getItem(claveAdministracion) === 'si' }; }
    catch { return { comerciante: false }; }
  }
  function exigirAdministracion() {
    if (!sesion().comerciante) throw new Error('Ingresa a Administración para continuar.');
  }
  function entero(valor, nombre, minimo = 0, maximo = 10000000) {
    if (!Number.isInteger(valor) || valor < minimo || valor > maximo) throw new Error(`Revisa ${nombre}: debe ser un entero entre ${minimo} y ${maximo}.`);
    return valor;
  }
  function texto(valor, nombre, maximo = 200) {
    if (typeof valor !== 'string' || !valor.trim() || valor.trim().length > maximo) throw new Error(`Revisa el campo ${nombre}.`);
    return valor.trim();
  }
  function productoEn(contenido, identificador) {
    const producto = contenido.productos.find((elemento) => elemento.id === identificador);
    if (!producto) throw new Error('El producto ya no está disponible.');
    return producto;
  }
  function validarLineas(contenido, lineas) {
    if (!Array.isArray(lineas) || !lineas.length || lineas.length > 100) throw new Error('Agrega al menos un producto a la bolsa.');
    const vistas = new Set();
    return lineas.map((linea) => {
      const producto = productoEn(contenido, linea.producto_id);
      const variante = producto.variantes.find((elemento) => elemento.id === linea.variante_id);
      if (!variante || vistas.has(variante.id)) throw new Error('Selecciona una variante distinta por línea.');
      vistas.add(variante.id);
      const cantidad = entero(linea.cantidad, 'la cantidad', 1, 99);
      if (cantidad > variante.stock) throw new Error(`Stock insuficiente para ${producto.nombre} (${variante.talla}, ${variante.color}).`);
      return { producto_id: producto.id, variante_id: variante.id, cantidad, nombre: producto.nombre, precio: producto.precio, talla: variante.talla, color: variante.color };
    });
  }
  function carrito() {
    const lineas = datos.lineas.flatMap((linea) => {
      const producto = datos.productos.find((elemento) => elemento.id === linea.producto_id);
      const variante = producto?.variantes.find((elemento) => elemento.id === linea.variante_id);
      return variante?.stock > 0 ? [{ ...linea, cantidad: Math.min(linea.cantidad, variante.stock), producto, variante }] : [];
    });
    return copiar({ lineas, favoritos: datos.favoritos });
  }
  function cotizar(opciones) {
    const lineas = validarLineas(datos, opciones.lineas);
    const subtotal = lineas.reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0);
    const codigo = opciones.cupon ? String(opciones.cupon).trim().toUpperCase() : null;
    let descuento = 0;
    if (codigo) {
      const cupon = datos.cupones.find((elemento) => elemento.codigo === codigo && elemento.activo);
      if (!cupon) throw new Error('Este cupón no existe o ya no está activo.');
      descuento = Math.min(subtotal, cupon.tipo === 'porcentaje' ? Math.round(subtotal * cupon.valor / 100) : cupon.valor);
    }
    if (!['retiro', 'domicilio'].includes(opciones.envio)) throw new Error('Selecciona retiro o despacho a domicilio.');
    if (opciones.envio === 'domicilio') texto(opciones.region, 'región', 100);
    const costo_envio = opciones.envio === 'retiro' || subtotal - descuento >= 80000 ? 0 : /metropolitana|^(rm|santiago)$/i.test(opciones.region) ? 3990 : 6990;
    return { subtotal, descuento, costo_envio, total: subtotal - descuento + costo_envio, cupon: codigo };
  }
  function buscarPedido(contenido, identificador) {
    const pedido = contenido.pedidos.find((elemento) => elemento.id === identificador);
    if (!pedido) throw new Error('No se encontró ese pedido.');
    return pedido;
  }
  function registrarCorreo(contenido, pedido, tipo) {
    if (contenido.correos.some((correo) => correo.pedido_id === pedido.id && correo.tipo === tipo)) return;
    contenido.correos.push({ id: contenido.correos.length + 1, pedido_id: pedido.id, tipo, destinatario: pedido.email, asunto: tipo === 'confirmacion' ? `Confirmación de tu pedido ${pedido.codigo}` : `Tu pedido ${pedido.codigo} está en camino`, cuerpo: tipo === 'confirmacion' ? `Hola ${pedido.nombre},\nTu pedido ${pedido.codigo} está confirmado por $${pedido.total.toLocaleString('es-CL')}.\nGracias por elegir SUR.` : `Hola ${pedido.nombre},\nTu pedido ${pedido.codigo} ${pedido.envio === 'retiro' ? 'está listo para retirar' : 'fue despachado'}.\nSUR`, estado: 'enviado', simulado: true, error: null, fecha: new Date().toISOString() });
  }
  function compraDe(identificador) {
    return datos.pedidos.find((pedido) => ['pagado', 'enviado', 'entregado'].includes(pedido.estado) && pedido.lineas.some((linea) => linea.producto_id === identificador));
  }
  function validarPrecios(producto) {
    entero(producto.precio, 'el precio', 1);
    if (producto.precio_anterior !== null && producto.precio_anterior !== undefined) {
      entero(producto.precio_anterior, 'el precio anterior', 1);
      if (producto.precio_anterior <= producto.precio) throw new Error('El precio anterior debe superar al precio actual.');
    }
  }
  function validarCupon(cupon) {
    cupon.codigo = texto(cupon.codigo, 'código', 30).toUpperCase();
    if (!/^[A-Z0-9_-]+$/.test(cupon.codigo)) throw new Error('El código del cupón admite letras, números y guiones.');
    if (!['porcentaje', 'monto'].includes(cupon.tipo)) throw new Error('Selecciona el tipo de descuento.');
    entero(cupon.valor, 'el valor del descuento', 1, cupon.tipo === 'porcentaje' ? 100 : 10000000);
    cupon.activo = cupon.activo !== false;
    return cupon;
  }

  return {
    sesion,
    ingresar(clave) {
      if (clave !== 'SurDemo2026!') throw new Error('La clave no es correcta.');
      // shortcut: este acceso solo cambia la vista del mockup; requiere autenticación real si se publica como tienda.
      try { sessionStorage.setItem(claveAdministracion, 'si'); }
      catch { throw new Error('Habilita el almacenamiento del navegador para abrir Administración.'); }
      return sesion();
    },
    salir() {
      try { sessionStorage.removeItem(claveAdministracion); }
      catch { throw new Error('No se pudo cerrar Administración. Habilita el almacenamiento del navegador.'); }
      return sesion();
    },
    catalogo: () => copiar({ productos: datos.productos }),
    carrito,
    guardarCarrito(contenido) {
      const lineas = contenido.lineas.length ? validarLineas(datos, contenido.lineas) : [];
      if (!Array.isArray(contenido.favoritos)) throw new Error('Revisa la selección de favoritos.');
      guardar((nuevos) => {
        nuevos.lineas = lineas.map(({ producto_id, variante_id, cantidad }) => ({ producto_id, variante_id, cantidad }));
        nuevos.favoritos = [...new Set(contenido.favoritos)].filter((id) => nuevos.productos.some((producto) => producto.id === id));
      });
      return carrito();
    },
    cotizar,
    crearPedido(contenido) {
      const nombre = texto(contenido.nombre, 'nombre', 100);
      const email = texto(contenido.email, 'correo', 200);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresa un correo electrónico válido.');
      const cotizacion = cotizar(contenido);
      const lineas = validarLineas(datos, contenido.lineas);
      const direccion = contenido.envio === 'domicilio' ? texto(contenido.direccion, 'dirección', 250) : '';
      const comuna = contenido.envio === 'domicilio' ? texto(contenido.comuna, 'comuna', 100) : '';
      return guardar((nuevos) => {
        const id = nuevos.pedidos.length + 1;
        const pedido = { id, codigo: `SUR-${10000 + id}`, nombre, email, direccion, comuna, region: contenido.region || '', envio: contenido.envio, lineas, ...cotizacion, estado: 'pendiente', pago: null, fecha: new Date().toISOString() };
        nuevos.pedidos.unshift(pedido);
        return { pedido };
      });
    },
    pagarPedido(identificador, resultado) {
      if (!['aprobado', 'rechazado'].includes(resultado)) throw new Error('Selecciona un resultado del pago.');
      return guardar((nuevos) => {
        const pedido = buscarPedido(nuevos, identificador);
        if (pedido.estado !== 'pendiente') {
          if (resultado === 'aprobado') return { pedido };
          throw new Error('El pedido ya está pagado.');
        }
        if (resultado === 'aprobado') {
          validarLineas(nuevos, pedido.lineas);
          for (const linea of pedido.lineas) productoEn(nuevos, linea.producto_id).variantes.find((variante) => variante.id === linea.variante_id).stock -= linea.cantidad;
          pedido.estado = 'pagado';
          nuevos.lineas = [];
          registrarCorreo(nuevos, pedido, 'confirmacion');
        }
        pedido.pago = resultado;
        return { pedido };
      });
    },
    pedidos: () => copiar({ pedidos: datos.pedidos }),
    cambiarEstado(identificador, estado) {
      exigirAdministracion();
      return guardar((nuevos) => {
        const pedido = buscarPedido(nuevos, identificador);
        const siguiente = { pagado: 'enviado', enviado: 'entregado' }[pedido.estado];
        if (estado !== siguiente) throw new Error('El estado del pedido debe seguir el avance de pago, envío y entrega.');
        pedido.estado = estado;
        if (estado === 'enviado') registrarCorreo(nuevos, pedido, 'envio');
        return { pedido };
      });
    },
    inventario() {
      exigirAdministracion();
      const variantes = datos.productos.flatMap((producto) => producto.variantes.map((variante) => ({ ...variante, producto_id: producto.id, nombre: producto.nombre, stock_bajo: variante.stock <= variante.umbral })));
      return copiar({ variantes, alertas: variantes.filter((variante) => variante.stock_bajo).length });
    },
    guardarInventario(identificador, contenido) {
      exigirAdministracion();
      entero(contenido.stock, 'el stock', 0, 1000000); entero(contenido.umbral, 'el umbral', 0, 1000000);
      return guardar((nuevos) => {
        const variante = nuevos.productos.flatMap((producto) => producto.variantes).find((elemento) => elemento.id === identificador);
        if (!variante) throw new Error('No se encontró esa variante.');
        Object.assign(variante, { stock: contenido.stock, umbral: contenido.umbral });
        return { variante };
      });
    },
    cupones() { exigirAdministracion(); return copiar({ cupones: datos.cupones }); },
    crearCupon(contenido) {
      exigirAdministracion();
      const cupon = validarCupon({ ...contenido });
      return guardar((nuevos) => {
        if (nuevos.cupones.some((elemento) => elemento.codigo === cupon.codigo)) throw new Error('Ya existe un cupón con ese código.');
        nuevos.cupones.push(cupon); return { cupon };
      });
    },
    actualizarCupon(codigo, contenido) {
      exigirAdministracion();
      return guardar((nuevos) => {
        const indice = nuevos.cupones.findIndex((elemento) => elemento.codigo === codigo);
        if (indice < 0) throw new Error('No se encontró ese cupón.');
        const cupon = validarCupon({ ...nuevos.cupones[indice], ...contenido, codigo });
        nuevos.cupones[indice] = cupon; return { cupon };
      });
    },
    correos() { exigirAdministracion(); return copiar({ correos: datos.correos.slice().reverse() }); },
    reintentarCorreo(identificador) {
      exigirAdministracion();
      return guardar((nuevos) => {
        const correo = nuevos.correos.find((elemento) => elemento.id === identificador);
        if (!correo) throw new Error('No se encontró ese correo.');
        correo.estado = 'enviado'; correo.simulado = true; correo.error = null;
        return { correo };
      });
    },
    resenas(identificador) {
      productoEn(datos, identificador);
      const resenas = datos.resenas.filter((resena) => resena.producto_id === identificador);
      return copiar({ resenas, total: resenas.length, promedio: resenas.length ? resenas.reduce((suma, resena) => suma + resena.calificacion, 0) / resenas.length : 0, puede_resenar: Boolean(compraDe(identificador)) && resenas.length === 0 });
    },
    publicarResena(identificador, contenido) {
      const compra = compraDe(identificador);
      if (!compra) throw new Error('La opinión se habilita después de confirmar la compra de este producto.');
      if (datos.resenas.some((resena) => resena.producto_id === identificador)) throw new Error('Ya compartiste una opinión de este producto.');
      const calificacion = entero(contenido.calificacion, 'la calificación', 1, 5);
      const comentario = texto(contenido.comentario, 'comentario', 2000);
      return guardar((nuevos) => {
        const resena = { id: nuevos.resenas.length + 1, producto_id: identificador, nombre: compra.nombre.split(/\s+/)[0], calificacion, comentario, fecha: new Date().toISOString(), compra_verificada: true };
        nuevos.resenas.push(resena); return { resena };
      });
    },
    actualizarProducto(identificador, contenido) {
      exigirAdministracion();
      return guardar((nuevos) => {
        const producto = productoEn(nuevos, identificador);
        const precios = { precio: contenido.precio, precio_anterior: contenido.precio_anterior ?? null };
        validarPrecios(precios); Object.assign(producto, precios);
        return { producto };
      });
    },
    publicarProducto(contenido) {
      exigirAdministracion(); validarPrecios(contenido);
      const nombre = texto(contenido.nombre, 'nombre', 100);
      const descripcion = texto(contenido.descripcion, 'descripción', 2000);
      const categoria = texto(contenido.categoria, 'categoría', 100);
      if (!Array.isArray(contenido.imagenes) || !contenido.imagenes.length || contenido.imagenes.length > 8 || contenido.imagenes.some((imagen) => typeof imagen !== 'string' || !(/^https:\/\/[^\s]+$/i.test(imagen) || /^\.\/imagenes\/[a-z0-9_-]+\.(webp|png|jpe?g|avif)$/i.test(imagen)))) throw new Error('Usa entre una y ocho imágenes HTTPS o de ./imagenes/.');
      if (!Array.isArray(contenido.variantes) || !contenido.variantes.length) throw new Error('Agrega al menos una variante.');
      return guardar((nuevos) => {
        const id = Math.max(0, ...nuevos.productos.map((producto) => producto.id)) + 1;
        const variantes = contenido.variantes.map((variante, indice) => ({ id: `${id}-${indice + 1}`, talla: texto(variante.talla, 'talla', 50), color: texto(variante.color, 'color', 50), stock: entero(variante.stock, 'el stock', 0, 1000000), umbral: 3 }));
        const producto = { id, nombre, descripcion, categoria, precio: contenido.precio, precio_anterior: contenido.precio_anterior ?? null, imagenes: contenido.imagenes, variantes };
        nuevos.productos.push(producto); return { producto };
      });
    }
  };
})();
