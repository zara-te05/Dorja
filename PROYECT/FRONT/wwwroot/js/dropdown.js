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
            sessionStorage.removeItem('username');
            window.location.href = 'login.html';
        });
    }
});