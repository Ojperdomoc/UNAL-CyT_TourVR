# Campus VR · Misión Patrimonio

Juego de exploración 3D en primera persona sobre el campus (React + Three.js + Vite + Tailwind).
Recorre la explanada, supera los 6 checkpoints con preguntas y llega a la meta. Funciona en
escritorio (teclado + ratón), en móvil (joystick + giroscopio) y en modo VR con gafas Cardboard.

**Jugar en línea:** https://ojperdomoc.github.io/UNAL-CyT_TourVR/

---

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # compilar el sitio de producción en dist/
npm run preview  # previsualizar el build de producción
```

### Controles

| Acción | Escritorio | Móvil |
| --- | --- | --- |
| Moverse | `W A S D` o flechas | joystick en pantalla |
| Correr | mantener `Shift` | botón de carrera |
| Mirar alrededor | mover el ratón (clic para capturar, `Esc` para liberar) | arrastrar el lado derecho |
| Pausa | `P` | botón de pausa |
| Ayuda | `H` | botón `?` |
| Modo VR (doble vista) | `V` | botón VR + giroscopio |
| Silenciar | `M` | botón de sonido |

---

## Publicación en GitHub Pages

El sitio se publica automáticamente con GitHub Actions cada vez que se hace push a `main`
(workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).
También se puede lanzar a mano desde la pestaña **Actions → Deploy a GitHub Pages → Run workflow**.

### ⚠️ Paso único de configuración (obligatorio)

GitHub Pages de este repositorio estaba configurado como *Deploy from a branch → `main` / `/ (root)`*,
es decir, publicaba el `index.html` de desarrollo con `/src/main.tsx`, que el navegador no puede
ejecutar (son archivos TypeScript sin compilar). Por eso el sitio salía en blanco.

Para arreglarlo, entra una sola vez y cambia el origen de publicación:

1. Abre **Settings → Pages** del repositorio:
   https://github.com/Ojperdomoc/UNAL-CyT_TourVR/settings/pages
2. En **Build and deployment → Source**, elige **GitHub Actions** (en lugar de *Deploy from a branch*).
3. Ve a **Actions → Deploy a GitHub Pages → Run workflow** (o haz cualquier push a `main`).

El workflow avisa con un mensaje explícito si Pages todavía no está configurado con *GitHub Actions*,
así que si lo ejecutas antes de cambiar el ajuste sabrás exactamente qué falta.

> Si prefieres seguir publicando desde una rama, deja **Source = Deploy from a branch** y apunta a
> la rama y carpeta donde subas el resultado de `npm run build` (por ejemplo `gh-pages`), ya que el
> `index.html` de la raíz es el punto de entrada de Vite y no funciona tal cual en el navegador.

---

## Cómo está preparado para Pages

- **`base: "./"` en `vite.config.ts`**: GitHub Pages sirve los proyectos en un subdirectorio
  (`https://<usuario>.github.io/UNAL-CyT_TourVR/`), así que todas las rutas del build son relativas.
  El mismo `dist/` funciona en la raíz de un dominio, en un subdirectorio o incluso abierto con `file://`.
- **Foto del campus importada desde `src/assets/`**: `src/components/ui.tsx` y `src/game/Engine.ts`
  la importan como módulo, por lo que Vite le pone la ruta correcta y la incrusta en el build
  (antes se pedía con la ruta absoluta `/images/campus.jpg`, que en un subdirectorio da 404).
- **Build de archivo único** (`vite-plugin-singlefile`): el juego queda autocontenido en un solo
  `dist/index.html` (~1,2 MB), sin peticiones extra de assets.

## Estructura

```
index.html                  punto de entrada de Vite
src/main.tsx                arranque de React
src/App.tsx                 pantallas, HUD, estado del juego
src/components/ui.tsx       menú, minimapa, quiz, victoria, modales
src/game/Engine.ts          motor 3D (Three.js): mundo, checkpoints, VR
src/game/audio.ts           efectos y ambiente (WebAudio)
src/assets/campus.jpg       fotografía del campus usada como póster
.github/workflows/          CI y despliegue a GitHub Pages
```
