using Dapper;
using DorjaModelado;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Text;

namespace DorjaData.Repositories
{
    public class Logros_UsuarioRepository : ILogros_UsuarioRepository
    {
        private readonly MySQLConfiguration _connectionString;

        public Logros_UsuarioRepository(MySQLConfiguration connectionString)
        {
            _connectionString = connectionString;
        }

        protected MySqlConnection dbConnection()
        {
            return new MySqlConnection(_connectionString.ConnectionString);
        }
        public  async Task<bool> DeleteLogrosUsuario(Logros_Usuario logros_Usuario)
        {
            var db = dbConnection();
            var sql = @"DELETE FROM logros_usuarios WHERE id = @id";

            var result = await db.ExecuteAsync(sql, new { id = logros_Usuario.id });
            return result > 0;
        }

        public Task<IEnumerable<Logros_Usuario>> GetAllLogrosUsuario()
        {
            var db = dbConnection();
            var sql = @"SELECT id, user_id, logro_id, fechaDesbloqueo
                        FROM logros_usuario";

            return db.QueryAsync<Logros_Usuario>(sql, new { });
        }

        public async Task<Logros_Usuario> GetDetails(int id)
        {
            var db = dbConnection();
            var sql = @"SELECT id, user_id, logro_id, fechaDesbloqueo
                        FROM logros_usuario
                FROM temas
                WHERE id = @id";

            return await db.QueryFirstOrDefaultAsync<Logros_Usuario>(sql, new { id });
        }

        // AQUI TENGO DUDAS DE SI INSERTAR LOS ID DE LOS USUARIOS Y DE LOS LOGROS
        public async Task<bool> InsertLogrosUsuario(Logros_Usuario logros_Usuario)
        {
            var db = dbConnection();
            var sql = @"INSERT INTO logros_usuario (user_id, logro_id, fechaDesbloqueo)

                VALUES (@user_id, @logro_id, @fechaDesbloqueo)";

            var result = await db.ExecuteAsync(sql, logros_Usuario);

            return result > 0;
        }

        // AQUI TENGO DUDAS DE SI ACTUALIZAR LOS ID DE LOS USUARIOS Y DE LOS LOGROS
        public async Task<bool> UpdateLogrosUsuario(Logros_Usuario logros_Usuario)
        {
            var db = dbConnection();
            var sql = @"UPDATE temas SET
                    user_id = @user_id,
                    logro_id = @logro_id,
                    fechaDesbloqueo = @fechaDesbloqueo,
                WHERE id = @id";

            var result = await db.ExecuteAsync(sql, logros_Usuario);
            return result > 0; // true si actualizó
        }
    }
}
