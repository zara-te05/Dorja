class CurriculumManager {
    constructor() {
        this.currentUser = null;
        this.currentTema = null;
        this.currentProblema = null;
    }

    async init(userId) {
        this.currentUser = userId;
        await this.cargarDatosIniciales();
    }

    async cargarTemas() {
        return new Promise((resolve, reject) => {
            const db = require('./database').getDB();
            db.all(`
                SELECT t.*, 
                       (SELECT COUNT(*) FROM problemas p WHERE p.tema_id = t.id) as total_problemas,
                       (SELECT COUNT(*) FROM progreso_problemas pp 
                        JOIN problemas p ON pp.problema_id = p.id 
                        WHERE p.tema_id = t.id AND pp.user_id = ? AND pp.completado = 1) as problemas_completados
                FROM temas t
                ORDER BY t.orden
            `, [this.currentUser], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async cargarProblemas(temaId) {
        return new Promise((resolve, reject) => {
            const db = require('./database').getDB();
            db.all(`
                SELECT p.*, 
                       pp.completado as resuelto,
                       pp.puntuacion,
                       pp.ultimo_codigo
                FROM problemas p
                LEFT JOIN progreso_problemas pp ON p.id = pp.problema_id AND pp.user_id = ?
                WHERE p.tema_id = ?
                ORDER BY p.orden
            `, [this.currentUser, temaId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async verificarSolucion(codigoUsuario, problemaId) {
        // Lógica simple de verificación - puedes hacerla más compleja
        const problema = await this.obtenerProblema(problemaId);
        
        // Aquí iría tu lógica de evaluación del código
        const esCorrecto = this.evaluarCodigo(codigoUsuario, problema.solucion);
        
        if (esCorrecto) {
            await this.marcarProblemaCompletado(problemaId, codigoUsuario);
            await this.desbloquearSiguiente(problemaId);
            return { correcto: true, mensaje: "¡Correcto!" };
        } else {
            return { correcto: false, mensaje: "Intenta de nuevo" };
        }
    }

    async marcarProblemaCompletado(problemaId, codigo) {
        const db = require('./database').getDB();
        db.run(`
            INSERT OR REPLACE INTO progreso_problemas 
            (user_id, problema_id, completado, puntuacion, ultimo_codigo, fecha_completado)
            VALUES (?, ?, 1, 100, ?, CURRENT_TIMESTAMP)
        `, [this.currentUser, problemaId, codigo]);
    }

    async desbloquearSiguiente(problemaId) {
        const problema = await this.obtenerProblema(problemaId);
        const siguienteProblema = await this.obtenerSiguienteProblema(problema.tema_id, problema.orden);
        
        if (siguienteProblema) {
            const db = require('./database').getDB();
            db.run(`UPDATE problemas SET locked = 0 WHERE id = ?`, [siguienteProblema.id]);
        }
    }

    async obtenerProblema(problemaId) {
        return new Promise((resolve, reject) => {
            const db = require('./database').getDB();
            db.get(`SELECT * FROM problemas WHERE id = ?`, [problemaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    evaluarCodigo(codigoUsuario, solucion) {
        // Lógica básica de evaluación - mejorar según necesidades
        return codigoUsuario.trim() === solucion.trim();
    }
}

module.exports = new CurriculumManager();