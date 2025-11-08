document.addEventListener('DOMContentLoaded', async () => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // ELEMENTOS DE LA UI

    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profilePhoto = document.getElementById('profile-photo');
    const coverPhoto = document.getElementById('cover-photo');

    // Botones principales
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    // Elementos del Modal de Editar Perfil
    const editModal = document.getElementById('edit-modal');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const editProfileForm = document.getElementById('edit-profile-form');
    const editUsernameInput = document.getElementById('edit-username');
    const editEmailInput = document.getElementById('edit-email');
    const profilePhotoInput = document.getElementById('profile-photo-input');
    const coverPhotoInput = document.getElementById('cover-photo-input'); 

    // Elementos del Modal de Cambiar Contraseña
    const passwordModal = document.getElementById('password-modal');
    
    // Elementos del Modal de Eliminar Cuenta
    const deleteModal = document.getElementById('delete-modal');

    let currentUser = null;

    // CARGA DE DATOS DEL USUARIO 
    
    async function loadUserProfile() {
        try {
            const user = await window.api.getUserById(userId);
            if (user) {
                currentUser = user;
                profileUsername.textContent = user.username;
                profileEmail.textContent = user.email;
                editUsernameInput.value = user.username;
                editEmailInput.value = user.email;

                const initial = user.username.charAt(0).toUpperCase();
                
                if (user.profilePhotoPath) {
                    profilePhotoImg.src = `file://${user.profilePhotoPath}`;
                } else {
                    profilePhotoImg.src = `https://via.placeholder.com/150/818cf8/ffffff?text=${initial}`;
                }

                if (user.coverPhotoPath) {
                    coverPhotoImg.src = `file://${user.coverPhotoPath}`;
                } else {
                    coverPhotoImg.src = `https://via.placeholder.com/1500x500/6366F1/FFFFFF?text=Dashboard`;
                }

            } else {
                sessionStorage.removeItem('userId');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error al cargar datos del perfil:', error);
        }
    }
    await loadUserProfile();

        const handleImageUpload = (file, imageType) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target.result;
                try {
                    const imgElement = imageType === 'profile' ? profilePhotoImg : coverPhotoImg;
                    imgElement.src = dataUrl;

                    await window.api.saveImage({ userId, imageType, dataUrl });
                    alert(`La foto de ${imageType} se ha actualizado.`);
                } catch (error) {
                    console.error(`Error al guardar la imagen de ${imageType}:`, error);
                    alert('No se pudo guardar la imagen.');
                    await loadUserProfile();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    profilePhotoInput.addEventListener('change', (e) => handleImageUpload(e.target.files[0], 'profile'));
    coverPhotoInput.addEventListener('change', (e) => handleImageUpload(e.target.files[0], 'cover'));

    editProfileBtn.addEventListener('click', () => {
        editModal.classList.remove('hidden');
    });

    cancelEditBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
        if (currentUser) {
            editUsernameInput.value = currentUser.username;
            editEmailInput.value = currentUser.email;
        }
    });

    saveEditBtn.addEventListener('click', async () => {
        const newUsername = editUsernameInput.value.trim();
        const newEmail = editEmailInput.value.trim();

        if (!newUsername || !newEmail) {
            alert('El nombre de usuario y el email no pueden estar vacíos.');
            return;
        }

        try {
            await window.api.updateUserProfile({ userId, username: newUsername, email: newEmail });
            alert('Perfil actualizado con éxito.');
            editModal.classList.add('hidden');
            await loadUserProfile();
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            alert(error.message || 'Ocurrió un error al actualizar. Es posible que el nombre de usuario o email ya estén en uso.');
        }
    });


    changePasswordBtn.addEventListener('click', () => {
        alert('Funcionalidad de cambiar contraseña próximamente.');
    });

    function showDeleteModalContent(step) {
        let content = '';
        if (step === 1) {
            content = `
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
                    <div class="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h3 class="text-xl font-bold text-red-600 dark:text-red-500">Eliminar Cuenta</h3>
                    </div>
                    <div class="p-6">
                        <p class="text-gray-600 dark:text-slate-300">¿Estás absolutamente seguro? Esta acción es irreversible y todos tus datos, progreso y logros se perderán para siempre.</p>
                    </div>
                    <div class="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-4 rounded-b-xl">
                        <button id="cancel-delete-1" class="px-4 py-2 text-sm font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-lg">Cancelar</button>
                        <button id="confirm-delete-1" class="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Entiendo, continuar</button>
                    </div>
                </div>
            `;
        } else if (step === 2) {
            content = `
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
                    <div class="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h3 class="text-xl font-bold text-red-600 dark:text-red-500">Confirmación Final</h3>
                    </div>
                    <div class="p-6 flex flex-col gap-4">
                        <p>Para confirmar, por favor, introduce tu contraseña actual:</p>
                        <input type="password" id="delete-password-input" class="w-full bg-gray-100 dark:bg-slate-700 border-transparent rounded-lg p-2" placeholder="••••••••">
                    </div>
                    <div class="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-4 rounded-b-xl">
                        <button id="cancel-delete-2" class="px-4 py-2 text-sm font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-lg">Cancelar</button>
                        <button id="confirm-delete-2" class="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Eliminar mi cuenta permanentemente</button>
                    </div>
                </div>
            `;
        }
        deleteModal.innerHTML = content;
        deleteModal.classList.remove('hidden');
    }

    deleteAccountBtn.addEventListener('click', () => {
        showDeleteModalContent(1);

        document.getElementById('cancel-delete-1').addEventListener('click', () => deleteModal.classList.add('hidden'));
        document.getElementById('confirm-delete-1').addEventListener('click', () => showDeleteModalContent(2));
    });

    deleteModal.addEventListener('click', async (event) => {
        const targetId = event.target.id;

        if (targetId === 'cancel-delete-2') {
            deleteModal.classList.add('hidden');
        }

        if (targetId === 'confirm-delete-2') {
            const password = document.getElementById('delete-password-input').value;
            if (!password) {
                alert('Debes introducir tu contraseña para confirmar.');
                return;
            }

            try {
                const result = await window.api.deleteUserAccount({ userId, password });
                if (result.success) {
                    alert('Tu cuenta ha sido eliminada permanentemente.');
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                } else {
                    alert(result.message || 'Ocurrió un error al eliminar la cuenta.');
                }
            } catch (error) {
                console.error('Error al eliminar la cuenta:', error);
                alert('Ocurrió un error grave al intentar eliminar la cuenta.');
            }
        }
    });
});