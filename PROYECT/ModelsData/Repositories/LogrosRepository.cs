using Dapper;
using DorjaModelado;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DorjaData.Repositories
{
    public class LogrosRepository : ILogrosRepository
    {
        private readonly MySQLConfiguration _connectionString;

        public LogrosRepository(MySQLConfiguration connectionString)
        {
            _connectionString = connectionString;
        }

        protected MySqlConnection dbConnection()
        {
            return new MySqlConnection(_connectionString.ConnectionString);
        }

        public async Task<IEnumerable<Logros>> GetAllLogros()
        {
            var db = dbConnection();
            var sql = "SELECT * FROM logros";
            return await db.QueryAsync<Logros>(sql);
        }

        public async Task<Logros> GetDetails(int id)
        {
            var db = dbConnection();
            var sql = "SELECT * FROM logros WHERE id = @Id";
            return await db.QueryFirstOrDefaultAsync<Logros>(sql, new { Id = id });
        }

        public async Task<bool> InsertLogros(Logros logros)
        {
            var db = dbConnection();
            var sql = @"INSERT INTO logros (nombre, descripcion, iconoPath) 
                        VALUES (@Nombre, @Descripcion, @IconoPath)";
            var result = await db.ExecuteAsync(sql, logros);
            return result > 0;
        }

        public async Task<bool> UpdateLogros(Logros logros)
        {
            var db = dbConnection();
            var sql = @"UPDATE logros SET 
                            nombre = @Nombre,
                            descripcion = @Descripcion,
                            iconoPath = @IconoPath
                        WHERE id = @Id";
            var result = await db.ExecuteAsync(sql, logros);
            return result > 0;
        }

        public async Task<bool> DeleteLogros(Logros logros)
        {
            var db = dbConnection();
            var sql = "DELETE FROM logros WHERE id = @Id";
            var result = await db.ExecuteAsync(sql, logros);
            return result > 0;
        }
    }
}
