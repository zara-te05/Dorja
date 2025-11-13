// @ts-ignore
window.api = {
    baseUrl: 'https://api.example.com',

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
    }
};
