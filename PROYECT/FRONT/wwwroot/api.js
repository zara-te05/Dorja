// @ts-ignore
window.api = {
     baseUrl: 'https://localhost:5222/api/Users',

    signup: async (data) => {
        try {
            // @ts-ignore
            const response = await fetch(`${window.api.baseUrl}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.message || 'Error en la solicitud de registro.');
            }

            return { success: true, data: result.message || "Usuario creado correctamente" };
        } catch (error) {
            console.error('Error en signup API:', error);
            return { success: false, message: error.message };
        }
    },

    // Login 
    login: async (data) => {
    
        try{

            //@ts-ignore
            const response = await fetch(`${window.api.baseUrl}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
            
                throw new Error(result.message || 'Credenciales incorrectas');
            }

            return { success: true, data: result };


        } catch(error){
            console.error('Error en login API:', error);
            return { success: false, message: error.message };
        }
    }
};
