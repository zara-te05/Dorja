using DorjaModelado;
using DorjaData;
using Microsoft.Data.Sqlite;
using Dapper;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DorjaData.Repositories
{
    public class Progreso_ProblemaRepository : IProgreso_ProblemaRepository
    {
        private readonly SQLiteConfiguration _connectionString;

        public Progreso_ProblemaRepository(SQLiteConfiguration connectionString)
        {
            _connectionString = connectionString;
        }

        protected SqliteConnection dbConnection()
        {
            return new SqliteConnection(_connectionString.ConnectionString);
        }

        public async Task<IEnumerable<Progreso_Problema>> GetAllProgreso_Problemas()
        {
            var db = dbConnection();
            var sql = "SELECT * FROM progreso_problema";
            return await db.QueryAsync<Progreso_Problema>(sql);
        }

        public async Task<Progreso_Problema> GetDetails(int id)
        {
            var db = dbConnection();
            var sql = "SELECT * FROM progreso_problema WHERE id = @Id";
            return await db.QueryFirstOrDefaultAsync<Progreso_Problema>(sql, new { Id = id });
        }

        public async Task<Progreso_Problema> GetByUserAndProblema(int userId, int problemaId)
        {
            var db = dbConnection();
            var sql = "SELECT * FROM progreso_problema WHERE user_id = @UserId AND problema_id = @ProblemaId";
            return await db.QueryFirstOrDefaultAsync<Progreso_Problema>(sql, new { UserId = userId, ProblemaId = problemaId });
        }

        public async Task<IEnumerable<Progreso_Problema>> GetByUserId(int userId)
        {
            var db = dbConnection();
            var sql = "SELECT * FROM progreso_problema WHERE user_id = @UserId";
            return await db.QueryAsync<Progreso_Problema>(sql, new { UserId = userId });
        }

        public async Task<bool> InsertProgreso_Problemas(Progreso_Problema progreso_problema)
        {
            using var db = dbConnection();
            await db.OpenAsync();
            await db.ExecuteAsync("PRAGMA foreign_keys = ON");
            
            var sql = @"INSERT INTO progreso_problema 
                        (user_id, problema_id, completado, puntuacion, intentos, ultimo_codigo, fecha_completado) 
                        VALUES 
                        (@UserId, @ProblemaId, @Completado, @Puntuacion, @Intentos, @UltimoCodigo, @FechaCompletado)";
            var result = await db.ExecuteAsync(sql, progreso_problema);
            return result > 0;
        }

        public async Task<bool> UpdateProgreso_Problemas(Progreso_Problema progreso_problema)
        {
            using var db = dbConnection();
            await db.OpenAsync();
            await db.ExecuteAsync("PRAGMA foreign_keys = ON");
            
            var sql = @"UPDATE progreso_problema SET
                            user_id = @UserId,
                            problema_id = @ProblemaId,
                            completado = @Completado,
                            puntuacion = @Puntuacion,
                            intentos = @Intentos,
                            ultimo_codigo = @UltimoCodigo,
                            fecha_completado = @FechaCompletado
                        WHERE id = @Id";
            var result = await db.ExecuteAsync(sql, progreso_problema);
            return result > 0;
        }

        public async Task<bool> DeleteProgreso_Problemas(int id)
        {
            var db = dbConnection();
            var sql = "DELETE FROM progreso_problema WHERE id = @Id";
            var result = await db.ExecuteAsync(sql, new { Id = id });
            return result > 0;
        }
    }
}
