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
        } else {
            sessionStorage.removeItem('userId');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
    }
}

window.addEventListener('DOMContentLoaded', initializeHomePage);