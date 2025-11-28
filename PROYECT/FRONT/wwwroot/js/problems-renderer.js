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
        this.currentTemaId = null;
        this.temas = [];
        this.problemas = [];
        this.problemasPorTema = {};
        this.progresoPorTema = {};
        this.currentNivelId = 1;
    }

    async init(userId, nivelId = null) {
        console.log('🔄 Inicializando ProblemsRenderer con userId:', userId, 'nivelId:', nivelId);
        this.userId = userId;
        this.currentNivelId = nivelId || 1;

        try {
            await window.curriculumManager.init(userId);
            console.log('✅ CurriculumManager inicializado');

            // Load user progress to determine unlocked topics
            await this.loadUserProgress();
            
            // Render topics and problems organized by syllabus
            await this.renderSidebarTemas();
        } catch (error) {
            console.error('❌ Error en init:', error);
            this.showError('Error al inicializar: ' + error.message);
        }
    }

    async loadUserProgress() {
        try {
            const progreso = await window.api.getProgresoByUserId(this.userId);
            
            // Handle different response formats
            let progresoArray = [];
            if (Array.isArray(progreso)) {
                progresoArray = progreso;
            } else if (progreso && Array.isArray(progreso.data)) {
                progresoArray = progreso.data;
            } else if (progreso && progreso.success && Array.isArray(progreso.data)) {
                progresoArray = progreso.data;
            }
            
            if (progresoArray.length === 0) {
                this.progresoPorTema = {};
                console.log('📊 No hay progreso registrado para el usuario');
                return;
            }

            // Get all problems to map problemaId to temaId
            let allProblemas = [];
            try {
                // Get problems from all topics in current level
                const temas = await window.curriculumManager.cargarTemas(this.currentNivelId);
                for (const tema of temas) {
                    const temaId = tema.id || tema.IdTemas || tema.Id;
                    try {
                        const problemas = await window.curriculumManager.cargarProblemas(temaId);
                        if (Array.isArray(problemas)) {
                            allProblemas = allProblemas.concat(problemas);
                        }
                    } catch (err) {
                        console.warn(`Error cargando problemas del tema ${temaId}:`, err);
                    }
                }
            } catch (err) {
                console.warn('Error cargando problemas por tema:', err);
            }

            // Create a map of problemaId to temaId
            const problemaToTema = {};
            for (const problema of allProblemas) {
                const problemaId = problema.id || problema.Id;
                const temaId = problema.temaId || problema.TemaId || problema.tema_id;
                if (problemaId && temaId) {
                    problemaToTema[problemaId] = temaId;
                }
            }

            // Group progress by tema (topic)
            this.progresoPorTema = {};
            for (const p of progresoArray) {
                const problemaId = p.problemaId || p.ProblemaId;
                const completado = p.completado || p.Completado || false;
                
                if (completado && problemaId) {
                    // Use the map if available, otherwise fetch individual problem
                    let temaId = problemaToTema[problemaId];
                    
                    if (!temaId) {
                        // Fallback: get the problem individually
                        try {
                            const problema = await window.curriculumManager.obtenerProblema(problemaId);
                            if (problema) {
                                temaId = problema.temaId || problema.TemaId || problema.tema_id;
                                if (temaId) {
                                    problemaToTema[problemaId] = temaId; // Cache it
                                }
                            }
                        } catch (err) {
                            console.warn('Error obteniendo problema para progreso:', err);
                            continue;
                        }
                    }
                    
                    if (temaId) {
                        if (!this.progresoPorTema[temaId]) {
                            this.progresoPorTema[temaId] = [];
                        }
                        this.progresoPorTema[temaId].push(problemaId);
                    }
                }
            }
            
            console.log('📊 Progreso por tema:', this.progresoPorTema);
        } catch (error) {
            console.error('❌ Error cargando progreso:', error);
            this.progresoPorTema = {};
        }
    }

    async renderSidebarTemas() {
        try {
            // Load topics for current level
            this.temas = await window.curriculumManager.cargarTemas(this.currentNivelId);
            console.log('📚 Temas cargados:', this.temas);
            
            // Sort topics by order
            this.temas.sort((a, b) => (a.orden || a.Orden || 0) - (b.orden || b.Orden || 0));
            
            // Determine which topics are unlocked
            const temasUnlocked = this.determineUnlockedTopics();
            
            // Render topics sidebar
            const topicsList = document.getElementById('topics-list');
            if (topicsList) {
                if (this.temas.length === 0) {
                    topicsList.innerHTML = '<div class="text-gray-500 dark:text-slate-400 text-sm p-4">No hay temas disponibles</div>';
                    return;
                }

                // Load problems count for each topic
                this.temas = await Promise.all(this.temas.map(async (tema) => {
                    // Try multiple ways to get temaId
                    const temaId = tema.id || tema.IdTemas || tema.Id || tema.idTemas;
                    console.log('🔍 Extrayendo temaId del tema:', tema, '→ temaId:', temaId);
                    
                    if (!temaId) {
                        console.error('❌ No se pudo extraer temaId del tema:', tema);
                        return { ...tema, total_problemas: 0 };
                    }
                    
                    try {
                        const problemas = await window.curriculumManager.cargarProblemas(temaId);
                        return { ...tema, total_problemas: Array.isArray(problemas) ? problemas.length : 0 };
                    } catch (error) {
                        console.warn(`Error cargando problemas para tema ${temaId}:`, error);
                        return { ...tema, total_problemas: 0 };
                    }
                }));

                let html = '';
                for (let i = 0; i < this.temas.length; i++) {
                    const tema = this.temas[i];
                    // Try multiple ways to get temaId - backend uses IdTemas
                    const temaId = tema.id || tema.IdTemas || tema.Id || tema.idTemas;
                    const titulo = tema.titulo || tema.Titulo || 'Sin título';
                    const descripcion = tema.descripcion || tema.Descripcion || '';
                    
                    if (!temaId) {
                        console.error('❌ Tema sin ID válido:', tema);
                        continue;
                    }
                    
                    const isLocked = !temasUnlocked[temaId];
                    const completados = (this.progresoPorTema[temaId] || []).length;
                    const totalProblemas = tema.total_problemas || 0;
                    
                    html += `
                        <div class="tema p-3 mb-2 rounded ${isLocked ? 'locked' : ''}" 
                             data-tema-id="${temaId || ''}"
                             ${isLocked ? '' : 'style="cursor: pointer;"'}>
                            <div class="flex items-center justify-between mb-1">
                                <h4 class="font-semibold text-gray-800 dark:text-white">${titulo}</h4>
                                ${isLocked ? '<span class="text-xs text-gray-500">🔒</span>' : ''}
                            </div>
                            <p class="text-xs text-gray-600 dark:text-slate-400 mb-2">${descripcion}</p>
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-gray-500 dark:text-slate-400">
                                    ${completados}/${totalProblemas} completados
                                </span>
                                ${!isLocked && completados >= 10 ? 
                                    '<span class="text-green-600 dark:text-green-400">✓ Desbloqueado</span>' : 
                                    isLocked ? 
                                    `<span class="text-gray-500">Completa 10 del tema anterior</span>` :
                                    `<span class="text-blue-600">${10 - completados} para desbloquear siguiente</span>`
                                }
                            </div>
                            ${!isLocked ? `
                                <div class="mt-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div class="bg-indigo-600 h-2 rounded-full progress-bar" 
                                         style="width: ${Math.min((completados / 10) * 100, 100)}%"></div>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
                
                topicsList.innerHTML = html;
                
                // Add click handlers
                topicsList.querySelectorAll('.tema:not(.locked)').forEach(el => {
                    el.addEventListener('click', () => {
                        const temaIdStr = el.dataset.temaId;
                        const temaId = temaIdStr ? parseInt(temaIdStr) : null;
                        console.log('🖱️ Click en tema. temaId del dataset:', temaIdStr, '→ parseado:', temaId);
                        if (temaId && !isNaN(temaId)) {
                            this.selectTema(temaId);
                        } else {
                            console.error('❌ temaId inválido al hacer click:', temaIdStr);
                        }
                    });
                });
                
                // Update topics count
                const topicsCount = document.getElementById('topics-count');
                if (topicsCount) {
                    const unlockedCount = Object.values(temasUnlocked).filter(v => v).length;
                    topicsCount.textContent = `${unlockedCount}/${this.temas.length} temas desbloqueados`;
                }
                
                // Auto-select first unlocked topic
                const firstUnlockedTema = this.temas.find(t => {
                    const temaId = t.id || t.IdTemas || t.Id || t.idTemas;
                    return temaId && temasUnlocked[temaId];
                });
                
                if (firstUnlockedTema) {
                    const temaId = firstUnlockedTema.id || firstUnlockedTema.IdTemas || firstUnlockedTema.Id || firstUnlockedTema.idTemas;
                    console.log('🔄 Auto-seleccionando primer tema desbloqueado:', temaId, 'Tema:', firstUnlockedTema);
                    // Use setTimeout to ensure DOM is ready
                    setTimeout(() => {
                        this.selectTema(temaId);
                    }, 100);
                } else {
                    console.warn('⚠ No se encontró ningún tema desbloqueado. Temas:', this.temas);
                }
            }
        } catch (error) {
            console.error('❌ Error renderizando temas:', error);
            const topicsList = document.getElementById('topics-list');
            if (topicsList) {
                topicsList.innerHTML = '<div class="text-red-500 text-sm p-4">Error al cargar temas</div>';
            }
        }
    }

    determineUnlockedTopics() {
        const unlocked = {};
        
        // First topic is always unlocked
        if (this.temas.length > 0) {
            const firstTema = this.temas[0];
            const firstTemaId = firstTema.id || firstTema.IdTemas || firstTema.Id || firstTema.idTemas;
            if (firstTemaId) {
                unlocked[firstTemaId] = true;
            }
        }
        
        // Subsequent topics are unlocked if previous topic has 10+ completed problems
        for (let i = 1; i < this.temas.length; i++) {
            const prevTema = this.temas[i - 1];
            const prevTemaId = prevTema.id || prevTema.IdTemas || prevTema.Id || prevTema.idTemas;
            if (!prevTemaId) continue;
            
            const prevCompletados = (this.progresoPorTema[prevTemaId] || []).length;
            
            if (prevCompletados >= 10) {
                const currentTema = this.temas[i];
                const currentTemaId = currentTema.id || currentTema.IdTemas || currentTema.Id || currentTema.idTemas;
                if (currentTemaId) {
                    unlocked[currentTemaId] = true;
                }
            } else {
                break; // Stop unlocking if a topic doesn't meet requirements
            }
        }
        
        console.log('🔓 Temas desbloqueados:', unlocked);
        return unlocked;
    }

    async selectTema(temaId) {
        try {
            console.log('🔄 Seleccionando tema:', temaId);
            this.currentTemaId = temaId;
            
            // Load problems for this topic
            this.problemas = await window.curriculumManager.cargarProblemas(temaId);
            console.log('📝 Problemas cargados para tema', temaId, ':', this.problemas);
            
            // Ensure problemas is an array
            if (!Array.isArray(this.problemas)) {
                console.warn('⚠ Problemas no es un array:', this.problemas);
                this.problemas = [];
            }
            
            // Sort problems by order
            this.problemas.sort((a, b) => (a.orden || a.Orden || 0) - (b.orden || b.Orden || 0));
            
            // Render problems sidebar
            await this.renderProblemsList();
            
            // Highlight selected topic
            document.querySelectorAll('.tema').forEach(el => {
                el.classList.remove('active');
                if (parseInt(el.dataset.temaId) === temaId) {
                    el.classList.add('active');
                }
            });
        } catch (error) {
            console.error('❌ Error seleccionando tema:', error);
            const problemsList = document.getElementById('problems-list');
            if (problemsList) {
                problemsList.innerHTML = `<div class="text-red-500 text-sm p-4">Error al cargar problemas: ${error.message}</div>`;
            }
        }
    }

    async renderProblemsList() {
        const problemsList = document.getElementById('problems-list');
        const problemsTitle = document.getElementById('problems-title');
        const problemsCount = document.getElementById('problems-count');
        
        if (!problemsList) {
            console.warn('⚠ Elemento problems-list no encontrado');
            return;
        }
        
        console.log('🔄 Renderizando lista de problemas. TemaId:', this.currentTemaId, 'Problemas:', this.problemas?.length || 0);
        
        if (!this.currentTemaId) {
            problemsList.innerHTML = '<div class="text-gray-500 dark:text-slate-400 text-sm p-4">Selecciona un tema para ver los problemas</div>';
            if (problemsCount) problemsCount.textContent = '0 problemas';
            return;
        }
        
        if (!this.problemas || this.problemas.length === 0) {
            problemsList.innerHTML = '<div class="text-yellow-500 dark:text-yellow-400 text-sm p-4">No hay problemas disponibles para este tema</div>';
            if (problemsCount) problemsCount.textContent = '0 problemas';
            console.warn('⚠ No hay problemas para el tema', this.currentTemaId);
            return;
        }
        
        // Get completed problems for this topic
        const completados = this.progresoPorTema[this.currentTemaId] || [];
        
        let html = '';
        for (let i = 0; i < this.problemas.length; i++) {
            const problema = this.problemas[i];
            const problemaId = problema.id || problema.Id;
            const titulo = problema.titulo || problema.Titulo || 'Sin título';
            const isCompleted = completados.includes(problemaId);
            const isLocked = problema.locked || problema.Locked;
            const isActive = this.currentProblemaId === problemaId;
            
            html += `
                <div class="problema-item p-2 mb-1 rounded ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}"
                     data-problema-id="${problemaId}"
                     ${isLocked ? '' : 'style="cursor: pointer;"'}>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-700 dark:text-gray-300">${i + 1}. ${titulo}</span>
                        ${isCompleted ? '<span class="text-green-600">✓</span>' : ''}
                        ${isLocked ? '<span class="text-gray-500 text-xs">🔒</span>' : ''}
                    </div>
                </div>
            `;
        }
        
        problemsList.innerHTML = html;
        
        // Add click handlers
        problemsList.querySelectorAll('.problema-item:not(.locked)').forEach(el => {
            el.addEventListener('click', () => {
                const problemaId = parseInt(el.dataset.problemaId);
                this.cargarProblema(problemaId);
            });
        });
        
        // Update problems count
        if (problemsCount) {
            problemsCount.textContent = `${completados.length}/${this.problemas.length} completados`;
        }
        
        if (problemsTitle) {
            const tema = this.temas.find(t => (t.id || t.IdTemas || t.Id) === this.currentTemaId);
            problemsTitle.textContent = `Problemas - ${tema ? (tema.titulo || tema.Titulo) : 'Tema'}`;
        }
    }

    async cargarProblema(problemaId) {
        try {
            this.showLoading();
            
            const problema = await window.curriculumManager.obtenerProblema(problemaId);
            
            if (!problema) {
                this.showError('No se pudo cargar el problema.');
                return;
            }
            
            this.currentProblema = problema;
            this.currentProblemaId = problemaId;
            
            this.renderProblem(problema);
            
            // Update active problem in list
            document.querySelectorAll('.problema-item').forEach(el => {
                el.classList.remove('active');
                if (parseInt(el.dataset.problemaId) === problemaId) {
                    el.classList.add('active');
                }
            });
            
            // Update problem counter
            const index = this.problemas.findIndex(p => (p.id || p.Id) === problemaId);
            const problemCounter = document.getElementById('problem-counter');
            if (problemCounter) {
                problemCounter.textContent = `${index + 1}/${this.problemas.length}`;
            }
            
            // Update navigation buttons
            const prevBtn = document.getElementById('prev-problem-btn');
            const nextBtn = document.getElementById('next-problem-btn');
            if (prevBtn) prevBtn.disabled = index === 0;
            if (nextBtn) nextBtn.disabled = index === this.problemas.length - 1;
            
        } catch (error) {
            console.error('❌ Error cargando problema:', error);
            this.showError('Error al cargar el problema: ' + error.message);
        }
    }

    cargarProblemaAnterior() {
        if (!this.currentProblemaId || this.problemas.length === 0) return;
        
        const currentIndex = this.problemas.findIndex(p => (p.id || p.Id) === this.currentProblemaId);
        if (currentIndex > 0) {
            const prevProblema = this.problemas[currentIndex - 1];
            this.cargarProblema(prevProblema.id || prevProblema.Id);
        }
    }

    cargarProblemaSiguiente() {
        if (!this.currentProblemaId || this.problemas.length === 0) return;
        
        const currentIndex = this.problemas.findIndex(p => (p.id || p.Id) === this.currentProblemaId);
        if (currentIndex < this.problemas.length - 1) {
            const nextProblema = this.problemas[currentIndex + 1];
            this.cargarProblema(nextProblema.id || nextProblema.Id);
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
            const outputContent = document.getElementById('output-content');
            if (outputContent) {
                outputContent.textContent = "Por favor, espera a que se cargue el problema.";
                outputContent.classList.add('text-red-600');
            }
            return;
        }

        const outputContent = document.getElementById('output-content');
        if (outputContent) {
            outputContent.textContent = "Verificando solución...";
            outputContent.classList.remove('text-green-600', 'text-red-600');
        }

        const verifyBtn = document.getElementById('verify-btn');
        if (verifyBtn) {
            verifyBtn.disabled = true;
        }

        try {
            const codigo = window.monacoEditor?.getValue() || '';
            if (!codigo.trim()) {
                if (outputContent) {
                    outputContent.textContent = "Por favor, escribe algún código antes de verificar.";
                    outputContent.classList.add('text-red-600');
                }
                if (verifyBtn) verifyBtn.disabled = false;
                return;
            }

            console.log('🔄 Verificando solución:', { userId: this.userId, problemaId: this.currentProblemaId, codigoLength: codigo.length });
            
            const resultado = await window.curriculumManager.verificarSolucion(codigo, this.currentProblemaId);
            
            console.log('✅ Resultado verificación recibido:', resultado);

            if (outputContent) {
                // Handle different response formats
                const mensaje = resultado.mensaje || resultado.message || resultado.Mensaje || "Resultado desconocido";
                const isCorrect = resultado.correcto || resultado.IsCorrect || resultado.correct || false;

                outputContent.textContent = mensaje;

                if (isCorrect) {
                    outputContent.classList.add('text-green-600');
                    outputContent.classList.remove('text-red-600');

                    // Show success message with points
                    const puntos = resultado.puntosOtorgados || resultado.PuntosOtorgados || resultado.puntos_otorgados || 0;
                    if (puntos > 0) {
                        outputContent.textContent += ` (+${puntos} puntos)`;
                    }

                    // Reload progress and update UI after successful verification
                    setTimeout(async () => {
                        await this.loadUserProgress();
                        await this.renderSidebarTemas();
                        if (this.currentTemaId) {
                            await this.renderProblemsList();
                        }
                        if (verifyBtn) {
                            verifyBtn.disabled = false;
                        }
                    }, 1500);
                } else {
                    outputContent.classList.add('text-red-600');
                    outputContent.classList.remove('text-green-600');
                    if (verifyBtn) {
                        verifyBtn.disabled = false;
                    }
                }
            } else {
                if (verifyBtn) {
                    verifyBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('❌ Error verificando solución:', error);
            if (outputContent) {
                const errorMsg = error.message || 'Error desconocido al verificar la solución.';
                outputContent.textContent = `Error: ${errorMsg}`;
                outputContent.classList.add('text-red-600');
                outputContent.classList.remove('text-green-600');
            }
            if (verifyBtn) {
                verifyBtn.disabled = false;
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
