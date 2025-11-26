// js/problems-renderer.js
// Load achievements.js functions
if (typeof showAchievementPopup === 'undefined') {
    // If achievements.js is not loaded, define a placeholder
    window.showAchievementPopup = async function (nombre, descripcion, icono) {
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
        console.log('🔄 Inicializando ProblemsRenderer con userId:', userId, 'nivelId:', nivelId);
        this.userId = userId;
        this.currentNivelId = nivelId || 1;

        try {
            await window.curriculumManager.init(userId);
            console.log('✅ CurriculumManager inicializado');

            // Load a random problem for the user
            await this.loadRandomProblem();
        } catch (error) {
            console.error('❌ Error en init:', error);
            this.showError('Error al inicializar: ' + error.message);
        }
    }

    async loadRandomProblem() {
        try {
            console.log('🔄 Cargando problema aleatorio...');

            // Hide problem selection UI
            this.hideProblemSelection();

            // Show loading state
            this.showLoading();

            const problema = await window.curriculumManager.getRandomProblem(this.userId);

            if (!problema) {
                this.showError('No se pudo cargar un problema. Intenta de nuevo.');
                return;
            }

            console.log('✅ Problema cargado:', problema);
            this.currentProblema = problema;
            this.currentProblemaId = problema.id || problema.Id || problema.IdProblema;

            this.renderProblem(problema);
        } catch (error) {
            console.error('❌ Error cargando problema:', error);
            this.showError('Error al cargar el problema: ' + error.message);
        }
    }

    renderProblem(problema) {
        try {
            const problemaId = problema.id || problema.Id || problema.IdProblema;
            const titulo = problema.titulo || problema.Titulo || 'Sin título';
            const descripcion = problema.descripcion || problema.Descripcion || '';
            const ejemplo = problema.ejemplo || problema.Ejemplo || '';
            const dificultad = problema.dificultad || problema.Dificultad || 'Media';
            const puntos = problema.puntos_otorgados || problema.PuntosOtorgados || 0;
            const codigoInicial = problema.codigo_inicial || problema.CodigoInicial || '# Escribe tu código aquí\n';

            // Update UI
            const problemTitleEl = document.getElementById('problem-title');
            const problemDescEl = document.getElementById('problem-description');

            if (problemTitleEl) {
                problemTitleEl.textContent = titulo;
            }

            if (problemDescEl) {
                problemDescEl.innerHTML = `
                    <div class="space-y-4">
                        <p class="text-gray-700 dark:text-gray-300">${descripcion}</p>
                        ${ejemplo ? `
                            <div class="mt-4 p-3 bg-blue-50 dark:bg-slate-700 rounded-lg">
                                <strong class="text-blue-800 dark:text-blue-300">Ejemplo:</strong>
                                <code class="block mt-2 text-sm bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">${ejemplo}</code>
                            </div>
                        ` : ''}
                        <div class="flex gap-4 text-sm text-gray-600 dark:text-slate-400">
                            <span><strong>Dificultad:</strong> ${dificultad}</span>
                            <span><strong>Puntos:</strong> ${puntos}</span>
                        </div>
                    </div>
                `;
            }

            // Load code in editor
            if (window.monacoEditor) {
                window.monacoEditor.setValue(codigoInicial);
                console.log('✅ Código inicial cargado en editor');
            } else {
                console.log('⚠ Editor Monaco no está disponible');
            }

            // Enable buttons
            const runBtn = document.getElementById('run-btn');
            const verifyBtn = document.getElementById('verify-btn');
            if (runBtn) runBtn.disabled = false;
            if (verifyBtn) verifyBtn.disabled = false;

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

                    // Load a new random problem after a delay
                    setTimeout(async () => {
                        await this.loadRandomProblem();
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
