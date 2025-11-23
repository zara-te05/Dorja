async function initializeHomePage() {
    const userId = sessionStorage.getItem('userId');
    const usernameDisplay = document.getElementById('username-display');
    const userAvatar = document.querySelector('#user-menu-button img'); 

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = await window.api.getUserById(userId);

        if (user) {
            if (usernameDisplay) {
                usernameDisplay.textContent = user.username;
            }
            if (userAvatar) {
                const initial = user.username.charAt(0).toUpperCase();
                userAvatar.src = `https://via.placeholder.com/150/a0aec0/ffffff?text=${initial}`;
                userAvatar.alt = `Avatar de ${user.username}`;
            }
            
            // Load progress and lobby data
            await loadProgressData(userId, user);
            await loadUpcomingLevel(userId, user);
            await loadSyllabus();
        } else {
            sessionStorage.removeItem('userId');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
    }
}

async function loadProgressData(userId, user) {
    try {
        const totalPoints = user.puntosTotales || 0;
        const currentLevel = user.nivelActual || 1;
        
        document.getElementById('total-points').textContent = totalPoints;
        document.getElementById('current-level').textContent = currentLevel;
        
        // Calculate progress percentage (simplified - you can enhance this)
        const progressPercentage = Math.min((totalPoints % 1000) / 10, 100);
        document.getElementById('progress-bar').style.width = `${progressPercentage}%`;
        document.getElementById('progress-text').textContent = `${Math.round(progressPercentage)}% completado`;
    } catch (error) {
        console.error("Error loading progress:", error);
    }
}

async function loadUpcomingLevel(userId, user) {
    try {
        const niveles = await window.api.getAllNiveles();
        const currentLevel = user.nivelActual || 1;
        
        // Find next level
        const sortedNiveles = Array.isArray(niveles) ? niveles.sort((a, b) => (a.orden || 0) - (b.orden || 0)) : [];
        const nextLevel = sortedNiveles.find(n => (n.orden || n.IdNiveles || 0) > currentLevel) || sortedNiveles[0];
        
        const upcomingLevelDiv = document.getElementById('upcoming-level');
        
        if (nextLevel) {
            upcomingLevelDiv.innerHTML = `
                <div class="text-center">
                    <div class="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">${nextLevel.NombreNivel || `Nivel ${nextLevel.orden || nextLevel.IdNiveles || 'N/A'}`}</div>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">${nextLevel.DescripcionNivel || 'Sin descripción'}</p>
                    <div class="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
                        </svg>
                        <span>${nextLevel.puntosRequeridos || 0} puntos requeridos</span>
                    </div>
                </div>
            `;
        } else {
            upcomingLevelDiv.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500 dark:text-gray-400">¡Felicidades! Has completado todos los niveles.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error loading upcoming level:", error);
        document.getElementById('upcoming-level').innerHTML = `
            <div class="text-center py-8">
                <p class="text-red-500">Error al cargar el próximo nivel</p>
            </div>
        `;
    }
}

async function loadSyllabus() {
    try {
        const niveles = await window.api.getAllNiveles();
        const temas = await window.api.getAllTemas();
        
        const sortedNiveles = Array.isArray(niveles) ? niveles.sort((a, b) => (a.orden || 0) - (b.orden || 0)) : [];
        const sortedTemas = Array.isArray(temas) ? temas.sort((a, b) => (a.orden || 0) - (b.orden || 0)) : [];
        
        const syllabusContent = document.getElementById('syllabus-content');
        
        if (sortedNiveles.length === 0) {
            syllabusContent.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">No hay niveles disponibles</p>';
            return;
        }
        
        let html = '';
        for (const nivel of sortedNiveles) {
            const nivelTemas = sortedTemas.filter(t => t.IdNivel === nivel.IdNiveles || t.IdNivel === nivel.id);
            html += `
                <div class="border-l-4 border-indigo-600 dark:border-indigo-400 pl-4 mb-6">
                    <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        ${nivel.NombreNivel || `Nivel ${nivel.orden || nivel.IdNiveles || 'N/A'}`}
                    </h4>
                    <p class="text-gray-600 dark:text-gray-400 mb-3">${nivel.DescripcionNivel || 'Sin descripción'}</p>
                    ${nivelTemas.length > 0 ? `
                        <div class="ml-4 space-y-2">
                            ${nivelTemas.map(tema => `
                                <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span>${tema.Titulo || 'Tema sin título'}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-gray-500 dark:text-gray-400 text-sm ml-4">No hay temas disponibles</p>'}
                </div>
            `;
        }
        
        syllabusContent.innerHTML = html;
    } catch (error) {
        console.error("Error loading syllabus:", error);
        document.getElementById('syllabus-content').innerHTML = `
            <p class="text-red-500 text-center py-8">Error al cargar el sílabo</p>
        `;
    }
}

// Toggle syllabus visibility
document.addEventListener('DOMContentLoaded', () => {
    const viewSyllabusBtn = document.getElementById('view-syllabus-btn');
    const closeSyllabusBtn = document.getElementById('close-syllabus-btn');
    const syllabusSection = document.getElementById('syllabus-section');
    
    if (viewSyllabusBtn) {
        viewSyllabusBtn.addEventListener('click', () => {
            if (syllabusSection) {
                syllabusSection.classList.remove('hidden');
                syllabusSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    if (closeSyllabusBtn) {
        closeSyllabusBtn.addEventListener('click', () => {
            if (syllabusSection) {
                syllabusSection.classList.add('hidden');
            }
        });
    }
});

window.addEventListener('DOMContentLoaded', initializeHomePage);