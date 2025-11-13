using Dapper;
using DorjaModelado;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Text;

namespace DorjaData.Repositories
{
    public class CertificadoRepository : ICertificadosRepository
    {
        private readonly MySQLConfiguration _connectionString;

        public CertificadoRepository(MySQLConfiguration connectionString)
        {
            _connectionString = connectionString;
        }


        protected MySqlConnection dbConnection()
        {
            return new MySqlConnection(_connectionString.ConnectionString);
        }

        public async Task<bool> DeleteCertificados(Certificados certificados)
        {
            var db = dbConnection();
            var sql = "DELETE FROM certificados WHERE id = @Id";
            var result = await db.ExecuteAsync(sql, certificados);
            return result > 0;
        }

        public async Task<IEnumerable<Certificados>> GetAllCertificados()
        {
            var db = dbConnection();
            var sql = "SELECT * FROM certificados";
            return await db.QueryAsync<Certificados>(sql);
        }

        public async Task<Certificados> GetDetails(int id)
        {
            var db = dbConnection();
            var sql = "SELECT * FROM certificados WHERE id = @Id";
            return await db.QueryFirstOrDefaultAsync<Certificados>(sql, new { Id = id });
        }

        public async Task<bool> InsertCertificados(Certificados certificados)
        {
            var db = dbConnection();
            var sql = @"INSERT INTO certificados (rutaPDF, fechaGenerado) 
                        VALUES (@rutaPDF, @fechaGenerado)";
            var result = await db.ExecuteAsync(sql, certificados);
            return result > 0;
        }

        public Task<bool> UpdateCertificados(Certificados certificados)
        {
            throw new NotImplementedException();
        }
    }
}
