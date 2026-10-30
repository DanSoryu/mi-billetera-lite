# Mi Billetera Lite

PWA para registrar gastos diarios sin conexión. Hecha con HTML, CSS y JavaScript, como la práctica `cafeteria` de este espacio de trabajo. No requiere instalar dependencias.

## Funciones

- Registro de concepto, monto y categoría.
- Historial del gasto más reciente al más antiguo y total acumulado en pesos mexicanos.
- Datos guardados solo en `localStorage` del navegador.
- Manifest con íconos instalables y Service Worker que guarda la interfaz para uso sin conexión.

## Ejecutar en desarrollo

Desde esta carpeta:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. Para instalarla y usarla fuera del equipo local, publícala en un servidor HTTPS, por ejemplo GitHub Pages.

## Comprobar modo sin conexión

1. Abre la aplicación una vez con conexión y espera a que se registre el Service Worker.
2. En Chrome DevTools, cambia Network a **Offline** y recarga.
3. Agrega un gasto, cierra la pestaña y vuelve a abrir la aplicación. El gasto y el total deben permanecer.
