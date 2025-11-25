document.addEventListener('DOMContentLoaded', () => {
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');
    const logoutButton = document.getElementById('logout-button');

    const toggleMenu = () => {
        userMenu.classList.toggle('hidden');
    };

    if (userMenuButton) {
        userMenuButton.addEventListener('click', (event) => {
            event.stopPropagation(); 
            toggleMenu();
            
            // Cerrar menú de notificaciones si está abierto
            const notificationsMenu = document.getElementById('notifications-menu');
            if (notificationsMenu && !notificationsMenu.classList.contains('hidden')) {
                notificationsMenu.classList.add('hidden');
            }
        });
    }

    window.addEventListener('click', (event) => {
        if (userMenu && !userMenu.classList.contains('hidden')) {
            if (!userMenuButton.contains(event.target) && !userMenu.contains(event.target)) {
                toggleMenu();
            }
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault(); 
            // Limpiar toda la sesión
            sessionStorage.clear();
            localStorage.removeItem('theme'); // Opcional: mantener el tema
            window.location.href = 'login.html';
        });
    }
});