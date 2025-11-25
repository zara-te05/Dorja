// js/problems-renderer.js
// Load achievements.js functions
if (typeof showAchievementPopup === 'undefined') {
    // If achievements.js is not loaded, define a placeholder
    window.showAchievementPopup = async function(nombre, descripcion, icono) {
        console.log('Achievement unlocked:', nombre);
    };
}

class ProblemsRenderer {
    constructor() {
        this.currentProblemaId = null;
        this.currentProblema = null;
        this.userId = null;
    }

    async init(userId, nivelId = null) {
        console.log('🔄 Inicializando ProblemsRenderer con userId:', userId);
        this.userId = userId;
        this.currentNivelId = nivelId;
        
        try {
            await window.curriculumManager.init(userId);
            console.log('✅ CurriculumManager inicializado');
            
            // Load the next problem for the user (enforces syllabus order)
            await this.loadRandomProblem();
        } catch (error) {
            console.error('❌ Error en init:', error);
            this.showError('Error al inicializar: ' + error.message);
        }
    }

    async loadProgressDashboard(userId) {
        try {
            console.log('📊 Cargando progreso para usuario:', userId);
            const progress = await window.api.getUserProgress(userId);
            console.log('📊 Progreso recibido:', progress);
            
            if (progress) {
                // Handle different response formats
                const progressData = progress.data || progress;
                
                const completedEl = document.getElementById('progress-completed');
                const pendingEl = document.getElementById('progress-pending');
                const pointsEl = document.getElementById('progress-points');
                const percentageEl = document.getElementById('progress-percentage');

                if (completedEl) {
                    completedEl.textContent = progressData.problemasCompletados || progressData.ProblemasCompletados || 0;
                }
                if (pendingEl) {
                    pendingEl.textContent = progressData.problemasPendientes || progressData.ProblemasPendientes || 0;
                }
                if (pointsEl) {
                    pointsEl.textContent = progressData.totalPuntos || progressData.TotalPuntos || 0;
                }
                if (percentageEl) {
                    const percentage = progressData.porcentajeCompletado || progressData.PorcentajeCompletado || 0;
                    percentageEl.textContent = percentage + '%';
                }
                console.log('✅ Dashboard de progreso actualizado');
            } else {
                console.warn('⚠️ No se recibió información de progreso');
            }
        } catch (error) {
            console.error('❌ Error cargando progreso:', error);
            // Don't show error to user for progress - it's not critical
            // Just set default values
            const completedEl = document.getElementById('progress-completed');
            const pendingEl = document.getElementById('progress-pending');
            const pointsEl = document.getElementById('progress-points');
            const percentageEl = document.getElementById('progress-percentage');
            
            if (completedEl) completedEl.textContent = '0';
            if (pendingEl) pendingEl.textContent = '-';
            if (pointsEl) pointsEl.textContent = '0';
            if (percentageEl) percentageEl.textContent = '0%';
        }
    }

    async loadRandomProblem() {
        try {
            console.log('🔄 Cargando siguiente problema para usuario:', this.userId);
            
            // Hide problem selection UI
            this.hideProblemSelection();
            
            // Show loading state
            this.showLoading();
            
            // Get the next problem directly from API
            let problema = null;
            try {
                const response = await window.api.getNextProblem(this.userId);
                console.log('📥 Respuesta completa de getNextProblem:', response);
                
                // Handle different response formats
                if (!response) {
                    throw new Error('No se recibió respuesta del servidor');
                }
                
                // The API wrapper returns { success: true, data: ... } or the object directly
                if (response && typeof response === 'object') {
                    // Check if it's wrapped in a data property
                    if (response.data && (response.data.id || response.data.Id || response.data.titulo || response.data.Titulo)) {
                        problema = response.data;
                    } 
                    // Check if it's a direct problem object
                    else if (response.id || response.Id || response.titulo || response.Titulo) {
                        problema = response;
                    }
                    // Check if it's wrapped but data is the problem
                    else if (response.data) {
                        problema = response.data;
                    }
                    else {
                        console.error('❌ Formato de respuesta inesperado:', response);
                        throw new Error('Formato de respuesta inesperado del servidor');
                    }
                } else {
                    console.error('❌ Respuesta no es un objeto:', response);
                    throw new Error('Formato de respuesta inválido');
                }
                
                console.log('✅ Problema recibido de API:', problema);
            } catch (apiError) {
                console.error('❌ Error en API getNextProblem:', apiError);
                console.error('Error details:', {
                    message: apiError.message,
                    stack: apiError.stack
                });
                
                // Show user-friendly error
                const errorMessage = apiError.message || 'Error desconocido';
                if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                    this.showError('Error del servidor. Por favor, verifica que el backend esté ejecutándose correctamente y que la base de datos esté inicializada. Revisa los logs del backend para más detalles.');
                } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
                    this.showError('Endpoint no encontrado. Por favor, verifica que el backend esté actualizado y reinicia el servidor.');
                } else if (errorMessage.includes('Formato')) {
                    this.showError('Error al procesar la respuesta del servidor. Por favor, recarga la página.');
                } else {
                    this.showError(`Error al cargar el problema: ${errorMessage}`);
                }
                return;
            }
            
            if (!problema) {
                this.showError('No se pudo cargar un problema. Intenta recargar la página.');
                return;
            }

            console.log('✅ Problema procesado:', problema);
            this.currentProblema = problema;
            
            // Try multiple property name variations
            this.currentProblemaId = problema.id || problema.Id || problema.IdProblema || problema.problemaId;
            
            if (!this.currentProblemaId) {
                console.error('❌ No se pudo obtener el ID del problema:', problema);
                this.showError('Error: El problema no tiene un ID válido. Por favor, contacta al administrador.');
                return;
            }
            
            this.renderProblem(problema);
        } catch (error) {
            console.error('❌ Error cargando problema:', error);
            this.showError('Error al cargar el problema: ' + (error.message || 'Error desconocido'));
        }
    }

    renderProblem(problema) {
        try {
            console.log('🎨 Renderizando problema:', problema);
            
            // Try multiple property name variations (handle both camelCase and PascalCase)
            const problemaId = problema.id || problema.Id || problema.IdProblema;
            const titulo = problema.titulo || problema.Titulo || 'Sin título';
            const descripcion = problema.descripcion || problema.Descripcion || problema.descripcion || '';
            const ejemplo = problema.ejemplo || problema.Ejemplo || '';
            const dificultad = problema.dificultad || problema.Dificultad || 'Media';
            const puntos = problema.puntos_otorgados || problema.PuntosOtorgados || problema.puntosOtorgados || 0;
            const codigoInicial = problema.codigo_inicial || problema.CodigoInicial || problema.codigoInicial || '# Escribe tu código aquí\n';

            console.log('📋 Datos del problema:', {
                id: problemaId,
                titulo,
                descripcion: descripcion.substring(0, 50) + '...',
                dificultad,
                puntos
            });

            // Update problem title
            const problemTitleEl = document.getElementById('problem-title');
            if (problemTitleEl) {
                problemTitleEl.textContent = titulo;
                console.log('✅ Título actualizado:', titulo);
            } else {
                console.error('❌ No se encontró el elemento problem-title');
            }
            
            // Update problem description
            const problemDescEl = document.getElementById('problem-description');
            if (problemDescEl) {
                // Escape HTML in description and example to prevent XSS
                const escapeHtml = (text) => {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                };

                const descripcionEscapada = escapeHtml(descripcion);
                const ejemploEscapado = ejemplo ? escapeHtml(ejemplo) : '';
                
                problemDescEl.innerHTML = `
                    <div class="space-y-4">
                        <div class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${descripcionEscapada}</div>
                        ${ejemplo ? `
                            <div class="mt-4 p-4 bg-blue-50 dark:bg-slate-700 rounded-lg border border-blue-200 dark:border-slate-600">
                                <strong class="text-blue-800 dark:text-blue-300 block mb-2">Ejemplo:</strong>
                                <pre class="text-sm bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded overflow-x-auto"><code>${ejemploEscapado}</code></pre>
                            </div>
                        ` : ''}
                        <div class="flex gap-4 text-sm text-gray-600 dark:text-slate-400 mt-4">
                            <span class="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded"><strong>Dificultad:</strong> ${dificultad}</span>
                            <span class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 rounded"><strong>Puntos:</strong> ${puntos}</span>
                        </div>
                    </div>
                `;
                console.log('✅ Descripción actualizada');
            } else {
                console.error('❌ No se encontró el elemento problem-description');
            }

            // Load code in editor - wait for Monaco to be ready
            const loadCodeInEditor = (code) => {
                if (window.monacoEditor) {
                    try {
                        window.monacoEditor.setValue(code);
                        console.log('✅ Código inicial cargado en editor');
                        return true;
                    } catch (error) {
                        console.error('❌ Error cargando código en editor:', error);
                        return false;
                    }
                }
                return false;
            };

            if (!loadCodeInEditor(codigoInicial)) {
                console.warn('⚠ Editor Monaco no está disponible aún, esperando...');
                // Wait for Monaco editor ready event
                const waitForEditor = () => {
                    return new Promise((resolve) => {
                        if (window.monacoEditor) {
                            resolve();
                            return;
                        }
                        const handler = () => {
                            window.removeEventListener('monaco-editor-ready', handler);
                            resolve();
                        };
                        window.addEventListener('monaco-editor-ready', handler);
                        // Timeout after 5 seconds
                        setTimeout(() => {
                            window.removeEventListener('monaco-editor-ready', handler);
                            resolve();
                        }, 5000);
                    });
                };
                
                waitForEditor().then(() => {
                    loadCodeInEditor(codigoInicial);
                });
            }

            // Enable buttons
            const runBtn = document.getElementById('run-btn');
            const verifyBtn = document.getElementById('verify-btn');
            if (runBtn) {
                runBtn.disabled = false;
                console.log('✅ Botón Ejecutar habilitado');
            }
            if (verifyBtn) {
                verifyBtn.disabled = false;
                console.log('✅ Botón Verificar habilitado');
            }

            // Clear output
            const outputContent = document.getElementById('output-content');
            if (outputContent) {
                outputContent.textContent = '# Escribe tu código y presiona "Ejecutar" para probarlo, o "Verificar" para validar la solución.';
                outputContent.classList.remove('text-green-600', 'text-red-600');
            }

            // Hide loading, show problem
            this.hideLoading();
            this.showProblem();

            console.log('✅ Problema renderizado correctamente');
        } catch (error) {
            console.error('❌ Error renderizando problema:', error);
            this.showError('Error al mostrar el problema: ' + error.message);
        }
    }

    hideProblemSelection() {
        // Hide the topics sidebar and problems list
        const topicsSidebar = document.getElementById('topics-sidebar');
        const problemsList = document.getElementById('problems-list');
        const problemsTitle = document.getElementById('problems-title');
        
        if (topicsSidebar) {
            topicsSidebar.style.display = 'none';
        }
        if (problemsList) {
            problemsList.style.display = 'none';
        }
        if (problemsTitle) {
            problemsTitle.style.display = 'none';
        }
    }

    showLoading() {
        const problemContainer = document.getElementById('problem-container') || 
                               document.querySelector('.problem-container') ||
                               document.querySelector('[id*="problem"]');
        
        if (problemContainer) {
            const loadingHtml = `
                <div class="flex items-center justify-center h-64">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p class="text-gray-600 dark:text-slate-400">Cargando problema...</p>
                    </div>
                </div>
            `;
            const problemDescEl = document.getElementById('problem-description');
            if (problemDescEl) {
                problemDescEl.innerHTML = loadingHtml;
            }
        }
    }

    hideLoading() {
        // Loading is hidden when problem is rendered
    }

    showProblem() {
        const problemContainer = document.getElementById('problem-container') || 
                               document.querySelector('.problem-container');
        if (problemContainer) {
            problemContainer.style.display = 'block';
        }
    }

    showError(message) {
        const problemDescEl = document.getElementById('problem-description');
        if (problemDescEl) {
            problemDescEl.innerHTML = `
                <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p class="text-red-800 dark:text-red-300">${message}</p>
                    <button onclick="window.problemsRenderer.loadRandomProblem()" 
                            class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Intentar de nuevo
                    </button>
                </div>
            `;
        }
    }

    async verificarSolucion() {
        if (!this.currentProblemaId || !this.userId) {
            this.showError('Por favor, espera a que se cargue el problema.');
            return;
        }
        
        const outputContent = document.getElementById('output-content');
        if (outputContent) {
            outputContent.textContent = "Verificando solución...";
            outputContent.classList.remove('text-green-600', 'text-red-600');
        }
        
        try {
            const codigo = window.monacoEditor?.getValue() || '';
            if (!codigo.trim()) {
                if (outputContent) {
                    outputContent.textContent = "Por favor, escribe algún código antes de verificar.";
                    outputContent.classList.add('text-red-600');
                }
                return;
            }

            const resultado = await window.curriculumManager.verificarSolucion(codigo, this.currentProblemaId);
            
            if (outputContent) {
                outputContent.textContent = resultado.mensaje || resultado.message || "Resultado desconocido";
                
                if (resultado.correcto || resultado.IsCorrect) {
                    outputContent.classList.add('text-green-600');
                    outputContent.classList.remove('text-red-600');
                    
                    // Show success message with points
                    if (resultado.puntosOtorgados || resultado.PuntosOtorgados) {
                        const puntos = resultado.puntosOtorgados || resultado.PuntosOtorgados;
                        outputContent.textContent += ` (+${puntos} puntos)`;
                    }
                    
                    // Disable verify button temporarily
                    const verifyBtn = document.getElementById('verify-btn');
                    if (verifyBtn) {
                        verifyBtn.disabled = true;
                    }
                    
                    // Reload progress dashboard
                    await this.loadProgressDashboard(this.userId);
                    
                    // Load a new random problem after a delay
                    setTimeout(async () => {
                        await this.loadRandomProblem();
                        await this.loadProgressDashboard(this.userId);
                        if (verifyBtn) {
                            verifyBtn.disabled = false;
                        }
                    }, 2000);
                } else {
                    outputContent.classList.add('text-red-600');
                    outputContent.classList.remove('text-green-600');
                }
            }
        } catch (error) {
            console.error('Error verificando solución:', error);
            if (outputContent) {
                outputContent.textContent = `Error: ${error.message || 'Error desconocido al verificar la solución.'}`;
                outputContent.classList.add('text-red-600');
                outputContent.classList.remove('text-green-600');
            }
        }
    }

    async ejecutarCodigo() {
        if (!this.currentProblemaId) {
            const outputContent = document.getElementById('output-content');
            if (outputContent) {
                outputContent.textContent = "Por favor, espera a que se cargue el problema.";
            }
            return;
        }

        const outputContent = document.getElementById('output-content');
        if (outputContent) {
            outputContent.textContent = "Ejecutando código...";
            outputContent.classList.remove('text-green-600', 'text-red-600');
        }
        
        try {
            const codigo = window.monacoEditor?.getValue() || '';
            const language = window.currentLanguage || document.getElementById('language-selector')?.value || 'python';
            const userId = this.userId || (sessionStorage.getItem('userId') ? parseInt(sessionStorage.getItem('userId')) : null);
            
            if (!codigo.trim()) {
                if (outputContent) {
                    outputContent.textContent = "Por favor, escribe algún código antes de ejecutar.";
                }
                return;
            }

            const resultado = await window.api.executeCode(codigo, language, userId);
            
            if (outputContent) {
                if (resultado.success) {
                    outputContent.textContent = resultado.output || 'Código ejecutado correctamente.';
                    outputContent.classList.add('text-green-600');
                    outputContent.classList.remove('text-red-600');
                    
                    // Show achievement popup if granted
                    if (resultado.achievementGranted) {
                        await showAchievementPopup('Tu primer código', 'Has ejecutado tu primer código. ¡El inicio de una gran aventura!', 'fa-code');
                    }
                } else {
                    outputContent.textContent = resultado.output || resultado.message || 'Error al ejecutar el código.';
                    outputContent.classList.add('text-red-600');
                    outputContent.classList.remove('text-green-600');
                }
            }
        } catch (error) {
            console.error('Error ejecutando código:', error);
            if (outputContent) {
                outputContent.textContent = `Error: ${error.message || 'Error desconocido al ejecutar el código.'}`;
                outputContent.classList.add('text-red-600');
                outputContent.classList.remove('text-green-600');
            }
        }
    }
}

// Create global instance
window.problemsRenderer = new ProblemsRenderer();
