const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    signup: (data) => ipcRenderer.invoke('signup', data),
    login: (data) => ipcRenderer.invoke('login', data),
    executePython: (code) => ipcRenderer.invoke('execute-python', code),
    getUserById: (userId) => ipcRenderer.invoke('get-user-by-id', userId),
    updateUserProfile: (data) => ipcRenderer.invoke('update-user-profile', data),
    updateUserPassword: (data) => ipcRenderer.invoke('update-user-password', data),
    deleteUserAccount: (data) => ipcRenderer.invoke('delete-user-account', data),
    saveImage: (data) => ipcRenderer.invoke('save-image', data),
    googleLogin: () => ipcRenderer.invoke('google-login'),
    // NUEVAS APIs para el curriculum
    cargarTemas: (userId) => ipcRenderer.invoke('cargar-temas', userId),
    cargarProblemas: (userId, temaId) => ipcRenderer.invoke('cargar-problemas', userId, temaId),
    obtenerProblema: (problemaId) => ipcRenderer.invoke('obtener-problema', problemaId),
    verificarSolucion: (userId, codigo, problemaId) => ipcRenderer.invoke('verificar-solucion', userId, codigo, problemaId),
    marcarProblemaCompletado: (userId, problemaId, codigo) => ipcRenderer.invoke('marcar-problema-completado', userId, problemaId, codigo)
});