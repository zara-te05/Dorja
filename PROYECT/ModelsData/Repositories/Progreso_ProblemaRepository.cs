using DorjaModelado;
using DorjaData;
using Microsoft.Data.Sqlite;
using Dapper;
using System;
using System.Collections.Generic;
using System.Linq;
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
            var sql = @"SELECT id as Id, user_id as UserId, problema_id as ProblemaId, 
                       completado as Completado, puntuacion as Puntuacion, intentos as Intentos, 
                       ultimo_codigo as UltimoCodigo, fecha_completado as FechaCompletado 
                       FROM progreso_problema WHERE id = @Id";
            var result = await db.QueryFirstOrDefaultAsync<dynamic>(sql, new { Id = id });
            if (result == null) return null;
            return new Progreso_Problema
            {
                Id = result.Id,
                UserId = result.UserId,
                ProblemaId = result.ProblemaId,
                Completado = result.Completado == 1,
                Puntuacion = result.Puntuacion,
                Intentos = result.Intentos,
                UltimoCodigo = result.UltimoCodigo ?? string.Empty,
                FechaCompletado = result.FechaCompletado != null ? DateTime.Parse(result.FechaCompletado.ToString()) : (DateTime?)null
            };
        }

        public async Task<Progreso_Problema> GetByUserAndProblema(int userId, int problemaId)
        {
            var db = dbConnection();
            var sql = @"SELECT id as Id, user_id as UserId, problema_id as ProblemaId, 
                       completado as Completado, puntuacion as Puntuacion, intentos as Intentos, 
                       ultimo_codigo as UltimoCodigo, fecha_completado as FechaCompletado 
                       FROM progreso_problema WHERE user_id = @UserId AND problema_id = @ProblemaId";
            var result = await db.QueryFirstOrDefaultAsync<dynamic>(sql, new { UserId = userId, ProblemaId = problemaId });
            if (result == null) return null;
            return new Progreso_Problema
            {
                Id = result.Id,
                UserId = result.UserId,
                ProblemaId = result.ProblemaId,
                Completado = result.Completado == 1,
                Puntuacion = result.Puntuacion,
                Intentos = result.Intentos,
                UltimoCodigo = result.UltimoCodigo ?? string.Empty,
                FechaCompletado = result.FechaCompletado != null ? DateTime.Parse(result.FechaCompletado.ToString()) : (DateTime?)null
            };
        }

        public async Task<IEnumerable<Progreso_Problema>> GetByUserId(int userId)
        {
            var db = dbConnection();
            var sql = @"SELECT id as Id, user_id as UserId, problema_id as ProblemaId, 
                       completado as Completado, puntuacion as Puntuacion, intentos as Intentos, 
                       ultimo_codigo as UltimoCodigo, fecha_completado as FechaCompletado 
                       FROM progreso_problema WHERE user_id = @UserId";
            var results = await db.QueryAsync<dynamic>(sql, new { UserId = userId });
            return results.Select(r => new Progreso_Problema
            {
                Id = r.Id,
                UserId = r.UserId,
                ProblemaId = r.ProblemaId,
                Completado = r.Completado == 1,
                Puntuacion = r.Puntuacion,
                Intentos = r.Intentos,
                UltimoCodigo = r.UltimoCodigo ?? string.Empty,
                FechaCompletado = r.FechaCompletado != null ? DateTime.Parse(r.FechaCompletado.ToString()) : (DateTime?)null
            });
        }

        public async Task<bool> InsertProgreso_Problemas(Progreso_Problema progreso_problema)
        {
            var db = dbConnection();
            var sql = @"INSERT INTO progreso_problema 
                        (user_id, problema_id, completado, puntuacion, intentos, ultimo_codigo, fecha_completado) 
                        VALUES 
                        (@UserId, @ProblemaId, @Completado, @Puntuacion, @Intentos, @UltimoCodigo, @FechaCompletado)";
            var result = await db.ExecuteAsync(sql, new
            {
                progreso_problema.UserId,
                progreso_problema.ProblemaId,
                Completado = progreso_problema.Completado ? 1 : 0,
                progreso_problema.Puntuacion,
                progreso_problema.Intentos,
                progreso_problema.UltimoCodigo,
                FechaCompletado = progreso_problema.FechaCompletado?.ToString("yyyy-MM-dd HH:mm:ss")
            });
            return result > 0;
        }

        public async Task<bool> UpdateProgreso_Problemas(Progreso_Problema progreso_problema)
        {
            var db = dbConnection();
            var sql = @"UPDATE progreso_problema SET
                            user_id = @UserId,
                            problema_id = @ProblemaId,
                            completado = @Completado,
                            puntuacion = @Puntuacion,
                            intentos = @Intentos,
                            ultimo_codigo = @UltimoCodigo,
                            fecha_completado = @FechaCompletado
                        WHERE id = @Id";
            var result = await db.ExecuteAsync(sql, new
            {
                progreso_problema.Id,
                progreso_problema.UserId,
                progreso_problema.ProblemaId,
                Completado = progreso_problema.Completado ? 1 : 0,
                progreso_problema.Puntuacion,
                progreso_problema.Intentos,
                progreso_problema.UltimoCodigo,
                FechaCompletado = progreso_problema.FechaCompletado?.ToString("yyyy-MM-dd HH:mm:ss")
            });
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
