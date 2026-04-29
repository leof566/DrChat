# Dr Chat — PWA móvil educativa

Dr Chat es una PWA privada para estudiar Secretaría Administrativa en Salud, terminología médica, obras sociales, atención al paciente e informática administrativa.

## Qué trae esta versión

- Diseño exclusivo para celular.
- Chat educativo con respuesta local si todavía no conectaste backend.
- Modo simple, estudio, verificación e examen.
- Preguntas trampa y evaluación con puntaje.
- Módulos iniciales basados en el libro de Terminología Médica cargado.
- Apuntes propios guardados en el navegador.
- Backend opcional en Vercel para conectar OpenAI, internet verificado y PDFs.

## Estructura

```txt
index.html              Pantalla principal
styles.css              Diseño móvil
app.js                  Lógica de la app
data.js                 Base local + preguntas
manifest.webmanifest    Configuración PWA
sw.js                   Service Worker offline básico
assets/                 Íconos
api/chat.js             Backend para OpenAI en Vercel
scripts/create-vector-store.mjs  Script para subir PDFs a OpenAI File Search
.env.example            Variables de entorno de ejemplo
```

## Cómo probar localmente sin IA

1. Descomprimí el ZIP.
2. Abrí la carpeta `dr-chat-pwa`.
3. Hacé doble clic en `index.html`.
4. Probá el chat.

Así funciona con la base local, pero todavía no usa internet ni OpenAI.

## Cómo subirlo a GitHub Pages solo como PWA visual

Este camino sirve para ver la app, instalarla y usar el modo local. No conecta OpenAI porque GitHub Pages no tiene backend seguro.

1. Entrá a GitHub.
2. Creá un repositorio nuevo llamado `dr-chat-pwa`.
3. Subí todos los archivos de esta carpeta.
4. Andá a `Settings > Pages`.
5. En `Build and deployment`, elegí:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Guardá.
7. Esperá unos minutos.
8. GitHub te dará un link parecido a:
   `https://tuusuario.github.io/dr-chat-pwa/`

## Camino recomendado para IA + internet: Vercel

Para usar OpenAI, web search y PDFs, usá Vercel porque permite backend seguro.

### 1. Crear cuenta

Entrá a Vercel y registrate con tu GitHub.

### 2. Importar proyecto

1. En Vercel tocá `Add New > Project`.
2. Elegí el repositorio `dr-chat-pwa`.
3. Dejá las opciones por defecto.
4. Antes de deployar, cargá las variables.

### 3. Variables de entorno

En Vercel > Project > Settings > Environment Variables agregá:

```txt
OPENAI_API_KEY = tu_clave_de_openai
OPENAI_MODEL = gpt-4.1-mini
```

Opcional, cuando subas PDFs:

```txt
OPENAI_VECTOR_STORE_ID = vs_xxxxxxxxx
```

### 4. Deploy

Tocá `Deploy`. Vercel te dará un link propio, por ejemplo:

```txt
https://dr-chat-pwa.vercel.app
```

Ese link sí puede usar `/api/chat` y conectarse a OpenAI.

## Cómo subir PDFs del curso a OpenAI File Search

Esto permite que Dr Chat responda usando tus libros/apuntes.

### Requisitos

- Node.js instalado.
- Una API key de OpenAI.
- El PDF guardado en tu computadora.

### Pasos

1. Abrí la carpeta del proyecto.
2. En la barra de dirección de la carpeta escribí `cmd` y presioná Enter.
3. Instalá dependencias:

```bash
npm install
```

4. En Windows PowerShell, configurá tu clave temporalmente:

```powershell
$env:OPENAI_API_KEY="pegá_tu_api_key_acá"
```

5. Subí el PDF:

```bash
npm run upload:pdf -- "C:\ruta\a\tu\libro.pdf"
```

6. La terminal mostrará algo como:

```txt
OPENAI_VECTOR_STORE_ID=vs_abc123
```

7. Copiá ese ID.
8. Pegalo en Vercel como variable `OPENAI_VECTOR_STORE_ID`.
9. Volvé a deployar.

## Cómo instalar en el celular

### Android con Chrome

1. Abrí el link de la app.
2. Tocá los tres puntitos del navegador.
3. Tocá `Agregar a pantalla principal` o `Instalar app`.
4. Confirmá.

### iPhone con Safari

1. Abrí el link en Safari.
2. Tocá compartir.
3. Tocá `Agregar a inicio`.
4. Confirmá.

## Advertencia educativa

Dr Chat no diagnostica, no receta y no reemplaza atención médica profesional. Es una herramienta de estudio.
