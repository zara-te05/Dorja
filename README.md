# 🎓 Karuna - Plataforma de Aprendizaje Budista e Hindú

<div align="center">

**Una plataforma educativa para el estudio de textos sagrados y filosofía oriental**

[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=white)](https://tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Características](#-características) • [Instalación](#-instalación) • [Uso](#-uso) • [Tecnologías](#-tecnologías) • [Estructura](#-estructura-del-proyecto)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Desarrollo](#-desarrollo)
- [Contribuciones](#-contribuciones)
- [Licencia](#-licencia)

---

## 🎯 Descripción

**Karuna** es una plataforma educativa de escritorio dedicada al estudio y aprendizaje de filosofía budista e hindú. La aplicación ofrece acceso curado a textos sagrados, enseñanzas de expertos y una comunidad de estudiosos comprometidos con el dharma.

Los usuarios pueden:
- Acceder a archivos curados de textos budistas e hindúes
- Aprender de académicos líderes en estudios orientales
- Conectar con una comunidad de estudiosos dedicados
- Explorar la intersección entre tradiciones antiguas y aprendizaje moderno
- Cultivar sabiduría y compasión a través del estudio

---

## ✨ Características

### 🔐 Sistema de Autenticación
- **Registro de usuarios**: Creación de cuentas con email y contraseña
- **Inicio de sesión seguro**: Autenticación con validación de credenciales
- **Gestión de perfil**: Personalización con nombre, apellido y afiliación institucional
- **Persistencia de datos**: Sistema local con SQLite

### 📚 Acceso a Contenido Educativo
- **Textos sagrados**: Biblioteca curada de filosofía budista e hindú
- **Guía experta**: Contenido desarrollado por académicos especializados
- **Recursos organizados**: Categorización por tradición y tema

### 🎨 Interfaz Elegante
- **Diseño temático**: Estética inspirada en mandalas y elementos naturales
- **Modo oscuro/claro**: Tema adaptable según preferencias
- **Paleta de colores cálidos**: Verde bosque, dorado tierra y tonos pergamino
- **Tipografía refinada**: Combinación de Inter y Playfair Display
- **Experiencia fluida**: Navegación intuitiva entre secciones

### 🌟 Características Adicionales
- **Aplicación de escritorio nativa**: Rendimiento óptimo con Tauri
- **Base de datos local**: Privacidad y funcionamiento sin conexión
- **Arquitectura multiplataforma**: Compatible con Windows, macOS y Linux

---

## 🛠️ Tecnologías

### Backend
- **Rust**: Núcleo de la aplicación con Tauri
- **SQLite**: Base de datos embebida
- **Tauri Plugin SQL**: Integración de base de datos

### Frontend
- **HTML5/CSS3**: Estructura y estilos
- **TypeScript**: Lógica del cliente tipada
- **Tailwind CSS**: Framework CSS utility-first
- **Google Fonts**: Tipografía Inter y Playfair Display
- **Google Material Symbols**: Iconografía

### Desktop
- **Tauri 2.0**: Framework para aplicación de escritorio
- **Vite**: Herramienta de construcción y desarrollo
- **pnpm**: Gestor de paquetes

### Base de Datos
- **SQLite**: Base de datos relacional embebida
- **Tauri Plugin SQL**: Acceso a base de datos desde TypeScript

---

## 📦 Requisitos Previos

Antes de instalar y ejecutar Karuna, asegúrate de tener instalado:

- **Rust** (última versión estable)
  - Descarga: https://rustup.rs/
- **Node.js** (v18 o superior)
  - Descarga: https://nodejs.org/
- **pnpm** (gestor de paquetes)
  - Instalación: `npm install -g pnpm`
- **Git** (opcional, para clonar el repositorio)
  - Descarga: https://git-scm.com/downloads

### Para Windows
- Windows 10 o superior
- Microsoft Visual C++ Build Tools

### Para macOS
- macOS 10.15 o superior
- Xcode Command Line Tools

### Para Linux
- Distribución moderna (Ubuntu 20.04+, Fedora 36+, etc.)
- Dependencias de desarrollo (build-essential, etc.)

### Para desarrollo
- VS Code con extensiones:
  - rust-analyzer
  - Tauri
  - TypeScript and JavaScript

---

## 🚀 Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/KarunaApp.git
cd KarunaApp
```

### 2. Instalar Dependencias

#### Dependencias de Node.js
```bash
pnpm install
```

#### Dependencias de Rust (Tauri)
```bash
cd src-tauri
cargo build
cd ..
```

### 3. Configurar la Base de Datos

La base de datos SQLite se crea automáticamente al ejecutar la aplicación por primera vez. El archivo `karuna.db` se generará en el directorio de datos de la aplicación.

---

## 💻 Uso

### Modo Desarrollo
```bash
pnpm run tauri dev
```

Esto iniciará:
- El servidor de desarrollo de Vite
- La aplicación Tauri con hot-reload

### Primera Ejecución

1. Al iniciar la aplicación por primera vez, se creará automáticamente la base de datos
2. Regístrate desde la pantalla de registro con tu información
3. Inicia sesión con tus credenciales
4. Explora el contenido educativo disponible

### Compilar para Producción
```bash
pnpm run tauri build
```

Los instaladores se generarán en `src-tauri/target/release/bundle/`

---

## 📁 Estructura del Proyecto
```
KarunaApp/
│
├── src/
│   ├── database.ts          # Funciones de base de datos
│   └── auth.ts              # Lógica de autenticación
│
├── src-tauri/
│   ├── src/
│   │   ├── main.rs          # Punto de entrada Rust
│   │   └── lib.rs           # Biblioteca principal Tauri
│   ├── Cargo.toml           # Dependencias Rust
│   └── tauri.conf.json      # Configuración Tauri
│
├── index.html               # Página de login y registro
├── dashboard.html           # Panel principal (por implementar)
├── vite.config.js           # Configuración Vite
├── package.json             # Dependencias Node.js
├── tsconfig.json            # Configuración TypeScript
└── README.md                # Este archivo
```

### Componentes Principales

- **src/database.ts**: Inicialización y operaciones de base de datos
- **src/auth.ts**: Manejo de formularios y autenticación
- **src-tauri/src/**: Código Rust de la aplicación
- **index.html**: Interfaz de usuario con formularios
- **vite.config.js**: Configuración del servidor de desarrollo

---

## 🔧 Desarrollo

### Compilar el Proyecto
```bash
# Frontend
pnpm run build

# Backend (Tauri)
cd src-tauri
cargo build
```

### Limpiar Caché
```bash
# Limpiar caché de Vite
rm -rf node_modules/.vite

# Limpiar build de Cargo
cd src-tauri
cargo clean
```

### Estructura de Commits

Usa mensajes de commit descriptivos:
```
feat: Agregar sistema de biblioteca de textos
fix: Corregir validación de formulario de registro
docs: Actualizar documentación de instalación
refactor: Reorganizar módulos de TypeScript
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guía de Contribución

- Sigue las convenciones de código existentes
- Agrega comentarios donde sea necesario
- Actualiza la documentación si es necesario
- Prueba tus cambios antes de hacer commit
- Respeta la filosofía del proyecto centrada en el aprendizaje contemplativo

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👥 Autores

**Equipo Karuna**

- **Diego Zarate** - Desarrollador Principal - https://github.com/zara-te05

---

## 🙏 Agradecimientos

- A la comunidad de desarrolladores de Tauri
- A los académicos y maestros que preservan estas enseñanzas antiguas
- A todos los que buscan cultivar sabiduría y compasión

---

## 📞 Contacto y Soporte

Si tienes preguntas o necesitas ayuda:

- Abre un [Issue](https://github.com/tu-usuario/KarunaApp/issues) en GitHub
- Contacta al equipo de desarrollo

---

<div align="center">

**"La compasión es la raíz de todo dharma"**

Hecho con ❤️ por el equipo Karuna

⭐ Si te gusta este proyecto, ¡dale una estrella!

</div>
