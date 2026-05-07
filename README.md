# RoboLink App

Aplicación Expo + Firebase para control remoto de dispositivos y gestión de sesión.

## Requisitos

- Node.js 18+ o compatible con Expo SDK 55
- npm
- Expo CLI (opcional, puede usar `npx expo`)

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/sebastianSSN/RoboLink.git
   cd robolink
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

## Preparación

- La configuración de Firebase está en `src/lib/firebase.ts`.
- Actualmente el proyecto ya usa un proyecto Firebase configurado con Realtime Database y Auth.
- Si necesitas usar tu propio proyecto Firebase, reemplaza los valores de `firebaseConfig` en `src/lib/firebase.ts`.

> Nota: no se utiliza archivo `.env` en la configuración actual, así que todos los datos de conexión Firebase están hardcodeados en `src/lib/firebase.ts`.

## Ejecución

- Inicia la app en modo Expo:
   ```bash
   npm start
   ```

- Para abrir en Android:
   ```bash
   npm run android
   ```

- Para abrir en iOS:
   ```bash
   npm run ios
   ```

- Para ejecutar en web:
   ```bash
   npm run web
   ```

## Ejecución con Expo

### Método 1: Usando npm scripts (Recomendado)

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm start
   ```

2. **Selecciona la plataforma en el menú interactivo:**
   - Presiona `a` para abrir en Android
   - Presiona `i` para abrir en iOS
   - Presiona `w` para abrir en web
   - Presiona `j` para abrir en web de desarrollo

### Método 2: Usando Expo CLI directamente

Si tienes Expo CLI instalado globalmente:

```bash
# Instalar Expo CLI globalmente (opcional)
npm install -g expo-cli

# Inicia la app
expo start \\ npm start 
```

### Método 3: Usar npx (Sin instalación global)

```bash
# Ejecutar sin instalar Expo globalmente
npx expo@latest start
```

### Acceder a la app desde dispositivos remotos

Cuando ejecutas `npm start`, Expo genera un código QR. Puedes:

1. **Escanear el código QR** con la aplicación Expo Go (disponible en App Store y Google Play)
2. **Usar un teléfono físico** para cargar la app
3. **Usar simuladores/emuladores** locales (Android Studio, Xcode)

### Variables de entorno

Si necesitas variables de entorno para desarrollo local, crea un archivo `.env.local` en la raíz del proyecto:

```bash
# .env.local (no se versionará)
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Acceso en el código:
```javascript
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

## Despliegue al Hosting de Firebase

La aplicación puede desplegarse como una web app en Firebase Hosting.

### Prerrequisitos

- Firebase CLI instalado y autenticado:
  ```bash
  npm install -g firebase-tools
  firebase login
  ```

- Proyecto Firebase configurado con Hosting habilitado

### Pasos para desplegar

1. **Construir la versión web:**
   ```bash
   npm run build
   ```

2. **Desplegar al hosting:**
   ```bash
   firebase deploy --only hosting
   ```

3. **Acceder a la aplicación:**
   Una vez completado el despliegue, Firebase te proporcionará la URL de hosting (generalmente `https://tu-proyecto.web.app`).

### Configuración de Firebase

- El archivo `firebase.json` está configurado para servir archivos desde la carpeta `dist/`
- La configuración incluye reglas de reescritura para SPA (Single Page Application)

### Actualizaciones futuras

Para actualizar la aplicación en hosting después de cambios:

```bash
npm run build
firebase deploy --only hosting
```

## Puntos importantes

- No debes subir `node_modules/`, archivos generados ni credenciales locales. El `.gitignore` ya cubre:
  - `node_modules/`
  - `.expo/`, `.expo-shared/`
  - `dist/`, `web-build/`
  - `.vscode/`, `.idea/`
  - `.env`, `.env.*`, `.env*.local`
  - `*.tsbuildinfo`

- La app usa Firebase Realtime Database y Authentication.
- Para pruebas locales, basta con ejecutar `npm install` y `npm start`.

## Reglas de seguridad de Firebase

El proyecto usa estas reglas de Realtime Database:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

Esto significa que cada usuario solo puede leer y escribir sus propios datos.

## Estructura de la app

- `App.tsx` / `index.ts`: punto de entrada principal de la app.
- `src/lib/firebase.ts`: configuración y funciones de Firebase.
- `src/screens/`: pantallas de la aplicación.
- `src/components/`: componentes de UI y control de robot.
- `src/state/useArmStore.ts`: estado global con Zustand.

## Mejora visual y uso

- La interfaz permite iniciar sesión, registrar sesiones activas y reclamar/controlar el "master".
- Si cambias a tu propio Firebase, verifica también las reglas y la URL de Realtime Database.
