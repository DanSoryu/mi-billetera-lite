# Mi Billetera Lite

PWA mínima de gastos hecha con Expo, React Native Web y TypeScript, como `CasaCambio`.

Aplicación: https://dansoryu.github.io/mi-billetera-lite/

## Ejecutar

```bash
npm install
npm run web
```

## Crear la PWA para publicar

```bash
npm run build:web
```

`dist/` contiene la aplicación web, el manifest, los íconos y el Service Worker. Para publicarla en GitHub Pages:

```bash
npm run deploy
```

Los gastos se guardan localmente con AsyncStorage. Después de abrir la versión publicada una vez con conexión, puede recargarse y registrar gastos sin red.
