using DorjaModelado;
using Microsoft.Data.Sqlite;
using Dapper;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DorjaData.Repositories
{
    public class ProblemaRepository : IProblemaRepository
    {
        private readonly SQLiteConfiguration _connectionString;

        public ProblemaRepository(SQLiteConfiguration connectionString)
        {
            _connectionString = connectionString;
        }

        protected SqliteConnection dbConnection()
        {
            return new SqliteConnection(_connectionString.ConnectionString);
        }

        // Obtener todos los problemas
        public async Task<IEnumerable<Problema>> GetAllProblemas()
        {
            var db = dbConnection();
            var sql = @"SELECT id as Id, tema_id as TemaId, titulo as Titulo, descripcion as Descripcion, 
                       ejemplo as Ejemplo, dificultad as Dificultad, codigo_inicial as CodigoInicial, 
                       solucion as Solucion, orden as Orden, locked as Locked, puntos_otorgados as PuntosOtorgados 
                       FROM problemas";
            return await db.QueryAsync<Problema>(sql);
        }

        // Obtener detalles de un problema por id
        public async Task<Problema> GetDetails(int id)
        {
            var db = dbConnection();
            var sql = @"SELECT id as Id, tema_id as TemaId, titulo as Titulo, descripcion as Descripcion, 
                       ejemplo as Ejemplo, dificultad as Dificultad, codigo_inicial as CodigoInicial, 
                       solucion as Solucion, orden as Orden, locked as Locked, puntos_otorgados as PuntosOtorgados 
                       FROM problemas WHERE id = @Id";
            return await db.QueryFirstOrDefaultAsync<Problema>(sql, new { Id = id });
        }

        // Obtener problemas por tema
        public async Task<IEnumerable<Problema>> GetProblemasByTema(int temaId)
        {
            var db = dbConnection();
            var sql = @"SELECT id as Id, tema_id as TemaId, titulo as Titulo, descripcion as Descripcion, 
                       ejemplo as Ejemplo, dificultad as Dificultad, codigo_inicial as CodigoInicial, 
                       solucion as Solucion, orden as Orden, locked as Locked, puntos_otorgados as PuntosOtorgados 
                       FROM problemas WHERE tema_id = @TemaId ORDER BY orden";
            return await db.QueryAsync<Problema>(sql, new { TemaId = temaId });
        }

        // Obtener problemas por nivel (a través de temas)
        public async Task<IEnumerable<Problema>> GetProblemasByNivel(int nivelId)
        {
            var db = dbConnection();
            var sql = @"SELECT p.id as Id, p.tema_id as TemaId, p.titulo as Titulo, p.descripcion as Descripcion, 
                       p.ejemplo as Ejemplo, p.dificultad as Dificultad, p.codigo_inicial as CodigoInicial, 
                       p.solucion as Solucion, p.orden as Orden, p.locked as Locked, p.puntos_otorgados as PuntosOtorgados 
                       FROM problemas p
                       INNER JOIN temas t ON p.tema_id = t.id
                       WHERE t.nivel_id = @NivelId
                       ORDER BY t.orden, p.orden";
            return await db.QueryAsync<Problema>(sql, new { NivelId = nivelId });
        }

        // Insertar un nuevo problema
        public async Task<bool> InsertProblemas(Problema problema)
        {
            var db = dbConnection();
            var sql = @"INSERT INTO problemas 
                        (tema_id, titulo, descripcion, ejemplo, dificultad, codigo_inicial, solucion, orden, locked, puntos_otorgados) 
                        VALUES 
                        (@TemaId, @Titulo, @Descripcion, @Ejemplo, @Dificultad, @CodigoInicial, @Solucion, @Orden, @Locked, @PuntosOtorgados)";
            var result = await db.ExecuteAsync(sql, problema);
            return result > 0;
        }

        // Actualizar un problema existente
        public async Task<bool> UpdateProblemas(Problema problema)
        {
            var db = dbConnection();
            var sql = @"UPDATE problemas SET
                            tema_id = @TemaId,
                            titulo = @Titulo,
                            descripcion = @Descripcion,
                            ejemplo = @Ejemplo,
                            dificultad = @Dificultad,
                            codigo_inicial = @CodigoInicial,
                            solucion = @Solucion,
                            orden = @Orden,
                            locked = @Locked,
                            puntos_otorgados = @PuntosOtorgados
                        WHERE id = @Id";
            var result = await db.ExecuteAsync(sql, problema);
            return result > 0;
        }

        // Eliminar un problema
        public async Task<bool> DeleteProblemas(Problema problema)
        {
            var db = dbConnection();
            var sql = "DELETE FROM problemas WHERE id = @Id";
            var result = await db.ExecuteAsync(sql, problema);
            return result > 0;
        }
    }
}
