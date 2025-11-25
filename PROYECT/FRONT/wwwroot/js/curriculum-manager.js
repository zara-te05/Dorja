// js/curriculum-manager.js
class CurriculumManager {
    constructor() {
        this.currentUser = null;
        this.api = window.api;
        this.checkAPI();
    }

    checkAPI() {
        if (!this.api) {
            console.warn('⚠ API no está disponible. Usando datos de prueba.');
            this.useMockData = true;
        } else {
            console.log('✅ API disponible');
            this.useMockData = false;
        }
    }

    async init(userId) {
        this.currentUser = userId;
        console.log('✅ CurriculumManager iniciado para usuario:', userId);
    }

    async cargarTemas(nivelId = null) {
        try {
            console.log('🔄 Solicitando temas...', nivelId ? `para nivel ${nivelId}` : '');
            
            if (this.useMockData) {
                console.log('📚 Usando datos de prueba para temas');
                return await this.getMockTemas(nivelId);
            }

            const temas = await this.api.cargarTemas(this.currentUser, nivelId);
            console.log('📚 Temas recibidos:', temas);
            
            // Asegurar que los temas estén ordenados por orden
            return temas.sort((a, b) => (a.orden || a.Orden || 0) - (b.orden || b.Orden || 0));
        } catch (error) {
            console.error('❌ Error cargando temas:', error);
            console.log('📚 Usando datos de prueba debido al error');
            return await this.getMockTemas(nivelId);
        }
    }

    async cargarProblemas(temaId) {
        try {
            console.log('🔄 Solicitando problemas para tema:', temaId);
            
            if (this.useMockData) {
                console.log('📝 Usando datos de prueba para problemas');
                return await this.getMockProblemas(temaId);
            }

            const problemas = await this.api.cargarProblemas(this.currentUser, temaId);
            console.log('📝 Problemas recibidos:', problemas);
            return problemas;
        } catch (error) {
            console.error('❌ Error cargando problemas:', error);
            console.log('📝 Usando datos de prueba debido al error');
            return await this.getMockProblemas(temaId);
        }
    }

    async obtenerProblema(problemaId) {
        try {
            console.log('🔄 Solicitando problema:', problemaId);
            
            if (this.useMockData) {
                console.log('📄 Usando datos de prueba para problema');
                return await this.getMockProblema(problemaId);
            }

            const problema = await this.api.obtenerProblema(problemaId);
            console.log('📄 Problema recibido:', problema);
            return problema;
        } catch (error) {
            console.error('❌ Error obteniendo problema:', error);
            console.log('📄 Usando datos de prueba debido al error');
            return await this.getMockProblema(problemaId);
        }
    }

    async verificarSolucion(codigoUsuario, problemaId) {
        try {
            console.log('🔄 Verificando solución para problema:', problemaId);
            
            if (this.useMockData) {
                console.log('✅ Usando verificación simulada');
                return { correcto: true, mensaje: "¡Correcto! (simulado)" };
            }

            const resultado = await this.api.verificarSolucion(this.currentUser, codigoUsuario, problemaId);
            console.log('✅ Resultado verificación:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ Error verificando solución:', error);
            return { correcto: false, mensaje: "Error al verificar la solución" };
        }
    }

    // Datos de prueba para desarrollo
    async getMockTemas(nivelId = null) {
        const todosLosTemas = [
            {
                id: 1,
                IdTemas: 1,
                titulo: "Variables en Python",
                descripcion: "Aprende los fundamentos de las variables",
                orden: 1,
                IdNivel: 1,
                locked: 0,
                total_problemas: 3,
                problemas_completados: 0
            },
            {
                id: 2,
                IdTemas: 2,
                titulo: "Condicionales",
                descripcion: "Estructuras if, else, elif",
                orden: 2,
                IdNivel: 1,
                locked: 1,
                total_problemas: 0,
                problemas_completados: 0
            },
            {
                id: 3,
                IdTemas: 3,
                titulo: "Bucles",
                descripcion: "For y while loops",
                orden: 3,
                IdNivel: 1,
                locked: 1,
                total_problemas: 0,
                problemas_completados: 0
            },
            {
                id: 4,
                IdTemas: 4,
                titulo: "Funciones Básicas",
                descripcion: "Aprende a crear y usar funciones",
                orden: 1,
                IdNivel: 2,
                locked: 1,
                total_problemas: 0,
                problemas_completados: 0
            },
            {
                id: 5,
                IdTemas: 5,
                titulo: "Listas y Diccionarios",
                descripcion: "Estructuras de datos básicas",
                orden: 2,
                IdNivel: 2,
                locked: 1,
                total_problemas: 0,
                problemas_completados: 0
            },
            {
                id: 6,
                IdTemas: 6,
                titulo: "Programación Orientada a Objetos",
                descripcion: "Clases y objetos",
                orden: 1,
                IdNivel: 3,
                locked: 1,
                total_problemas: 0,
                problemas_completados: 0
            }
        ];
        
        // Filtrar por nivel si se especifica
        if (nivelId !== null && nivelId !== undefined) {
            return todosLosTemas.filter(t => 
                (t.IdNivel === nivelId || t.idNivel === nivelId || t.nivel_id === nivelId || t.nivelId === nivelId)
            );
        }
        
        return todosLosTemas;
    }

    async getMockProblemas(temaId) {
        if (temaId === 1) {
            return [
                {
                    id: 1,
                    tema_id: 1,
                    titulo: "Declaración de variables",
                    descripcion: "Crea una variable llamada 'nombre' y asígnale tu nombre",
                    ejemplo: "nombre = 'Ana'",
                    dificultad: "Fácil",
                    codigo_inicial: "# Escribe tu código aquí\n",
                    solucion: "nombre = 'Ana'",
                    orden: 1,
                    locked: 0,
                    puntos_otorgados: 10,
                    resuelto: false,
                    puntuacion: 0,
                    ultimo_codigo: null
                },
                {
                    id: 2,
                    tema_id: 1,
                    titulo: "Múltiples variables",
                    descripcion: "Crea tres variables: nombre (texto), edad (número) y activo (booleano)",
                    ejemplo: "nombre = 'Juan', edad = 25, activo = True",
                    dificultad: "Fácil",
                    codigo_inicial: "# Escribe tu código aquí\n",
                    solucion: "nombre = 'Juan'\nedad = 25\nactivo = True",
                    orden: 2,
                    locked: 1,
                    puntos_otorgados: 15,
                    resuelto: false,
                    puntuacion: 0,
                    ultimo_codigo: null
                },
                {
                    id: 3,
                    tema_id: 1,
                    titulo: "Operaciones con variables",
                    descripcion: "Crea dos variables numéricas y calcula su suma, resta y multiplicación",
                    ejemplo: "a = 10, b = 5 → suma = 15, resta = 5, multiplicacion = 50",
                    dificultad: "Medio",
                    codigo_inicial: "# Escribe tu código aquí\n",
                    solucion: "a = 10\nb = 5\nsuma = a + b\nresta = a - b\nmultiplicacion = a * b",
                    orden: 3,
                    locked: 1,
                    puntos_otorgados: 20,
                    resuelto: false,
                    puntuacion: 0,
                    ultimo_codigo: null
                }
            ];
        }
        return [];
    }

    async getMockProblema(problemaId) {
        const problemas = await this.getMockProblemas(1);
        return problemas.find(p => p.id === problemaId) || null;
    }
}

// Solo crear la instancia si no existe
if (!window.curriculumManager) {
    window.curriculumManager = new CurriculumManager();
}