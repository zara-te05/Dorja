using Microsoft.Data.Sqlite;
using System;
using System.IO;
using System.Threading.Tasks;

namespace BACK
{
    public static class DatabaseInitializer
    {
        public static void InitializeDatabase(string connectionString)
        {
            var dbPath = connectionString.Replace("Data Source=", "").Trim();
            var dbDirectory = Path.GetDirectoryName(dbPath);
            
            if (!string.IsNullOrEmpty(dbDirectory) && !Directory.Exists(dbDirectory))
            {
                Directory.CreateDirectory(dbDirectory);
            }

            using var connection = new SqliteConnection(connectionString);
            connection.Open();

            // Create tables
            CreateUsersTable(connection);
            CreateNivelesTable(connection);
            CreateTemasTable(connection);
            CreateProblemasTable(connection);
            CreateProgresoProblemaTable(connection);
            CreateLogrosTable(connection);
            CreateLogrosUsuarioTable(connection);
            CreateCertificadosTable(connection);
        }

        private static void CreateUsersTable(SqliteConnection connection)
        {
            var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    nombre TEXT NOT NULL,
                    apellidoPaterno TEXT NOT NULL,
                    apellidoMaterno TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    fechaRegistro TEXT NOT NULL,
                    ultimaConexion TEXT,
                    puntosTotales INTEGER DEFAULT 0,
                    nivelActual INTEGER DEFAULT 1
                )";
            command.ExecuteNonQuery();
        }

        private static void CreateNivelesTable(SqliteConnection connection)
        {
            var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS niveles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL,
                    descripcion TEXT,
                    dificultad TEXT,
                    orden INTEGER,
                    puntosRequeridos INTEGER DEFAULT 0
                )";
            command.ExecuteNonQuery();
        }

        private static void CreateTemasTable(SqliteConnection connection)
        {
            var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS temas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nivel_id INTEGER,
                    titulo TEXT NOT NULL,
                    descripcion TEXT,
                    orden INTEGER,
                    locked INTEGER DEFAULT 1,
                    puntos_requeridos INTEGER DEFAULT 0,
                    FOREIGN KEY (nivel_id) REFERENCES niveles(id)
                )";
            command.ExecuteNonQuery();
        }

        private static void CreateProblemasTable(SqliteConnection connection)
        {
            var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS problemas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tema_id INTEGER,
                    titulo TEXT NOT NULL,
                    descripcion TEXT,
                    ejemplo TEXT,
                    dificultad TEXT,
                    codigo_inicial TEXT,
                    solucion TEXT,
                    orden INTEGER,
                    locked INTEGER DEFAULT 1,
                    puntos_otorgados INTEGER DEFAULT 10,
                    FOREIGN KEY (tema_id) REFERENCES temas(id)
                )";
            command.ExecuteNonQuery();
        }

        private static void CreateProgresoProblemaTable(SqliteConnection connection)
        {
            var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS progreso_problema (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    problema_id INTEGER,
                    completado INTEGER DEFAULT 0,
                    puntuacion INTEGER DEFAULT 0,
                    intentos INTEGER DEFAULT 0,
                    ultimo_codigo TEXT,
                    fecha_completado TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (problema_id) REFERENCES problemas(id)
                )";
            command.ExecuteNonQuery();
        }

        private static void CreateLogrosTable(SqliteConnection connection)
        {
            var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS logros (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL,
                    descripcion TEXT,
                    iconoPhoto TEXT
                )";
            command.ExecuteNonQuery();
        }

        private static void CreateLogrosUsuarioTable(SqliteConnection connection)
        {
            var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS logros_usuario (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    logro_id INTEGER,
                    fechaDesbloqueo TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (logro_id) REFERENCES logros(id)
                )";
            command.ExecuteNonQuery();
        }

        private static void CreateCertificadosTable(SqliteConnection connection)
        {
            var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS certificados (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    nivel_id INTEGER,
                    rutaPDF TEXT,
                    fechaGenerado TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (nivel_id) REFERENCES niveles(id)
                )";
            command.ExecuteNonQuery();
        }
    }
}

