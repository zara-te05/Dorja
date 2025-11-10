// js/problems-renderer.js
class ProblemsRenderer {
    constructor() {
        this.currentTemaId = null;
        this.currentProblemaId = null;
        this.problemas = [];
        this.userId = null;
    }

    async init(userId) {
        console.log('🔄 Inicializando ProblemsRenderer con userId:', userId);
        this.userId = userId;
        
        try {
            await curriculumManager.init(userId);
            console.log('✅ CurriculumManager inicializado');
            await this.renderSidebarTemas();
            console.log('✅ Sidebar de temas renderizado');
        } catch (error) {
            console.error('❌ Error en init:', error);
        }
    }

    async renderSidebarTemas() {
        try {
            console.log('🔄 Cargando temas...');
            const temas = await curriculumManager.cargarTemas();
            console.log('📚 Temas cargados:', temas);
            
            const sidebar = document.getElementById('topics-sidebar');
            console.log('📍 Elemento sidebar encontrado:', !!sidebar);
            
            if (!temas || temas.length === 0) {
                console.log('⚠ No hay temas disponibles');
                sidebar.innerHTML = '<div class="text-gray-500 dark:text-slate-400">No hay temas disponibles</div>';
                return;
            }
            
            sidebar.innerHTML = temas.map(tema => `
                <div class="tema p-3 mb-2 rounded ${tema.locked ? 'locked' : ''}" 
                     data-tema-id="${tema.id}" 
                     onclick="problemsRenderer.seleccionarTema(${tema.id})">
                    <h4 class="font-medium text-gray-800 dark:text-white text-sm">${tema.titulo}</h4>
                    <div class="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                        <div class="progress-bar bg-indigo-600 h-2 rounded-full" 
                             style="width: ${tema.total_problemas > 0 ? (tema.problemas_completados / tema.total_problemas) * 100 : 0}%">
                        </div>
                    </div>
                    <div class="flex justify-between text-xs mt-1">
                        <span class="text-gray-600 dark:text-slate-400">
                            ${tema.problemas_completados}/${tema.total_problemas}
                        </span>
                        <span>${tema.locked ? '🔒' : '🔓'}</span>
                    </div>
                </div>
            `).join('');

            console.log('✅ HTML de temas generado');

            // Seleccionar el primer tema no bloqueado por defecto
            const primerTemaNoBloqueado = temas.find(t => !t.locked);
            if (primerTemaNoBloqueado) {
                console.log('🎯 Seleccionando primer tema no bloqueado:', primerTemaNoBloqueado.id);
                await this.seleccionarTema(primerTemaNoBloqueado.id);
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
        if (!temaElement || temaElement.classList.contains('locked')) {
            console.log('⚠ Tema bloqueado o no encontrado');
            return;
        }

        this.currentTemaId = temaId;
        await this.cargarProblemasTema(temaId);
        
        // Actualizar UI
        document.querySelectorAll('.tema').forEach(t => t.classList.remove('active'));
        temaElement.classList.add('active');
        console.log('✅ Tema marcado como activo');
    }

    async cargarProblemasTema(temaId) {
        try {
            console.log('🔄 Cargando problemas para tema:', temaId);
            this.problemas = await curriculumManager.cargarProblemas(temaId);
            console.log('📝 Problemas cargados:', this.problemas);
            this.renderListaProblemas();
            
            // Cargar el primer problema no bloqueado
            const primerProblema = this.problemas.find(p => !p.locked);
            if (primerProblema) {
                console.log('🎯 Cargando primer problema no bloqueado:', primerProblema.id);
                await this.cargarProblema(primerProblema.id);
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
        
        lista.innerHTML = this.problemas.map(problema => `
            <div class="problema-item mb-1 text-sm ${problema.locked ? 'locked' : ''} ${problema.resuelto ? 'completed' : ''} ${problema.id === this.currentProblemaId ? 'active' : ''}"
                 onclick="problemsRenderer.cargarProblema(${problema.id})">
                <div class="flex justify-between items-center">
                    <span class="truncate">${problema.orden}. ${problema.titulo}</span>
                    ${problema.resuelto ? '<span class="text-green-500">✓</span>' : ''}
                </div>
                <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    ${problema.dificultad} • ${problema.puntos_otorgados} pts
                </div>
            </div>
        `).join('');

        console.log('✅ Lista de problemas renderizada');
    }

    async cargarProblema(problemaId) {
        try {
            console.log('🔄 Cargando problema:', problemaId);
            const problema = await curriculumManager.obtenerProblema(problemaId);
            console.log('📄 Problema obtenido:', problema);
            
            if (!problema || problema.locked) {
                console.log('⚠ Problema bloqueado o no encontrado');
                document.getElementById('problem-title').textContent = "Problema Bloqueado";
                document.getElementById('problem-description').innerHTML = 
                    "<p>Completa los problemas anteriores para desbloquear este.</p>";
                return;
            }

            this.currentProblemaId = problemaId;
            
            // Actualizar UI
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

            // Cargar código en editor
            if (window.monacoEditor) {
                const ultimoCodigo = problema.ultimo_codigo || problema.codigo_inicial;
                window.monacoEditor.setValue(ultimoCodigo);
                console.log('✅ Código cargado en editor');
            } else {
                console.log('⚠ Editor Monaco no está disponible');
            }

            // Actualizar navegación
            this.actualizarNavegacion();
            this.renderListaProblemas();
        } catch (error) {
            console.error('❌ Error cargando problema:', error);
        }
    }

    actualizarNavegacion() {
        if (!this.problemas || this.problemas.length === 0) return;
        
        const currentIndex = this.problemas.findIndex(p => p.id === this.currentProblemaId);
        const prevBtn = document.getElementById('prev-problem-btn');
        const nextBtn = document.getElementById('next-problem-btn');
        
        prevBtn.disabled = currentIndex <= 0;
        nextBtn.disabled = currentIndex >= this.problemas.length - 1;
        
        document.getElementById('problem-counter').textContent = 
            `${currentIndex + 1}/${this.problemas.length}`;
            
        console.log('✅ Navegación actualizada');
    }

    async verificarSolucion() {
        if (!this.currentProblemaId) return;
        
        const codigo = window.monacoEditor.getValue();
        const resultado = await curriculumManager.verificarSolucion(codigo, this.currentProblemaId);
        
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
        document.getElementById('output-content').textContent = "Ejecutando código...";
        // Aquí iría la lógica real de ejecución
    }

    cargarProblemaAnterior() {
        if (!this.problemas || this.problemas.length === 0) return;
        const currentIndex = this.problemas.findIndex(p => p.id === this.currentProblemaId);
        if (currentIndex > 0) {
            this.cargarProblema(this.problemas[currentIndex - 1].id);
        }
    }

    cargarProblemaSiguiente() {
        if (!this.problemas || this.problemas.length === 0) return;
        const currentIndex = this.problemas.findIndex(p => p.id === this.currentProblemaId);
        if (currentIndex < this.problemas.length - 1) {
            this.cargarProblema(this.problemas[currentIndex + 1].id);
        }
    }
}

// Crear instancia global
window.problemsRenderer = new ProblemsRenderer();