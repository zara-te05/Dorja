window.api = {
    baseUrl: 'http://localhost:5222/api',

    // Helper method for making API calls
    async _makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
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

            return { success: true, data: result, ...result };
        } catch (error) {
            console.error(`Error en API ${endpoint}:`, error);
            return {
                success: false,
                message: error.message || 'Error de conexión con el servidor'
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
        // Backend now supports both username and email
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
        return result.data || result;
    },

    updateUserProfile: async (data) => {
        // First get the current user to merge data
        const currentUser = await window.api.getUserById(data.userId);
        if (!currentUser) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        const updateData = {
            id: data.userId,
            username: data.username || currentUser.username,
            email: data.email || currentUser.email,
            nombre: currentUser.nombre,
            apellidoPaterno: currentUser.apellidoPaterno,
            apellidoMaterno: currentUser.apellidoMaterno
        };

        return await window.api._makeRequest('/Users', {
            method: 'PUT',
            body: updateData
        });
    },


    deleteUserAccount: async (data) => {
        // First verify password by attempting login
        const user = await window.api.getUserById(data.userId);
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        // Verify password
        const loginResult = await window.api.login({
            username: user.email, // Use email for login verification
            password: data.password
        });

        if (!loginResult.success) {
            return { success: false, message: 'Contraseña incorrecta' };
        }

        // If password is correct, delete the account
        const result = await window.api._makeRequest(`/Users?id=${data.userId}`, {
            method: 'DELETE'
        });

        return result.success 
            ? { success: true, message: 'Cuenta eliminada exitosamente' }
            : { success: false, message: 'Error al eliminar la cuenta' };
    },

    saveImage: async (data) => {
        // Image saving functionality - this would need a backend endpoint
        // For now, store in localStorage as a workaround
        try {
            const key = `user_${data.userId}_${data.imageType}`;
            localStorage.setItem(key, data.dataUrl);
            return { success: true, message: 'Imagen guardada localmente' };
        } catch (error) {
            return { success: false, message: 'Error al guardar la imagen' };
        }
    },

    executePython: async (code) => {
        const result = await window.api._makeRequest('/Python/execute', {
            method: 'POST',
            body: { code: code }
        });
        
        return {
            success: result.success || false,
            output: result.output || result.message || 'Error desconocido'
        };
    },

    // Curriculum-related APIs
    cargarTemas: async (userId) => {
        const result = await window.api._makeRequest('/Temas');
        return result.data || [];
    },

    cargarProblemas: async (userId, temaId) => {
        // Get all problems and filter by temaId, or use a specific endpoint if available
        const result = await window.api._makeRequest('/Problemas');
        if (result.data && Array.isArray(result.data)) {
            // Filter by temaId if the backend doesn't have a specific endpoint
            return result.data.filter(p => p.temaId === temaId || p.tema_id === temaId);
        }
        return [];
    },

    obtenerProblema: async (problemaId) => {
        const result = await window.api._makeRequest(`/Problemas/${problemaId}`);
        return result.data || result;
    },

    verificarSolucion: async (userId, codigo, problemaId) => {
        // This would need a backend endpoint for solution verification
        // For now, return a placeholder
        return {
            correcto: false,
            mensaje: 'Verificación de solución requiere implementación en el backend'
        };
    },

    marcarProblemaCompletado: async (userId, problemaId, codigo) => {
        // This would need a backend endpoint for marking problems as completed
        // For now, return a placeholder
        return {
            success: false,
            message: 'Marcar problema como completado requiere implementación en el backend'
        };
    }
};