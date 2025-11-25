// Asegurar que window.api solo se defina una vez
if (typeof window.api === 'undefined') {
// Verificar si estamos en Electron o navegador web
const isElectron = typeof window !== 'undefined' && (window.electronAPI || (window.process && window.process.type));

window.api = {
    baseUrl: 'http://localhost:5222/api',

    // Método auxiliar para realizar llamadas a la API
    async _makeRequest(endpoint, options = {}) {
        try {
            // Asegurar que estamos usando HTTP, no HTTPS
            let url = `${this.baseUrl}${endpoint}`;
            // Forzar protocolo HTTP si de alguna manera HTTPS se coló
            if (url.startsWith('https://')) {
                url = url.replace('https://', 'http://');
            }
            // Asegurar que comience con http://
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `http://${url}`;
            }

            console.log('Making API request to:', url);

            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(result?.message || `Error ${response.status}: ${response.statusText}`);
            }

            // Manejar diferentes tipos de respuesta
            if (Array.isArray(result)) {
                return { success: true, data: result };
            } else if (result && typeof result === 'object') {
                return { success: true, data: result, ...result };
            } else {
                return { success: true, data: result };
            }
        } catch (error) {
            console.error(`Error en API ${endpoint}:`, error);
            let errorMessage = error.message || 'Error de conexión con el servidor';
            
            // Proporcionar mensajes de error más útiles
            if (error.message && error.message.includes('SSL') || error.message.includes('HTTPS')) {
                errorMessage = 'Error: El servidor está configurado para HTTP, no HTTPS. Verifica que el backend esté ejecutándose en http://localhost:5222';
            } else if (error.message && error.message.includes('Failed to fetch')) {
                errorMessage = 'Error: No se pudo conectar con el servidor. Asegúrate de que el backend esté ejecutándose en http://localhost:5222';
            }
            
            return {
                success: false,
                message: errorMessage
            };
        }
    },

    signup: async (data) => {
        return await window.api._makeRequest('/Users/signup', {
            method: 'POST',
            body: data
        });
    },

    login: async (data) => {
        // El backend ahora soporta tanto nombre de usuario como email
        const loginData = {
            username: data.username,
            password: data.password
        };
        const result = await window.api._makeRequest('/Users/login', {
            method: 'POST',
            body: loginData
        });
        
        if (result.success && result.user) {
            return {
                success: true,
                user: result.user
            };
        }
        return result;
    },

    getUserById: async (userId) => {
        const result = await window.api._makeRequest(`/Users/${userId}`);
        const user = result.data || result;
        console.log('getUserById response:', user); // Registro de depuración
        console.log('ProfilePhotoPath in response:', user?.profilePhotoPath); // Registro de depuración
        console.log('CoverPhotoPath in response:', user?.coverPhotoPath); // Registro de depuración
        return user;
    },

    updateUserProfile: async (data) => {
        // Primero obtener el usuario actual para fusionar datos y preservar rutas de fotos
        const currentUser = await window.api.getUserById(data.userId);
        if (!currentUser) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        const updateData = {
            id: data.userId,
            username: data.username || currentUser.username,
            email: data.email || currentUser.email,
            nombre: currentUser.nombre || '',
            apellidoPaterno: currentUser.apellidoPaterno || '',
            apellidoMaterno: currentUser.apellidoMaterno || '',
            password: currentUser.password || '', // Preservar contraseña
            fechaRegistro: currentUser.fechaRegistro || new Date().toISOString(),
            ultimaConexion: currentUser.ultimaConexion || null,
            puntosTotales: currentUser.puntosTotales || 0,
            nivelActual: currentUser.nivelActual || 1,
            // CRÍTICO: Preservar rutas de fotos desde la base de datos, no desde el objeto currentUser obsoleto
            profilePhotoPath: currentUser.profilePhotoPath || '',
            coverPhotoPath: currentUser.coverPhotoPath || ''
        };

        return await window.api._makeRequest('/Users', {
            method: 'PUT',
            body: updateData
        });
    },


    deleteUserAccount: async (data) => {
        // Primero verificar contraseña intentando iniciar sesión
        const user = await window.api.getUserById(data.userId);
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        // Verificar contraseña
        const loginResult = await window.api.login({
            username: user.email, // Usar email para verificación de inicio de sesión
            password: data.password
        });

        if (!loginResult.success) {
            return { success: false, message: 'Contraseña incorrecta' };
        }

        // Si la contraseña es correcta, eliminar la cuenta
        const result = await window.api._makeRequest(`/Users?id=${data.userId}`, {
            method: 'DELETE'
        });

        return result.success 
            ? { success: true, message: 'Cuenta eliminada exitosamente' }
            : { success: false, message: 'Error al eliminar la cuenta' };
    },

    saveImage: async (data) => {
        try {
            // Convertir data URL a blob
            const response = await fetch(data.dataUrl);
            const blob = await response.blob();
            
            // Crear FormData
            const formData = new FormData();
            formData.append('file', blob, `image.${blob.type.split('/')[1]}`);
            formData.append('imageType', data.imageType);

            // Usar window.api.baseUrl en lugar de this.baseUrl
            const baseUrl = window.api.baseUrl || 'http://localhost:5222/api';
            const uploadUrl = `${baseUrl}/Users/${data.userId}/upload-image`;
            
            console.log('Uploading image to:', uploadUrl); // Registro de depuración

            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            const result = await uploadResponse.json().catch(() => null);

            if (!uploadResponse.ok) {
                throw new Error(result?.message || `Error ${uploadResponse.status}: ${uploadResponse.statusText}`);
            }

            console.log('Image upload successful:', result); // Registro de depuración
            return { success: true, message: result.message || 'Imagen guardada exitosamente', path: result.path };
        } catch (error) {
            console.error('Error al guardar la imagen:', error);
            return { success: false, message: error.message || 'Error al guardar la imagen' };
        }
    },

    // Guardar imagen como BLOB en la base de datos
    saveImageAsBlob: async (data) => {
        try {
            // Convertir data URL a blob
            const response = await fetch(data.dataUrl);
            const blob = await response.blob();
            
            // Crear FormData
            const formData = new FormData();
            formData.append('file', blob, `image.${blob.type.split('/')[1]}`);
            formData.append('imageType', data.imageType);

            const baseUrl = window.api.baseUrl || 'http://localhost:5222/api';
            const uploadUrl = `${baseUrl}/Users/${data.userId}/upload-image-blob`;
            
            console.log('Uploading image as BLOB to:', uploadUrl);

            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            const result = await uploadResponse.json().catch(() => null);

            if (!uploadResponse.ok) {
                throw new Error(result?.message || `Error ${uploadResponse.status}: ${uploadResponse.statusText}`);
            }

            console.log('Image BLOB upload successful:', result);
            return { success: true, message: result.message || 'Imagen guardada exitosamente en la base de datos', storageType: 'blob' };
        } catch (error) {
            console.error('Error al guardar la imagen como BLOB:', error);
            return { success: false, message: error.message || 'Error al guardar la imagen' };
        }
    },

    // Obtener imagen desde BLOB en la base de datos
    getImageBlob: async (userId, imageType) => {
        try {
            const baseUrl = window.api.baseUrl || 'http://localhost:5222/api';
            const imageUrl = `${baseUrl}/Users/${userId}/image-blob?imageType=${imageType}`;
            
            const response = await fetch(imageUrl);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Imagen no encontrada
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Devolver la URL del blob
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error al recuperar la imagen desde BLOB:', error);
            return null;
        }
    },

    executePython: async (code) => {
        // Método heredado - redirige a executeCode
        return await window.api.executeCode(code, 'python');
    },

    executeCode: async (code, language = 'python', userId = null) => {
        const body = { code: code, language: language };
        if (userId) {
            body.userId = userId;
        }
        const result = await window.api._makeRequest('/Python/execute', {
            method: 'POST',
            body: body
        });
        
        return {
            success: result.success || false,
            output: result.output || result.message || 'Error desconocido',
            achievementGranted: result.achievementGranted || false
        };
    },

    // APIs relacionadas con el currículum
    cargarTemas: async (userId, nivelId = null) => {
        const result = await window.api._makeRequest('/Temas');
        let temas = [];
        
        // La API devuelve datos directamente, no envueltos en una propiedad data
        if (Array.isArray(result)) {
            temas = result;
        } else {
            temas = result.data || result || [];
        }
        
        // Filtrar por nivel si se especifica
        if (nivelId !== null && nivelId !== undefined) {
            temas = temas.filter(t => 
                t.IdNivel === nivelId || 
                t.idNivel === nivelId || 
                t.nivel_id === nivelId ||
                t.nivelId === nivelId
            );
        }
        
        return temas;
    },

    cargarProblemas: async (userId, temaId) => {
        // Obtener todos los problemas y filtrar por temaId, o usar un endpoint específico si está disponible
        const result = await window.api._makeRequest('/Problemas');
        let problems = [];
        
        // Manejar diferentes formatos de respuesta
        if (Array.isArray(result)) {
            problems = result;
        } else if (result.data && Array.isArray(result.data)) {
            problems = result.data;
        } else if (result.success && Array.isArray(result.data)) {
            problems = result.data;
        }
        
        // Filtrar por temaId si el backend no tiene un endpoint específico
        if (problems.length > 0) {
            return problems.filter(p => p.temaId === temaId || p.tema_id === temaId || p.TemaId === temaId);
        }
        return [];
    },

    obtenerProblema: async (problemaId) => {
        const result = await window.api._makeRequest(`/Problemas/${problemaId}`);
        // Manejar diferentes formatos de respuesta
        if (result && typeof result === 'object' && !result.success) {
            return result;
        }
        return result.data || result || null;
    },

    verificarSolucion: async (userId, codigo, problemaId) => {
        // Esto necesitaría un endpoint del backend para verificación de solución
        // Por ahora, devolver un marcador de posición
        return {
            correcto: false,
            mensaje: 'Verificación de solución requiere implementación en el backend'
        };
    },

    marcarProblemaCompletado: async (userId, problemaId, codigo) => {
        // Esto necesitaría un endpoint del backend para marcar problemas como completados
        // Por ahora, devolver un marcador de posición
        return {
            success: false,
            message: 'Marcar problema como completado requiere implementación en el backend'
        };
    },

    // APIs de progreso y currículum
    getAllNiveles: async () => {
        const result = await window.api._makeRequest('/Niveles');
        return result.data || result;
    },

    getAllTemas: async () => {
        const result = await window.api._makeRequest('/Temas');
        return result.data || result;
    },

    getProgresoByUserId: async (userId) => {
        const result = await window.api._makeRequest(`/Progreso_Problema?userId=${userId}`);
        return result.data || result;
    },

    // APIs de Logros/Logros
    getAllLogros: async () => {
        const result = await window.api._makeRequest('/Logros');
        return result.data || result;
    },

    getLogrosByUserId: async (userId) => {
        const result = await window.api._makeRequest(`/Logros_Usuario/user/${userId}`);
        return result.data || result;
    },

    getLogroByNombre: async (nombre) => {
        const result = await window.api._makeRequest(`/Logros/by-name/${encodeURIComponent(nombre)}`);
        return result.data || result;
    },

    grantLogro: async (userId, logroId) => {
        const result = await window.api._makeRequest('/Logros_Usuario/grant', {
            method: 'POST',
            body: { UserId: userId, LogroId: logroId }
        });
        return result;
    }
};
} // Fin de la verificación de definición de window.api