using DorjaModelado;
using MySql.Data.MySqlClient;
using Dapper;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DorjaData.Repositories
{
    public class ProblemaRepository : IProblemaRepository
    {
        private readonly MySQLConfiguration _connectionString;

        public ProblemaRepository(MySQLConfiguration connectionString)
        {
            _connectionString = connectionString;
        }

        protected MySqlConnection dbConnection()
        {
            return new MySqlConnection(_connectionString.ConnectionString);
        }

        // Obtener todos los problemas
        public async Task<IEnumerable<Problema>> GetAllProblemas()
        {
            var db = dbConnection();
            var sql = "SELECT * FROM problemas";
            return await db.QueryAsync<Problema>(sql);
        }

        // Obtener detalles de un problema por id
        public async Task<Problema> GetDetails(int id)
        {
            var db = dbConnection();
            var sql = "SELECT * FROM problemas WHERE id = @Id";
            return await db.QueryFirstOrDefaultAsync<Problema>(sql, new { Id = id });
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
