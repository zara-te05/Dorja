const { app, BrowserWindow, ipcMain, Menu, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { spawn } = require('child_process');
const ElectronOAuth2 = require('electron-oauth2');
require('dotenv').config();

// Importar la base de datos modular
const { initDatabase, getDB } = require('./database/database');

const saltRounds = 10;

// Configuración de rutas
const userDataPath = app.getPath('userData');
const imagesPath = path.join(userDataPath, 'images');

// Crear directorio de imágenes si no existe
if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true });
}

// Configuración de OAuth2 para Google
const googleConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://www.googleapis.com/oauth2/v4/token',
    redirectUri: 'http://localhost'
};

// Función para crear ventana principal
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1366,
        height: 800,
        minWidth: 1366,
        minHeight: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });
    
    mainWindow.loadFile('src/login.html');

    // Atajos de teclado para DevTools (solo en desarrollo)
    globalShortcut.register('Control+Shift+I', () => {
        mainWindow.webContents.toggleDevTools();
    });
    globalShortcut.register('F12', () => {
        mainWindow.webContents.toggleDevTools();
    });

    Menu.setApplicationMenu(null);
}

// EVENTOS DE LA APLICACIÓN
app.whenReady().then(() => {
    initDatabase();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// MANEJADORES IPC

// Manejo de login
ipcMain.handle('login', async (event, { username, password }) => {
    const db = getDB();

    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
            if (err) {
                console.error(err);
                reject({ success: false, message: 'Error en la base de datos' });
            } else if (!row) {
                resolve({ success: false, message: 'Usuario no encontrado' });
            } else {
                const match = await bcrypt.compare(password, row.password);
                if (match) {
                    resolve({ success: true, user: row });
                } else {
                    resolve({ success: false, message: 'Contraseña incorrecta' });
                }
            }
        });
    });
});

// Manejo de registro
ipcMain.handle('signup', async (event, data) => {
    const { username, nombre, apellidoPaterno, apellidoMaterno, email, password } = data;
    const db = getDB();
    
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql = `INSERT INTO users (username, nombre, apellidoPaterno, apellidoMaterno, email, password) VALUES (?, ?, ?, ?, ?, ?)`;
        
        return new Promise((resolve, reject) => {
            db.run(sql, [username, nombre, apellidoPaterno, apellidoMaterno, email, hashedPassword], function(err) {
                if (err) {
                    console.error('ERROR DE BASE DE DATOS EN SIGNUP:', err);
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        reject('El nombre de usuario o el email ya están registrados.');
                    } else {
                        reject(err.message);
                    }
                } else {
                    resolve({ success: true, userId: this.lastID });
                }
            });
        });
    } catch (error) {
        console.error('ERROR EN EL BLOQUE TRY/CATCH DE SIGNUP:', error);
        return Promise.reject(error.message);
    }
});

// Ejecución de código Python
ipcMain.handle('execute-python', async (event, code) => {
    return new Promise((resolve) => {
        const pythonProcess = spawn('python', ['-u', '-c', code]);

        let output = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (error) {
                resolve({ success: false, output: error });
            } else {
                resolve({ success: true, output: output });
            }
        });
    });
});

// Obtener usuario por ID
ipcMain.handle('get-user-by-id', async (event, userId) => {
    const db = getDB();
    const sql = `SELECT id, username, nombre, email, profilePhotoPath, coverPhotoPath FROM users WHERE id = ?`;
    return new Promise((resolve, reject) => {
        db.get(sql, [userId], (err, user) => {
            if (err) reject(err.message);
            else resolve(user);
        });
    });
});

// Actualizar perfil de usuario
ipcMain.handle('update-user-profile', async (event, { userId, username, email }) => {
    const db = getDB();
    const sql = `UPDATE users SET username = ?, email = ? WHERE id = ?`;
    return new Promise((resolve, reject) => {
        db.run(sql, [username, email, userId], function (err) {
            if (err) {
                reject({ 
                    message: 'Error al actualizar el perfil. El nombre de usuario o email ya podría estar en uso.', 
                    error: err 
                });
            } else {
                resolve({ success: true, changes: this.changes });
            }
        });
    });
});

// Actualizar contraseña
ipcMain.handle('update-user-password', async (event, { userId, oldPassword, newPassword }) => {
    const db = getDB();
    const sqlSelect = `SELECT password FROM users WHERE id = ?`;
    return new Promise((resolve, reject) => {
        db.get(sqlSelect, [userId], async (err, user) => {
            if (err || !user) return reject({ message: 'No se pudo encontrar al usuario.' });

            const match = await bcrypt.compare(oldPassword, user.password);
            if (!match) return resolve({ success: false, message: 'La contraseña actual es incorrecta.' });
            
            const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
            const sqlUpdate = `UPDATE users SET password = ? WHERE id = ?`;
            db.run(sqlUpdate, [newHashedPassword, userId], function (err) {
                if (err) return reject({ message: 'Error al actualizar la contraseña.' });
                resolve({ success: true });
            });
        });
    });
});

// Eliminar cuenta de usuario
ipcMain.handle('delete-user-account', async (event, { userId, password }) => {
    const db = getDB();
    const sqlSelect = `SELECT password FROM users WHERE id = ?`;
    return new Promise((resolve, reject) => {
        db.get(sqlSelect, [userId], async (err, user) => {
            if (err || !user) return reject({ message: 'No se pudo encontrar al usuario.' });

            const match = await bcrypt.compare(password, user.password);
            if (!match) return resolve({ success: false, message: 'La contraseña es incorrecta.' });

            const sqlDelete = `DELETE FROM users WHERE id = ?`;
            db.run(sqlDelete, [userId], function(err) {
                if (err) return reject({ message: 'Error al eliminar la cuenta.' });
                resolve({ success: true });
            });
        });
    });
});

// Guardar imágenes de perfil/portada
ipcMain.handle('save-image', async (event, { userId, imageType, dataUrl }) => {
    const db = getDB();
    
    // Extraer el formato y los datos base64
    const matches = dataUrl.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Formato de imagen inválido.');
    }

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Crear un nombre de archivo único
    const filename = `${imageType}_${userId}_${Date.now()}.${extension}`;
    const filePath = path.join(imagesPath, filename);

    // Guardar el archivo en el disco
    fs.writeFileSync(filePath, buffer);

    // Actualizar la ruta en la base de datos
    const columnToUpdate = imageType === 'profile' ? 'profilePhotoPath' : 'coverPhotoPath';
    const sql = `UPDATE users SET ${columnToUpdate} = ? WHERE id = ?`;

    return new Promise((resolve, reject) => {
        db.run(sql, [filePath, userId], function(err) {
            if (err) {
                reject(new Error('No se pudo actualizar la ruta de la imagen en la base de datos.'));
            } else {
                resolve({ success: true, path: filePath });
            }
        });
    });
});

// Login con Google
ipcMain.handle('google-login', async (event) => {
    try {
        const db = getDB();
        const window = BrowserWindow.fromWebContents(event.sender);
        const myOauth = new ElectronOAuth2(googleConfig, window);

        const token = await myOauth.getAccessToken({
            scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
        });

        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${token.access_token}` }
        });
        const profile = await response.json();
        
        return new Promise((resolve, reject) => {
            const sqlFind = `SELECT * FROM users WHERE email = ?`;
            db.get(sqlFind, [profile.email], (err, user) => {
                if (err) return reject({ message: 'Error en la base de datos.' });
                if (user) {
                    resolve({ success: true, user: { id: user.id } });
                } else {
                    const newUsername = profile.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
                    const sqlCreate = `INSERT INTO users (username, email, nombre, password) VALUES (?, ?, ?, ?)`;
                    db.run(sqlCreate, [newUsername, profile.email, profile.given_name, 'google_not_set'], function(err) {
                        if (err) {
                            if (err.code === 'SQLITE_CONSTRAINT') {
                                const randomUsername = newUsername + Math.floor(Math.random() * 1000);
                                db.run(sqlCreate, [randomUsername, profile.email, profile.given_name, 'google_not_set'], function(err) {
                                     if (err) return reject({ message: 'No se pudo crear el usuario.' });
                                     resolve({ success: true, user: { id: this.lastID } });
                                });
                            } else { 
                                return reject({ message: 'No se pudo crear el usuario.' }); 
                            }
                        } else {
                            resolve({ success: true, user: { id: this.lastID } });
                        }
                    });
                }
            });
        });
    } catch (error) {
        console.error("Error durante el inicio de sesión con Google:", error);
        return Promise.reject({ message: 'No se pudo completar el inicio de sesión con Google.' });
    }
    
});

// main.js - Agrega después de los manejadores IPC existentes

// MANEJADORES IPC PARA EL CURRICULUM

// Cargar temas
ipcMain.handle('cargar-temas', async (event, userId) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT t.*, 
                   (SELECT COUNT(*) FROM problemas p WHERE p.tema_id = t.id) as total_problemas,
                   (SELECT COUNT(*) FROM progreso_problemas pp 
                    JOIN problemas p ON pp.problema_id = p.id 
                    WHERE p.tema_id = t.id AND pp.user_id = ? AND pp.completado = 1) as problemas_completados
            FROM temas t
            ORDER BY t.orden
        `, [userId], (err, rows) => {
            if (err) {
                console.error('Error cargando temas:', err);
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
});

// Cargar problemas de un tema
ipcMain.handle('cargar-problemas', async (event, userId, temaId) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT p.*, 
                   pp.completado as resuelto,
                   pp.puntuacion,
                   pp.ultimo_codigo
            FROM problemas p
            LEFT JOIN progreso_problemas pp ON p.id = pp.problema_id AND pp.user_id = ?
            WHERE p.tema_id = ?
            ORDER BY p.orden
        `, [userId, temaId], (err, rows) => {
            if (err) {
                console.error('Error cargando problemas:', err);
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
});

// Obtener un problema específico
ipcMain.handle('obtener-problema', async (event, problemaId) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM problemas WHERE id = ?`, [problemaId], (err, row) => {
            if (err) {
                console.error('Error obteniendo problema:', err);
                reject(err);
            } else {
                resolve(row || null);
            }
        });
    });
});

// Verificar solución
ipcMain.handle('verificar-solucion', async (event, userId, codigoUsuario, problemaId) => {
    const db = getDB();
    
    try {
        // Primero obtenemos el problema para tener la solución
        const problema = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM problemas WHERE id = ?`, [problemaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!problema) {
            return { correcto: false, mensaje: "Problema no encontrado" };
        }

        // Lógica simple de verificación - puedes hacerla más compleja
        const esCorrecto = await verificarCodigoPython(codigoUsuario, problema.solucion);
        
        if (esCorrecto) {
            // Marcar como completado
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT OR REPLACE INTO progreso_problemas 
                    (user_id, problema_id, completado, puntuacion, ultimo_codigo, fecha_completado)
                    VALUES (?, ?, 1, 100, ?, CURRENT_TIMESTAMP)
                `, [userId, problemaId, codigoUsuario], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Desbloquear siguiente problema
            await desbloquearSiguienteProblema(db, problemaId);
            
            return { correcto: true, mensaje: "¡Correcto! Problema completado." };
        } else {
            // Guardar intento fallido
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT OR REPLACE INTO progreso_problemas 
                    (user_id, problema_id, completado, puntuacion, ultimo_codigo, intentos)
                    VALUES (?, ?, 0, 0, ?, COALESCE((SELECT intentos FROM progreso_problemas WHERE user_id = ? AND problema_id = ?), 0) + 1)
                `, [userId, problemaId, codigoUsuario, userId, problemaId], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            return { correcto: false, mensaje: "La solución no es correcta. Intenta de nuevo." };
        }
    } catch (error) {
        console.error('Error verificando solución:', error);
        return { correcto: false, mensaje: "Error al verificar la solución" };
    }
});

// Marcar problema como completado
ipcMain.handle('marcar-problema-completado', async (event, userId, problemaId, codigo) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT OR REPLACE INTO progreso_problemas 
            (user_id, problema_id, completado, puntuacion, ultimo_codigo, fecha_completado)
            VALUES (?, ?, 1, 100, ?, CURRENT_TIMESTAMP)
        `, [userId, problemaId, codigo], function(err) {
            if (err) {
                console.error('Error marcando problema como completado:', err);
                reject(err);
            } else {
                resolve({ success: true });
            }
        });
    });
});

// FUNCIONES AUXILIARES

// Función para verificar código Python
async function verificarCodigoPython(codigoUsuario, solucionEsperada) {
    // Esta es una verificación básica - puedes mejorarla según tus necesidades
    try {
        // Ejecutar el código del usuario
        const resultadoUsuario = await new Promise((resolve) => {
            const pythonProcess = spawn('python', ['-u', '-c', codigoUsuario]);
            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => output += data.toString());
            pythonProcess.stderr.on('data', (data) => error += data.toString());
            pythonProcess.on('close', () => resolve({ output: output.trim(), error }));
        });

        // Ejecutar la solución esperada
        const resultadoEsperado = await new Promise((resolve) => {
            const pythonProcess = spawn('python', ['-u', '-c', solucionEsperada]);
            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => output += data.toString());
            pythonProcess.stderr.on('data', (data) => error += data.toString());
            pythonProcess.on('close', () => resolve({ output: output.trim(), error }));
        });

        // Comparar resultados
        return resultadoUsuario.output === resultadoEsperado.output && !resultadoUsuario.error;
    } catch (error) {
        console.error('Error en verificación de código:', error);
        return false;
    }
}

// Función para desbloquear siguiente problema
async function desbloquearSiguienteProblema(db, problemaIdActual) {
    try {
        // Obtener el problema actual para saber su tema y orden
        const problemaActual = await new Promise((resolve, reject) => {
            db.get(`SELECT tema_id, orden FROM problemas WHERE id = ?`, [problemaIdActual], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!problemaActual) return;

        // Buscar el siguiente problema en el mismo tema
        const siguienteProblema = await new Promise((resolve, reject) => {
            db.get(`
                SELECT id FROM problemas 
                WHERE tema_id = ? AND orden = ? AND locked = 1
            `, [problemaActual.tema_id, problemaActual.orden + 1], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (siguienteProblema) {
            // Desbloquear el siguiente problema
            await new Promise((resolve, reject) => {
                db.run(`UPDATE problemas SET locked = 0 WHERE id = ?`, [siguienteProblema.id], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } else {
            // Si no hay más problemas en este tema, verificar si podemos desbloquear el siguiente tema
            await desbloquearSiguienteTema(db, problemaActual.tema_id);
        }
    } catch (error) {
        console.error('Error desbloqueando siguiente problema:', error);
    }
}

// Función para desbloquear siguiente tema
async function desbloquearSiguienteTema(db, temaIdActual) {
    try {
        // Verificar si todos los problemas del tema actual están completados
        const problemasCompletados = await new Promise((resolve, reject) => {
            db.get(`
                SELECT COUNT(*) as total, 
                       (SELECT COUNT(*) FROM progreso_problemas pp 
                        JOIN problemas p ON pp.problema_id = p.id 
                        WHERE p.tema_id = ? AND pp.completado = 1) as completados
                FROM problemas 
                WHERE tema_id = ?
            `, [temaIdActual, temaIdActual], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (problemasCompletados && problemasCompletados.total === problemasCompletados.completados) {
            // Desbloquear siguiente tema
            await new Promise((resolve, reject) => {
                db.run(`UPDATE temas SET locked = 0 WHERE id = ?`, [temaIdActual + 1], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    } catch (error) {
        console.error('Error desbloqueando siguiente tema:', error);
    }
}