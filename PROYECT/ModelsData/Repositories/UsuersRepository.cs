using Dapper;
using DorjaData;
using MySql.Data.MySqlClient;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DorjaModelado.Repositories
{
    public class UsersRepository : IUserRepository
    {
        private readonly MySQLConfiguration _connectionString;

        public UsersRepository(MySQLConfiguration connectionString)
        {
            _connectionString = connectionString;
        }

        protected MySqlConnection dbConnection() 
        {
            return new MySqlConnection(_connectionString.ConnectionString);
        }

        public Task<IEnumerable<Users>> GetAllUsers()
        {
            var db = dbConnection();
            var sql = @"SELECT id, username, nombre, apellidoPaterno, apellidoMaterno,
                        email, password, fechaRegistro, ultimaConexion, puntosTotales, nivelActual FROM users";

            return db.QueryAsync<Users>(sql, new { });
        }

        public async Task<Users> GetDetails(int id)
        {
            var db = dbConnection();
            var sql = @"SELECT id, username, nombre, apellidoPaterno, apellidoMaterno,
                       email, password, fechaRegistro, ultimaConexion, puntosTotales, nivelActual
                FROM users
                WHERE id = @id";

            return await db.QueryFirstOrDefaultAsync<Users>(sql, new { id });
        }


        public async Task<bool> InsertUsers(Users usuario)
        {
            var db = dbConnection();
            var sql = @"INSERT INTO users (username, nombre, apellidoPaterno, apellidoMaterno,
                                   email, password, fechaRegistro, ultimaConexion, puntosTotales, nivelActual)
                VALUES (@username, @nombre, @apellidoPaterno, @apellidoMaterno,
                        @email, @password, @fechaRegistro, @ultimaConexion, @puntosTotales, @nivelActual)";

            var result = await db.ExecuteAsync(sql, usuario);

            return result > 0;
        }


        public async Task<bool> UpdateUsuarios(Users usuario)
        {
            var db = dbConnection();
            var sql = @"UPDATE users SET
                    username = @username,
                    nombre = @nombre,
                    apellidoPaterno = @apellidoPaterno,
                    apellidoMaterno = @apellidoMaterno,
                    email = @email,
                    password = @password,
                    fechaRegistro = @fechaRegistro,
                    ultimaConexion = @ultimaConexion,
                    puntosTotales = @puntosTotales,
                    nivelActual = @nivelActual
                WHERE id = @id";

            var result = await db.ExecuteAsync(sql, usuario);
            return result > 0; // true si actualizó
        }


        public async Task<bool> DeleteUsuarios(Users usuario)
        {
            var db = dbConnection();
            var sql = @"DELETE FROM users WHERE id = @id";

            var result = await db.ExecuteAsync(sql, new { id = usuario.IdUsario });
            return result > 0;
        }
    }
}
