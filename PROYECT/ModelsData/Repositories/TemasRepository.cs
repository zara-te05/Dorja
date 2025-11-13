using Dapper;
using DorjaModelado;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Text;

namespace DorjaData.Repositories
{
    public class TemasRepository : ITemasRepository
    {
        private readonly MySQLConfiguration _connectionString;

        public TemasRepository(MySQLConfiguration connectionString)
        {
            _connectionString = connectionString;
        }

        protected MySqlConnection dbConnection()
        {
            return new MySqlConnection(_connectionString.ConnectionString);
        }

        public async Task<bool> DeleteTemas(Temas temas)
        {
            var db = dbConnection();
            var sql = @"DELETE FROM temas WHERE id = @id";

            var result = await db.ExecuteAsync(sql, new { id = temas.IdTemas });
            return result > 0;
        }

        public Task<IEnumerable<Temas>> GetAllTemas()
        {
            var db = dbConnection();
            var sql = @"SELECT id, nivel_id, titulo, descripcion, orden,
                        locked, puntos_requeridos
                        FROM temas";

            return db.QueryAsync<Temas>(sql, new { });
        }

        public async Task<Temas> GetDetails(int id)
        {
            var db = dbConnection();
            var sql = @"SELECT id, nivel_id ,titulo, descripcion, orden,
                       locked, puntos_requeridos
                FROM temas
                WHERE id = @id";

            return await db.QueryFirstOrDefaultAsync<Temas>(sql, new { id });
        }

        public async Task<bool> InsertTemas(Temas temas)
        {
            var db = dbConnection();
            var sql = @"INSERT INTO temas (titulo, descripcion, locked,
                       orden, puntos_requeridos)
                VALUES (@titulo, @descripcion, @locked,
                        @orden, @puntos_requeridos)";

            var result = await db.ExecuteAsync(sql, temas);

            return result > 0;
        }

        public async Task<bool> UpdateTemas(Temas temas)
        {
            var db = dbConnection();
            var sql = @"UPDATE temas SET
                    titulo = @titulo,
                    descripcion = @descripcion,
                    locked = @locked,
                    orden = @orden,
                    puntos_requeridos = @puntos_requeridos
                WHERE id = @id";

            var result = await db.ExecuteAsync(sql, temas);
            return result > 0; // true si actualizó
        }
    }
}
