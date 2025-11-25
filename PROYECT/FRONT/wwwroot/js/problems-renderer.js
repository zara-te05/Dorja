// js/problems-renderer.js
// Cargar funciones de achievements.js
if (typeof showAchievementPopup === 'undefined') {
    // Si achievements.js no está cargado, definir un marcador de posición
    window.showAchievementPopup = async function(nombre, descripcion, icono) {
        console.log('Achievement unlocked:', nombre);
    };
}

class ProblemsRenderer {
    constructor() {
        this.currentTemaId = null;
        this.currentProblemaId = null;
        this.problemas = [];
        this.userId = null;
        this.currentNivelId = null;
    }

    async init(userId, nivelId = null) {
        console.log('🔄 Inicializando ProblemsRenderer con userId:', userId, nivelId ? `y nivel ${nivelId}` : '');
        this.userId = userId;
        this.currentNivelId = nivelId;
        
        try {
            await window.curriculumManager.init(userId);
            console.log('✅ CurriculumManager inicializado');
            
            // Si no se especificó nivelId, obtener el nivel actual del usuario
            if (!this.currentNivelId) {
                const user = await window.api.getUserById(userId);
                this.currentNivelId = user?.nivelActual || user?.nivel_actual || 1;
                console.log('📊 Nivel actual del usuario:', this.currentNivelId);
            }
            
            await this.renderSidebarTemas();
            console.log('✅ Sidebar de temas renderizado');
        } catch (error) {
            console.error('❌ Error en init:', error);
        }
    }

    async renderSidebarTemas() {
        try {
            console.log('🔄 Cargando temas para nivel:', this.currentNivelId);
            const temas = await window.curriculumManager.cargarTemas(this.currentNivelId);
            console.log('📚 Temas cargados:', temas);
            
            const sidebar = document.getElementById('topics-sidebar');
            console.log('📍 Elemento sidebar encontrado:', !!sidebar);
            
            if (!sidebar) {
                console.error('❌ No se encontró el elemento topics-sidebar');
                return;
            }
            
            // Asegurar que el sidebar sea visible
            sidebar.style.display = 'block';
            sidebar.style.visibility = 'visible';
            sidebar.style.opacity = '1';
            
            // Actualizar texto de progreso con el nivel
            const progressText = document.getElementById('progress-text');
            if (progressText) {
                progressText.textContent = `Nivel ${this.currentNivelId || 1}`;
            }
            
            if (!temas || temas.length === 0) {
                console.log('⚠ No hay temas disponibles para el nivel:', this.currentNivelId);
                sidebar.innerHTML = `<div class="text-gray-500 dark:text-slate-400 text-sm p-4 text-center">No hay temas disponibles para este nivel</div>`;
                return;
            }
            
            const temasHTML = temas.map(tema => {
                const temaId = tema.id || tema.IdTemas || tema.Id;
                const locked = tema.locked === 1 || tema.locked === true || tema.Locked === true;
                const totalProblemas = tema.total_problemas || tema.TotalProblemas || 0;
                const problemasCompletados = tema.problemas_completados || tema.ProblemasCompletados || 0;
                
                return `
                    <div class="tema p-3 mb-2 rounded ${locked ? 'locked' : ''}" 
                         data-tema-id="${temaId}" 
                         onclick="window.problemsRenderer.seleccionarTema(${temaId})">
                        <h4 class="font-medium text-gray-800 dark:text-white text-sm">${tema.titulo || tema.Titulo}</h4>
                        <div class="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                            <div class="progress-bar bg-indigo-600 h-2 rounded-full" 
                                 style="width: ${totalProblemas > 0 ? (problemasCompletados / totalProblemas) * 100 : 0}%">
                            </div>
                        </div>
                        <div class="flex justify-between text-xs mt-1">
                            <span class="text-gray-600 dark:text-slate-400">
                                ${problemasCompletados}/${totalProblemas}
                            </span>
                            <span>${locked ? '🔒' : '🔓'}</span>
                        </div>
                    </div>
                `;
            }).join('');

            sidebar.innerHTML = temasHTML;
            console.log('✅ HTML de temas generado y renderizado. Total temas:', temas.length);

            // Seleccionar el primer tema no bloqueado por defecto
            const primerTemaNoBloqueado = temas.find(t => {
                const locked = t.locked === 1 || t.locked === true || t.Locked === true;
                return !locked;
            });
            if (primerTemaNoBloqueado) {
                const temaId = primerTemaNoBloqueado.id || primerTemaNoBloqueado.IdTemas || primerTemaNoBloqueado.Id;
                console.log('🎯 Seleccionando primer tema no bloqueado:', temaId);
                await this.seleccionarTema(temaId);
            } else {
                console.log('⚠ No hay temas desbloqueados disponibles');
            }
        } catch (error) {
            console.error('❌ Error cargando temas:', error);
            document.getElementById('topics-sidebar').innerHTML = '<div class="text-red-500">Error cargando temas</div>';
        }
    }

    async seleccionarTema(temaId) {
        console.log('🎯 Seleccionando tema:', temaId);
        const temaElement = document.querySelector(`[data-tema-id="${temaId}"]`);
        if (!temaElement) {
            console.log('⚠ Tema no encontrado');
            return;
        }
        
        if (temaElement.classList.contains('locked')) {
            console.log('⚠ Tema bloqueado');
            return;
        }

        this.currentTemaId = temaId;
        await this.cargarProblemasTema(temaId);
        
        // Actualizar interfaz de usuario
        document.querySelectorAll('.tema').forEach(t => t.classList.remove('active'));
        temaElement.classList.add('active');
        console.log('✅ Tema marcado como activo');
    }

    async cargarProblemasTema(temaId) {
        try {
            console.log('🔄 Cargando problemas para tema:', temaId);
            this.problemas = await window.curriculumManager.cargarProblemas(temaId);
            console.log('📝 Problemas cargados:', this.problemas);
            this.renderListaProblemas();
            
            // Cargar el primer problema no bloqueado
            const primerProblema = this.problemas.find(p => {
                const locked = p.locked === 1 || p.locked === true || p.Locked === true;
                return !locked;
            });
            if (primerProblema) {
                const problemaId = primerProblema.id || primerProblema.Id || primerProblema.IdProblema;
                console.log('🎯 Cargando primer problema no bloqueado:', problemaId);
                await this.cargarProblema(problemaId);
            } else if (this.problemas.length > 0) {
                console.log('⚠ Todos los problemas están bloqueados');
                document.getElementById('problem-title').textContent = "Problema Bloqueado";
                document.getElementById('problem-description').innerHTML = 
                    "<p>Completa los problemas anteriores para desbloquear este.</p>";
            } else {
                console.log('⚠ No hay problemas en este tema');
            }
        } catch (error) {
            console.error('❌ Error cargando problemas:', error);
        }
    }

    renderListaProblemas() {
        const lista = document.getElementById('problems-list');
        console.log('📍 Elemento problems-list encontrado:', !!lista);
        
        if (!this.problemas || this.problemas.length === 0) {
            console.log('⚠ No hay problemas para mostrar');
            lista.innerHTML = '<div class="text-gray-500 dark:text-slate-400 text-sm p-4">No hay problemas en este tema</div>';
            return;
        }

        const temaElement = document.querySelector(`[data-tema-id="${this.currentTemaId}"] h4`);
        const temaNombre = temaElement ? temaElement.textContent : "Tema";
        
        document.getElementById('problems-title').textContent = `Problemas - ${temaNombre}`;
        document.getElementById('problems-count').textContent = `${this.problemas.length} problemas`;
        
        const currentProblemaId = this.currentProblemaId;
        lista.innerHTML = this.problemas.map(problema => {
            const problemaId = problema.id || problema.Id || problema.IdProblema;
            const locked = problema.locked === 1 || problema.locked === true || problema.Locked === true;
            const resuelto = problema.resuelto === true || problema.Resuelto === true;
            const orden = problema.orden || problema.Orden || 0;
            const titulo = problema.titulo || problema.Titulo || 'Sin título';
            const dificultad = problema.dificultad || problema.Dificultad || 'Media';
            const puntos = problema.puntos_otorgados || problema.PuntosOtorgados || 0;
            
            return `
                <div class="problema-item mb-1 text-sm p-2 rounded ${locked ? 'locked' : ''} ${resuelto ? 'completed' : ''} ${problemaId === currentProblemaId ? 'active' : ''}"
                     onclick="window.problemsRenderer.cargarProblema(${problemaId})">
                    <div class="flex justify-between items-center">
                        <span class="truncate">${orden}. ${titulo}</span>
                        ${resuelto ? '<span class="text-green-500">✓</span>' : ''}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        ${dificultad} • ${puntos} pts
                    </div>
                </div>
            `;
        }).join('');

        console.log('✅ Lista de problemas renderizada');
    }

    async cargarProblema(problemaId) {
        try {
            console.log('🔄 Cargando problema:', problemaId);
            const problema = await window.curriculumManager.obtenerProblema(problemaId);
            console.log('📄 Problema obtenido:', problema);
            
            if (!problema || problema.locked) {
                console.log('⚠ Problema bloqueado o no encontrado');
                document.getElementById('problem-title').textContent = "Problema Bloqueado";
                document.getElementById('problem-description').innerHTML = 
                    "<p>Completa los problemas anteriores para desbloquear este.</p>";
                return;
            }

            this.currentProblemaId = problemaId;
            
            // Actualizar interfaz de usuario
            document.getElementById('problem-title').textContent = problema.titulo;
            document.getElementById('problem-description').innerHTML = `
                <p>${problema.descripcion}</p>
                ${problema.ejemplo ? `<p class="mt-4"><strong>Ejemplo:</strong> <code class="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">${problema.ejemplo}</code></p>` : ''}
                <div class="mt-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <strong>Dificultad:</strong> ${problema.dificultad} • 
                    <strong>Puntos:</strong> ${problema.puntos_otorgados}
                </div>
            `;

            // Habilitar botones
            document.getElementById('run-btn').disabled = false;
            document.getElementById('verify-btn').disabled = false;

            console.log('✅ Interfaz del problema actualizada');

            // Cargar código en el editor
            if (window.monacoEditor) {
                const ultimoCodigo = problema.ultimo_codigo || problema.codigo_inicial;
                window.monacoEditor.setValue(ultimoCodigo);
                console.log('✅ Código cargado en editor');
            } else {
                console.log('⚠ Editor Monaco no está disponible');
            }

            // Actualizar la navegación
            this.actualizarNavegacion();
            this.renderListaProblemas();
        } catch (error) {
            console.error('❌ Error cargando problema:', error);
        }
    }

    actualizarNavegacion() {
        if (!this.problemas || this.problemas.length === 0) return;
        
        const currentIndex = this.problemas.findIndex(p => {
            const problemaId = p.id || p.Id || p.IdProblema;
            return problemaId === this.currentProblemaId;
        });
        const prevBtn = document.getElementById('prev-problem-btn');
        const nextBtn = document.getElementById('next-problem-btn');
        
        if (prevBtn) prevBtn.disabled = currentIndex <= 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= this.problemas.length - 1;
        
        const counterEl = document.getElementById('problem-counter');
        if (counterEl) {
            counterEl.textContent = `${currentIndex >= 0 ? currentIndex + 1 : 0}/${this.problemas.length}`;
        }
            
        console.log('✅ Navegación actualizada');
    }

    async verificarSolucion() {
        if (!this.currentProblemaId) return;
        
        const codigo = window.monacoEditor.getValue();
        const resultado = await window.curriculumManager.verificarSolucion(codigo, this.currentProblemaId);
        
        document.getElementById('output-content').textContent = resultado.mensaje;
        
        if (resultado.correcto) {
            document.getElementById('output-content').classList.add('text-green-600');
            document.getElementById('output-content').classList.remove('text-red-600');
            await this.cargarProblemasTema(this.currentTemaId);
        } else {
            document.getElementById('output-content').classList.add('text-red-600');
            document.getElementById('output-content').classList.remove('text-green-600');
        }
    }

    async ejecutarCodigo() {
        if (!this.currentProblemaId) {
            document.getElementById('output-content').textContent = "Por favor, selecciona un problema primero.";
            return;
        }

        const outputContent = document.getElementById('output-content');
        outputContent.textContent = "Ejecutando código...";
        outputContent.classList.remove('text-green-600', 'text-red-600');
        
        try {
            const codigo = window.monacoEditor?.getValue() || '';
            const language = window.currentLanguage || document.getElementById('language-selector')?.value || 'python';
            const userId = sessionStorage.getItem('userId') ? parseInt(sessionStorage.getItem('userId')) : null;
            
            if (!codigo.trim()) {
                outputContent.textContent = "Por favor, escribe algún código antes de ejecutar.";
                return;
            }

            const resultado = await window.api.executeCode(codigo, language, userId);
            
            if (resultado.success) {
                outputContent.textContent = resultado.output || 'Código ejecutado correctamente.';
                outputContent.classList.add('text-green-600');
                outputContent.classList.remove('text-red-600');
                
                // Mostrar popup de logro si se otorgó
                if (resultado.achievementGranted) {
                    await showAchievementPopup('Tu primer código', 'Has ejecutado tu primer código. ¡El inicio de una gran aventura!', 'fa-code');
                }
            } else {
                outputContent.textContent = resultado.output || resultado.message || 'Error al ejecutar el código.';
                outputContent.classList.add('text-red-600');
                outputContent.classList.remove('text-green-600');
            }
        } catch (error) {
            console.error('Error ejecutando código:', error);
            outputContent.textContent = `Error: ${error.message || 'Error desconocido al ejecutar el código.'}`;
            outputContent.classList.add('text-red-600');
            outputContent.classList.remove('text-green-600');
        }
    }

    cargarProblemaAnterior() {
        if (!this.problemas || this.problemas.length === 0) return;
        const currentIndex = this.problemas.findIndex(p => {
            const problemaId = p.id || p.Id || p.IdProblema;
            return problemaId === this.currentProblemaId;
        });
        if (currentIndex > 0) {
            const problemaAnterior = this.problemas[currentIndex - 1];
            const problemaId = problemaAnterior.id || problemaAnterior.Id || problemaAnterior.IdProblema;
            this.cargarProblema(problemaId);
        }
    }

    cargarProblemaSiguiente() {
        if (!this.problemas || this.problemas.length === 0) return;
        const currentIndex = this.problemas.findIndex(p => {
            const problemaId = p.id || p.Id || p.IdProblema;
            return problemaId === this.currentProblemaId;
        });
        if (currentIndex < this.problemas.length - 1) {
            const problemaSiguiente = this.problemas[currentIndex + 1];
            const problemaId = problemaSiguiente.id || problemaSiguiente.Id || problemaSiguiente.IdProblema;
            this.cargarProblema(problemaId);
        }
    }
}

// Crear instancia global
window.problemsRenderer = new ProblemsRenderer();