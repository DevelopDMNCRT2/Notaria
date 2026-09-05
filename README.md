# 🏛️ Notaría Pública 196 — Plataforma Digital & Asistente Virtual con IA

Plataforma web integral y suite de automatización desarrollada para la **Notaría Pública 196**. El sistema digitaliza la captación y atención a clientes, automatiza el agendamiento de citas con Inteligencia Artificial (OpenAI + n8n) vía WhatsApp, y proporciona un panel administrativo robusto para la gestión notarial, expedientes y calendario.

---

## 🏗️ Arquitectura del Sistema

El ecosistema se compone de 5 módulos principales interconectados mediante Docker y redes aisladas:

```
                              [ Cliente / Usuario ]
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 ▼                                           ▼
      [ 🌐 PAGE (Puerto 8089) ]                   [ 💬 CLIENT (Puerto 8090) ]
        Landing Page Pública                        Simulador WhatsApp Web
                 │                                           │
                 │                                           ▼
                 │                               [ ⚙️ SERVER (Puerto 3002) ]
                 │                                 Backend Node.js + Express
                 │                                      │        │
                 │              ┌───────────────────────┘        └────────────────────────┐
                 ▼              ▼                                                         ▼
    [ 🖥️ ADMIN (Puerto 8088) ]               [ 🤖 n8n AI Engine (Puerto 5678) ]      [ 🗄️ PostgreSQL ]
      Panel Administrativo                      Flujo Agente (OpenAI gpt-4o-mini)      Base de Datos
      - Calendario de citas                     - Memoria por sesión (Buffer Window)   - Tabla Citas
      - Bandeja de solicitudes                  - Tool 'agendar_cita'                  - Tabla Usuarios
      - Depósito de archivos (MinIO S3)         - Integración Webhooks WhatsApp        - Tabla Solicitudes
```

---

## 📦 Módulos del Proyecto

### 1. `PAGE/` — Landing Page Institucional
* **Tecnología:** Vue 3, Vite, Vanilla CSS.
* **Propósito:** Portal público para clientes de la notaría.
* **Funcionalidades:**
  * Presentación de trámites notariales (Testamentos, Compraventas, Poderes Notariales, Cancelación de Hipotecas, Cotejos, Sucesiones).
  * Información corporativa, ubicación física, horarios de atención y teléfonos de contacto.
  * Botones de llamada a la acción (CTA) enlazados a WhatsApp para atención inmediata.
  * Diseño completamente responsivo optimizado para móviles y escritorio.

### 2. `ADMIN/` — Panel de Gestión Notarial
* **Tecnología:** Vue 3, TypeScript, Vite, TailwindCSS / UI Custom.
* **Propósito:** Sistema administrativo privado para la titular y personal de la notaría.
* **Funcionalidades:**
  * **Calendario de Citas:** Vista mensual, semanal y por día con código de color por estado.
  * **Gestión de Citas:** Confirmación y rechazo de citas (dispara notificaciones automáticas al cliente).
  * **Bandeja de Solicitudes:** Seguimiento de prospectos y trámites solicitados.
  * **Almacén Digital:** Visualización de métricas de almacenamiento y lista de archivos.
  * **Control de Usuarios:** Administración de personal con credenciales seguras.

### 3. `CLIENT/` — Simulador de WhatsApp Web
* **Tecnología:** Vue 3, Vite, Lucide Icons.
* **Propósito:** Entorno interactivo idéntico a WhatsApp Web para pruebas y atención conversacional en tiempo real con el asistente virtual.
* **Funcionalidades:**
  * Intercambio bidireccional de mensajes con polling optimizado.
  * Gestión de sesión por usuario (`whatsapp_session_id`) en almacenamiento local.
  * Botón de reinicio rápido de conversación.

### 4. `SERVER/` — Backend API REST
* **Tecnología:** Node.js, Express, PostgreSQL Client (`pg`), AWS SDK S3 (`@aws-sdk/client-s3`).
* **Propósito:** Orquestación central de datos, almacenamiento y pasarela de webhooks.
* **Endpoints principales:**
  * `GET /api/messages` & `POST /api/messages`: Historial y envío de mensajes hacia n8n.
  * `POST /api/webhook`: Recepción de respuestas del agente de IA y notificaciones.
  * `GET /api/citas` & `POST /api/citas`: Creación y consulta de citas para el calendario.
  * `POST /api/citas/:id/confirmar`: Confirmación de cita con notificación automática.
  * `POST /api/login`: Autenticación de usuarios administrativos.
  * `GET /api/storage` & `GET /api/files`: Métricas y listado de archivos en MinIO S3.

### 5. `n8n/` — Motor de Inteligencia Artificial & Automatización
* **Tecnología:** n8n self-hosted en Docker + OpenAI API (`gpt-4o-mini`).
* **Propósito:** Asistente virtual especializado ("Lic. Sofía") para la Notaría 196.
* **Capacidades:**
  * Orientación completa sobre requisitos y documentación de trámites notariales mexicanos.
  * Memoria contextual conversacional por `SessionID`.
  * Ejecución autónoma de la herramienta `agendar_cita` conectada a PostgreSQL para registrar la cita en cuanto el usuario proporciona fecha, hora, nombre y teléfono.

---

## 📊 Estado Actual del Proyecto (Issues Status)

| Módulo / Objetivo | Estado | Resumen de Avance |
| :--- | :---: | :--- |
| **1. Landing Page Pública (`PAGE`)** | ✅ **100% Completado** | Desplegada y operativa en VPS (puerto `8089`). |
| **2. Admin de Citas (`ADMIN`)** | ✅ **100% Funcional** | Calendario, base de datos PostgreSQL, gestión de citas y usuarios conectados (puerto `8088`). |
| **3. Automatizaciones n8n & WhatsApp** | ✅ **100% Operativo** | Asistente de IA (Lic. Sofía) con `gpt-4o-mini` respondiendo en < 1s y guardando citas en BD. |
| **4. Depósito de Archivos (`MinIO`)** | 🟡 **Ajuste Menor** | Contenedor MinIO activo en VPS con bucket creado; pendiente migrar endpoints de subida y descarga a streaming directo en Express para evitar depender de URLs internas. |
| **5. Despliegue en VPS (Docker)** | ✅ **100% Estable** | 7 contenedores orquestados con Docker Compose y persistencia de volúmenes en servidor IONOS. |

---

## 🚀 Despliegue y Ejecución con Docker Compose

El proyecto está preparado para ejecutarse de forma unificada mediante Docker:

```bash
# 1. Clonar el repositorio
git clone https://github.com/DevelopDMNCRT2/Notaria.git
cd Notaria

# 2. Levantar todos los servicios
docker compose up -d --build

# 3. Verificar estado de los contenedores
docker compose ps
```

### Puertos de Servicio:
* **Landing Page Pública:** `http://localhost:8089`
* **Panel Administrativo:** `http://localhost:8088` *(Usuario: `admin` / Contraseña: `admin123`)*
* **Simulador WhatsApp:** `http://localhost:8090`
* **Backend API:** `http://localhost:3002` (Interno: `3000`)
* **Consola n8n:** `http://localhost:5678`
* **Consola MinIO:** `http://localhost:9001`
* **PostgreSQL:** Puerto interno `5432` / Externo `5435`

---

## 💻 Desarrollo Local (Sin Docker)

Si deseas ejecutar cada módulo de manera individual para desarrollo:

```bash
# Backend (Server)
cd SERVER && npm install && npm run dev

# Panel Administrativo (Admin)
cd ADMIN && npm install && npm run dev

# Landing Page (Page)
cd PAGE && npm install && npm run dev

# Cliente WhatsApp (Client)
cd CLIENT && npm install && npm run dev
```

---

## 🔐 Seguridad y Buenas Prácticas
* Las credenciales maestras y llaves de API (OpenAI, AWS/MinIO, DB Passwords) deben gestionarse estrictamente a través de variables de entorno seguras (`.env`) o el gestor de credenciales de n8n.
* Los archivos `.env` y llaves privadas están excluidos del seguimiento de Git mediante `.gitignore`.
