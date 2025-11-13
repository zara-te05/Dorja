document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const googleLoginBtn = document.getElementById('google-login-btn');
    
    // Referencias al contenedor de error
    const errorContainer = document.getElementById('error-container');
    const errorMessageElement = document.getElementById('error-message');

    // Función para mostrar errores
    const displayError = (message) => {
        if (errorMessageElement && errorContainer) {
            errorMessageElement.textContent = message;
            errorContainer.classList.remove('opacity-0');
        } else {
            // Fallback si no existe el contenedor de errores
            alert(message);
        }
    };

    // Función para ocultar errores
    const hideError = () => {
        if (errorContainer) {
            errorContainer.classList.add('opacity-0');
        }
    };

    // Función para deshabilitar/habilitar formulario
    const setFormState = (disabled, buttonText = null) => {
        const inputs = loginForm?.querySelectorAll('input');
        const submitButton = loginForm?.querySelector('button[type="submit"]');
        
        if (inputs) {
            inputs.forEach(input => input.disabled = disabled);
        }
        
        if (submitButton) {
            submitButton.disabled = disabled;
            if (buttonText) {
                submitButton.textContent = buttonText;
            }
        }
    };

    // Manejo del login con Google
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                // Mostrar estado de carga
                googleLoginBtn.disabled = true;
                const originalText = googleLoginBtn.textContent;
                googleLoginBtn.textContent = 'Conectando con Google...';
                hideError();

                const result = await window.api.googleLogin();
                if (result.success) {
                    sessionStorage.setItem('userId', result.user.id);
                    window.location.href = 'home.html';
                } else {
                    displayError(result.message || 'Error al iniciar sesión con Google.');
                }
            } catch (error) {
                console.error("Error en login con Google:", error);
                displayError(error.message || 'Error al iniciar sesión con Google.');
            } finally {
                // Restaurar estado del botón
                googleLoginBtn.disabled = false;
                googleLoginBtn.textContent = originalText || 'Continuar con Google';
            }
        });
    }

    // Manejo del formulario de login tradicional
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            // Ocultar errores anteriores
            hideError();

            // --- VALIDACIÓN MANUAL ---
            if (!usernameInput?.value.trim()) {
                displayError('Por favor, ingresa tu nombre de usuario.');
                usernameInput?.focus();
                return; 
            }
            
            if (!passwordInput?.value.trim()) {
                displayError('Por favor, ingresa tu contraseña.');
                passwordInput?.focus();
                return;
            }

            // --- LÓGICA DE ENVÍO ---
            setFormState(true, 'Procesando...');

            try {
                const result = await window.api.login({
                    username: usernameInput.value,
                    password: passwordInput.value
                });

                if (result.success) {
                    // Guardar información del usuario en sessionStorage
                    if (result.user) {
                        sessionStorage.setItem('userId', result.user.id);
                        sessionStorage.setItem('username', result.user.username);
                        if (result.user.nombre) {
                            sessionStorage.setItem('userName', result.user.nombre);
                        }
                    }
                    window.location.href = 'home.html';
                } else {
                    displayError(result.message || 'Nombre de usuario o contraseña incorrectos.');
                }
            } catch (error) {
                console.error("Error en el login:", error);
                displayError('Error inesperado. Inténtalo de nuevo.');
            } finally {
                setFormState(false, 'Entrar');
            }
        });

        // Limpiar errores cuando el usuario empiece a escribir
        const formInputs = loginForm.querySelectorAll('input');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                hideError();
            });
        });
    }

    // Manejo de la tecla Enter para enviar el formulario
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && loginForm) {
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton && !submitButton.disabled) {
                loginForm.dispatchEvent(new Event('submit'));
            }
        }
    });
});