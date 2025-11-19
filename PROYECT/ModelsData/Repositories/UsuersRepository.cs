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
                        email, password, fechaRegistro, ultimaConexion, puntosTotales, nivelActual 
                        FROM users";

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
                        VALUES (@Username, @Nombre, @ApellidoPaterno, @ApellidoMaterno,
                                @Email, @Password, @FechaRegistro, @UltimaConexion, @PuntosTotales, @NivelActual)";

            var result = await db.ExecuteAsync(sql, usuario);
            return result > 0;
        }

        public async Task<bool> UpdateUsuarios(Users usuario)
        {
            var db = dbConnection();
            var sql = @"UPDATE users SET
                        username = @Username,
                        nombre = @Nombre,
                        apellidoPaterno = @ApellidoPaterno,
                        apellidoMaterno = @ApellidoMaterno,
                        email = @Email,
                        password = @Password,
                        fechaRegistro = @FechaRegistro,
                        ultimaConexion = @UltimaConexion,
                        puntosTotales = @PuntosTotales,
                        nivelActual = @NivelActual
                        WHERE id = @Id";

            var result = await db.ExecuteAsync(sql, usuario);
            return result > 0;
        }

        public async Task<bool> DeleteUsuarios(Users usuario)
        {
            var db = dbConnection();
            var sql = @"DELETE FROM users WHERE id = @Id";

            var result = await db.ExecuteAsync(sql, new { usuario.Id });
            return result > 0;
        }

        public async Task<Users?> GetByEmail(string email)
        {
            var db = dbConnection();
            var sql = @"SELECT id, username, nombre, apellidoPaterno, apellidoMaterno,
                        email, password, fechaRegistro, ultimaConexion, puntosTotales, nivelActual
                        FROM users WHERE email = @Email";

            return await db.QueryFirstOrDefaultAsync<Users>(sql, new { Email = email });
        }

        public async Task<Users?> ValidateLogin(string email, string passwordHash)
        {
            var db = dbConnection();
            var sql = @"SELECT id, username, email, password
                        FROM users
                        WHERE email = @Email AND password = @Password";

            return await db.QueryFirstOrDefaultAsync<Users>(sql, new { Email = email, Password = passwordHash });
        }
    }
}
