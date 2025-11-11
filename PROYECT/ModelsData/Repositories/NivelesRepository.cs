using DorjaModelado;
using MySql.Data.MySqlClient;
using Dapper;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DorjaData.Repositories
{
    public class NivelesRepository : INivelesRepository
    {
        private readonly MySQLConfiguration _connectionString;

        // Constructor correcto
        public NivelesRepository(MySQLConfiguration connectionString)
        {
            _connectionString = connectionString;
        }

        protected MySqlConnection dbConnection()
        {
            return new MySqlConnection(_connectionString.ConnectionString);
        }

        public async Task<IEnumerable<Niveles>> GetAllNiveles()
        {
            var db = dbConnection();
            var sql = "SELECT * FROM niveles";
            return await db.QueryAsync<Niveles>(sql);
        }

        public async Task<Niveles> GetDetails(int id)
        {
            var db = dbConnection();
            var sql = "SELECT * FROM niveles WHERE id = @Id";
            return await db.QueryFirstOrDefaultAsync<Niveles>(sql, new { Id = id });
        }

        public async Task<bool> InsertNiveles(Niveles niveles)
        {
            var db = dbConnection();
            var sql = @"INSERT INTO niveles (nombre, descripcion, orden) 
                        VALUES (@Nombre, @Descripcion, @Orden)";
            var result = await db.ExecuteAsync(sql, niveles);
            return result > 0;
        }

        public async Task<bool> UpdateNiveles(Niveles niveles)
        {
            var db = dbConnection();
            var sql = @"UPDATE niveles SET 
                            nombre = @Nombre,
                            descripcion = @Descripcion,
                            orden = @Orden
                        WHERE id = @Id";
            var result = await db.ExecuteAsync(sql, niveles);
            return result > 0;
        }

        public async Task<bool> DeleteNiveles(Niveles niveles)
        {
            var db = dbConnection();
            var sql = "DELETE FROM niveles WHERE id = @Id";
            var result = await db.ExecuteAsync(sql, niveles);
            return result > 0;
        }
    }
}
