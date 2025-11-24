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
            try
            {
                Console.WriteLine($"Initializing database with connection string: {connectionString}");
                
                var dbPath = connectionString.Replace("Data Source=", "").Trim();
                var dbDirectory = Path.GetDirectoryName(dbPath);
                
                if (string.IsNullOrEmpty(dbDirectory))
                {
                    // If no directory specified, use current directory
                    dbPath = Path.Combine(Directory.GetCurrentDirectory(), dbPath);
                    dbDirectory = Directory.GetCurrentDirectory();
                }
                
                Console.WriteLine($"Database path: {dbPath}");
                Console.WriteLine($"Database directory: {dbDirectory}");
                
                if (!string.IsNullOrEmpty(dbDirectory) && !Directory.Exists(dbDirectory))
                {
                    Directory.CreateDirectory(dbDirectory);
                    Console.WriteLine($"Created directory: {dbDirectory}");
                }

                using var connection = new SqliteConnection(connectionString);
                connection.Open();
                Console.WriteLine("Database connection opened successfully");

                // Create tables
                Console.WriteLine("Creating tables...");
                CreateUsersTable(connection);
                CreateNivelesTable(connection);
                CreateTemasTable(connection);
                CreateProblemasTable(connection);
                CreateProgresoProblemaTable(connection);
                CreateLogrosTable(connection);
                CreateLogrosUsuarioTable(connection);
                CreateCertificadosTable(connection);
                Console.WriteLine("All tables created successfully");

                // Seed initial data
                Console.WriteLine("Starting seed process...");
                SeedInitialData(connection);
                Console.WriteLine("Database initialization completed successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR initializing database: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw; // Re-throw to ensure the application knows there was an error
            }
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
                    nivelActual INTEGER DEFAULT 1,
                    profilePhotoPath TEXT DEFAULT '',
                    coverPhotoPath TEXT DEFAULT '',
                    profilePhotoBlob BLOB,
                    coverPhotoBlob BLOB
                )";
            command.ExecuteNonQuery();
            
            // Add columns if they don't exist (for existing databases)
            AddColumnIfNotExists(connection, "users", "profilePhotoPath", "TEXT DEFAULT ''");
            AddColumnIfNotExists(connection, "users", "coverPhotoPath", "TEXT DEFAULT ''");
            AddColumnIfNotExists(connection, "users", "profilePhotoBlob", "BLOB");
            AddColumnIfNotExists(connection, "users", "coverPhotoBlob", "BLOB");
        }
        
        private static void AddColumnIfNotExists(SqliteConnection connection, string tableName, string columnName, string columnDefinition)
        {
            try
            {
                var checkCommand = connection.CreateCommand();
                checkCommand.CommandText = $"PRAGMA table_info({tableName})";
                var reader = checkCommand.ExecuteReader();
                bool columnExists = false;
                
                while (reader.Read())
                {
                    var existingColumnName = reader.GetString(1);
                    if (existingColumnName.Equals(columnName, StringComparison.OrdinalIgnoreCase))
                    {
                        columnExists = true;
                        break;
                    }
                }
                reader.Close();
                
                if (!columnExists)
                {
                    var alterCommand = connection.CreateCommand();
                    alterCommand.CommandText = $"ALTER TABLE {tableName} ADD COLUMN {columnName} {columnDefinition}";
                    alterCommand.ExecuteNonQuery();
                    Console.WriteLine($"Added column {columnName} to table {tableName}");
                }
            }
            catch (Exception ex)
            {
                // Log the error but don't fail - column might already exist
                Console.WriteLine($"Warning: Could not add column {columnName} to {tableName}: {ex.Message}");
            }
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

        private static void SeedInitialData(SqliteConnection connection)
        {
            try
            {
                // Check if data already exists
                var checkCommand = connection.CreateCommand();
                checkCommand.CommandText = "SELECT COUNT(*) FROM niveles";
                var nivelCount = Convert.ToInt32(checkCommand.ExecuteScalar());
                
                if (nivelCount > 0)
                {
                    Console.WriteLine($"Database already contains {nivelCount} levels. Skipping seed.");
                    return;
                }

                Console.WriteLine("Seeding initial data...");

            // Insert Nivel 1: Lógica de programación
            var nivel1Command = connection.CreateCommand();
            nivel1Command.CommandText = @"
                INSERT INTO niveles (nombre, descripcion, dificultad, orden, puntosRequeridos)
                VALUES ('Nivel 1', 'Fundamentos de programación: variables, condicionales, bucles y estructuras básicas', 'Principiante', 1, 0)";
            nivel1Command.ExecuteNonQuery();

            // Get nivel 1 ID
            var getNivel1Command = connection.CreateCommand();
            getNivel1Command.CommandText = "SELECT last_insert_rowid()";
            var nivel1Id = Convert.ToInt32(getNivel1Command.ExecuteScalar());

            // Insert Tema 1: Lógica de programación
            var tema1Command = connection.CreateCommand();
            tema1Command.CommandText = @"
                INSERT INTO temas (nivel_id, titulo, descripcion, orden, locked, puntos_requeridos)
                VALUES (@nivelId, 'Lógica de programación', 'Aprende los fundamentos de la programación: variables, tipos de datos, operadores, condicionales y bucles', 1, 0, 0)";
            tema1Command.Parameters.AddWithValue("@nivelId", nivel1Id);
            tema1Command.ExecuteNonQuery();

            var getTema1Command = connection.CreateCommand();
            getTema1Command.CommandText = "SELECT last_insert_rowid()";
            var tema1Id = Convert.ToInt32(getTema1Command.ExecuteScalar());

            // Insert Problemas for Tema 1
            InsertProblema(connection, tema1Id, 1, "Introducción a Variables", 
                "Las variables son contenedores que almacenan valores. En Python, no necesitas declarar el tipo de variable explícitamente.",
                "nombre = 'Juan'\nedad = 25\nactivo = True",
                "Fácil",
                "nombre = ''\nedad = 0\nactivo = False",
                "nombre = 'Juan'\nedad = 25\nactivo = True\nprint(f'{nombre} tiene {edad} años y está {activo}')",
                10);

            InsertProblema(connection, tema1Id, 2, "Operadores Aritméticos",
                "Los operadores aritméticos permiten realizar operaciones matemáticas básicas: suma (+), resta (-), multiplicación (*), división (/) y módulo (%).",
                "a = 10\nb = 3\nsuma = a + b\nresta = a - b\nmultiplicacion = a * b\ndivision = a / b\nmodulo = a % b",
                "Fácil",
                "# Completa las operaciones\na = 15\nb = 4\n# Calcula la suma\nsuma = \n# Calcula la resta\nresta = \n# Calcula la multiplicación\nmultiplicacion = \n# Calcula la división\ndivision = \n# Calcula el módulo\nmodulo = ",
                "a = 15\nb = 4\nsuma = a + b\nresta = a - b\nmultiplicacion = a * b\ndivision = a / b\nmodulo = a % b\nprint(f'Suma: {suma}, Resta: {resta}, Multiplicación: {multiplicacion}, División: {division}, Módulo: {modulo}')",
                15);

            InsertProblema(connection, tema1Id, 3, "Condicionales: if/else",
                "Las estructuras condicionales permiten ejecutar código basado en condiciones. Usa 'if' para verificar una condición, 'elif' para condiciones adicionales y 'else' para el caso por defecto.",
                "edad = 18\nif edad >= 18:\n    print('Mayor de edad')\nelse:\n    print('Menor de edad')",
                "Fácil",
                "# Determina si un número es positivo, negativo o cero\nnumero = 5\n# Escribe tu código aquí",
                "numero = 5\nif numero > 0:\n    print('Positivo')\nelif numero < 0:\n    print('Negativo')\nelse:\n    print('Cero')",
                20);

            InsertProblema(connection, tema1Id, 4, "Bucles: for",
                "El bucle 'for' permite repetir una acción un número determinado de veces. Es útil para iterar sobre listas, rangos o secuencias.",
                "for i in range(5):\n    print(f'Número: {i}')",
                "Fácil",
                "# Imprime los números del 1 al 10\n# Escribe tu código aquí",
                "for i in range(1, 11):\n    print(i)",
                20);

            InsertProblema(connection, tema1Id, 5, "Bucles: while",
                "El bucle 'while' ejecuta código mientras una condición sea verdadera. Úsalo cuando no sepas cuántas veces necesitas repetir.",
                "contador = 0\nwhile contador < 5:\n    print(contador)\n    contador += 1",
                "Media",
                "# Suma números hasta que la suma sea mayor a 100\nsuma = 0\nnumero = 1\n# Escribe tu código aquí",
                "suma = 0\nnumero = 1\nwhile suma <= 100:\n    suma += numero\n    numero += 1\nprint(f'Suma final: {suma}')",
                25);

            InsertProblema(connection, tema1Id, 6, "Listas y Operaciones",
                "Las listas son colecciones ordenadas de elementos. Puedes agregar, eliminar y acceder a elementos por índice.",
                "numeros = [1, 2, 3, 4, 5]\nprint(numeros[0])  # Primer elemento\nnumeros.append(6)  # Agregar elemento",
                "Fácil",
                "# Crea una lista con los números del 1 al 5\n# Agrega el número 6\n# Imprime la lista\n# Escribe tu código aquí",
                "numeros = [1, 2, 3, 4, 5]\nnumeros.append(6)\nprint(numeros)",
                20);

            // Insert Nivel 2: Programación Orientada a Objetos
            var nivel2Command = connection.CreateCommand();
            nivel2Command.CommandText = @"
                INSERT INTO niveles (nombre, descripcion, dificultad, orden, puntosRequeridos)
                VALUES ('Nivel 2', 'Programación Orientada a Objetos: clases, objetos, herencia y encapsulación', 'Intermedio', 2, 100)";
            nivel2Command.ExecuteNonQuery();

            var getNivel2Command = connection.CreateCommand();
            getNivel2Command.CommandText = "SELECT last_insert_rowid()";
            var nivel2Id = Convert.ToInt32(getNivel2Command.ExecuteScalar());

            // Insert Tema 2: Programación Orientada a Objetos
            var tema2Command = connection.CreateCommand();
            tema2Command.CommandText = @"
                INSERT INTO temas (nivel_id, titulo, descripcion, orden, locked, puntos_requeridos)
                VALUES (@nivelId, 'Programación Orientada a Objetos', 'Domina los conceptos de POO: clases, objetos, herencia, encapsulación y polimorfismo', 1, 1, 100)";
            tema2Command.Parameters.AddWithValue("@nivelId", nivel2Id);
            tema2Command.ExecuteNonQuery();

            var getTema2Command = connection.CreateCommand();
            getTema2Command.CommandText = "SELECT last_insert_rowid()";
            var tema2Id = Convert.ToInt32(getTema2Command.ExecuteScalar());

            // Insert Problemas for Tema 2
            InsertProblema(connection, tema2Id, 1, "Clases y Objetos",
                "Una clase es un molde para crear objetos. Define atributos (datos) y métodos (comportamientos). Un objeto es una instancia de una clase.",
                "class Persona:\n    def __init__(self, nombre):\n        self.nombre = nombre\n    \n    def saludar(self):\n        return f'Hola, soy {self.nombre}'\n\npersona = Persona('Juan')\nprint(persona.saludar())",
                "Fácil",
                "# Crea una clase 'Coche' con atributos 'marca' y 'modelo'\n# Agrega un método 'mostrar_info' que devuelva la información del coche\n# Crea un objeto y muestra su información\n# Escribe tu código aquí",
                "class Coche:\n    def __init__(self, marca, modelo):\n        self.marca = marca\n        self.modelo = modelo\n    \n    def mostrar_info(self):\n        return f'{self.marca} {self.modelo}'\n\nmi_coche = Coche('Toyota', 'Corolla')\nprint(mi_coche.mostrar_info())",
                30);

            InsertProblema(connection, tema2Id, 2, "Métodos y Atributos",
                "Los métodos son funciones dentro de una clase. Los atributos son variables que pertenecen a un objeto. Pueden ser públicos o privados (usando _ o __).",
                "class Cuenta:\n    def __init__(self, saldo_inicial):\n        self.saldo = saldo_inicial\n    \n    def depositar(self, monto):\n        self.saldo += monto\n    \n    def obtener_saldo(self):\n        return self.saldo",
                "Fácil",
                "# Crea una clase 'Libro' con atributos 'titulo' y 'autor'\n# Agrega métodos 'prestar' y 'devolver' que cambien el estado del libro\n# Escribe tu código aquí",
                "class Libro:\n    def __init__(self, titulo, autor):\n        self.titulo = titulo\n        self.autor = autor\n        self.disponible = True\n    \n    def prestar(self):\n        if self.disponible:\n            self.disponible = False\n            return 'Libro prestado'\n        return 'Libro no disponible'\n    \n    def devolver(self):\n        self.disponible = True\n        return 'Libro devuelto'\n\nlibro = Libro('Python 101', 'Autor')\nprint(libro.prestar())\nprint(libro.devolver())",
                35);

            InsertProblema(connection, tema2Id, 3, "Herencia",
                "La herencia permite crear una nueva clase basada en una clase existente. La clase hija hereda atributos y métodos de la clase padre.",
                "class Animal:\n    def __init__(self, nombre):\n        self.nombre = nombre\n    \n    def hacer_sonido(self):\n        return 'Sonido genérico'\n\nclass Perro(Animal):\n    def hacer_sonido(self):\n        return 'Guau!'",
                "Media",
                "# Crea una clase 'Vehiculo' con método 'arrancar'\n# Crea una clase 'Moto' que herede de 'Vehiculo'\n# Sobrescribe el método 'arrancar' en 'Moto'\n# Escribe tu código aquí",
                "class Vehiculo:\n    def __init__(self, marca):\n        self.marca = marca\n    \n    def arrancar(self):\n        return 'Vehiculo arrancado'\n\nclass Moto(Vehiculo):\n    def arrancar(self):\n        return f'{self.marca} moto arrancada'\n\nmoto = Moto('Yamaha')\nprint(moto.arrancar())",
                40);

            InsertProblema(connection, tema2Id, 4, "Encapsulación",
                "La encapsulación protege los datos internos de una clase. En Python, usa _ para atributos protegidos y __ para privados.",
                "class CuentaBancaria:\n    def __init__(self):\n        self._saldo = 0  # Protegido\n    \n    def depositar(self, monto):\n        if monto > 0:\n            self._saldo += monto\n    \n    def obtener_saldo(self):\n        return self._saldo",
                "Media",
                "# Crea una clase 'Estudiante' con atributo privado '__nota'\n# Agrega métodos para establecer y obtener la nota (validando que esté entre 0 y 10)\n# Escribe tu código aquí",
                "class Estudiante:\n    def __init__(self, nombre):\n        self.nombre = nombre\n        self.__nota = 0\n    \n    def establecer_nota(self, nota):\n        if 0 <= nota <= 10:\n            self.__nota = nota\n        else:\n            print('Nota inválida')\n    \n    def obtener_nota(self):\n        return self.__nota\n\nest = Estudiante('Juan')\nest.establecer_nota(8.5)\nprint(est.obtener_nota())",
                40);

            InsertProblema(connection, tema2Id, 5, "Polimorfismo",
                "El polimorfismo permite que diferentes clases respondan al mismo método de manera diferente. Es clave en la programación orientada a objetos.",
                "class Forma:\n    def area(self):\n        pass\n\nclass Rectangulo(Forma):\n    def __init__(self, ancho, alto):\n        self.ancho = ancho\n        self.alto = alto\n    \n    def area(self):\n        return self.ancho * self.alto\n\nclass Circulo(Forma):\n    def __init__(self, radio):\n        self.radio = radio\n    \n    def area(self):\n        return 3.14159 * self.radio ** 2",
                "Media",
                "# Crea una clase base 'Animal' con método 'mover'\n# Crea clases 'Pez' y 'Ave' que hereden de 'Animal'\n# Cada una debe implementar 'mover' de forma diferente\n# Escribe tu código aquí",
                "class Animal:\n    def mover(self):\n        pass\n\nclass Pez(Animal):\n    def mover(self):\n        return 'Nadando'\n\nclass Ave(Animal):\n    def mover(self):\n        return 'Volando'\n\npez = Pez()\nave = Ave()\nprint(pez.mover())\nprint(ave.mover())",
                45);

            // Insert Nivel 3: Fundamentos de bases de datos
            var nivel3Command = connection.CreateCommand();
            nivel3Command.CommandText = @"
                INSERT INTO niveles (nombre, descripcion, dificultad, orden, puntosRequeridos)
                VALUES ('Nivel 3', 'Fundamentos de bases de datos: SQL, consultas, relaciones y normalización', 'Avanzado', 3, 250)";
            nivel3Command.ExecuteNonQuery();

            var getNivel3Command = connection.CreateCommand();
            getNivel3Command.CommandText = "SELECT last_insert_rowid()";
            var nivel3Id = Convert.ToInt32(getNivel3Command.ExecuteScalar());

            // Insert Tema 3: Fundamentos de bases de datos
            var tema3Command = connection.CreateCommand();
            tema3Command.CommandText = @"
                INSERT INTO temas (nivel_id, titulo, descripcion, orden, locked, puntos_requeridos)
                VALUES (@nivelId, 'Fundamentos de bases de datos', 'Aprende SQL: consultas SELECT, INSERT, UPDATE, DELETE, JOINs y diseño de bases de datos', 1, 1, 250)";
            tema3Command.Parameters.AddWithValue("@nivelId", nivel3Id);
            tema3Command.ExecuteNonQuery();

            var getTema3Command = connection.CreateCommand();
            getTema3Command.CommandText = "SELECT last_insert_rowid()";
            var tema3Id = Convert.ToInt32(getTema3Command.ExecuteScalar());

            // Insert Problemas for Tema 3
            InsertProblema(connection, tema3Id, 1, "SELECT Básico",
                "La consulta SELECT permite recuperar datos de una tabla. Puedes especificar qué columnas quieres y usar WHERE para filtrar resultados.",
                "SELECT nombre, email FROM usuarios WHERE edad > 18",
                "Fácil",
                "-- Escribe una consulta que seleccione todos los campos de la tabla 'productos'\n-- donde el precio sea mayor a 100\n-- Escribe tu código aquí",
                "SELECT * FROM productos WHERE precio > 100",
                30);

            InsertProblema(connection, tema3Id, 2, "INSERT y UPDATE",
                "INSERT agrega nuevos registros a una tabla. UPDATE modifica registros existentes. Ambos son esenciales para mantener datos actualizados.",
                "INSERT INTO usuarios (nombre, email) VALUES ('Juan', 'juan@email.com');\n\nUPDATE usuarios SET email = 'nuevo@email.com' WHERE id = 1;",
                "Fácil",
                "-- Inserta un nuevo producto con nombre 'Laptop', precio 1200 y stock 10\n-- Luego actualiza el stock a 15 para ese producto\n-- Escribe tu código aquí",
                "INSERT INTO productos (nombre, precio, stock) VALUES ('Laptop', 1200, 10);\nUPDATE productos SET stock = 15 WHERE nombre = 'Laptop';",
                35);

            InsertProblema(connection, tema3Id, 3, "JOIN: Combinar Tablas",
                "Los JOINs permiten combinar datos de múltiples tablas. INNER JOIN devuelve solo registros que coinciden en ambas tablas.",
                "SELECT u.nombre, p.titulo\nFROM usuarios u\nINNER JOIN posts p ON u.id = p.usuario_id",
                "Media",
                "-- Escribe una consulta que muestre el nombre del cliente y el nombre del producto\n-- de la tabla 'clientes' y 'pedidos' usando INNER JOIN\n-- Escribe tu código aquí",
                "SELECT c.nombre, p.nombre_producto\nFROM clientes c\nINNER JOIN pedidos p ON c.id = p.cliente_id",
                40);

            InsertProblema(connection, tema3Id, 4, "WHERE y Operadores",
                "La cláusula WHERE filtra registros. Puedes usar operadores como =, <>, >, <, LIKE, IN, BETWEEN, AND, OR.",
                "SELECT * FROM productos WHERE precio BETWEEN 50 AND 200 AND categoria = 'Electrónica'",
                "Media",
                "-- Selecciona todos los empleados que tengan salario mayor a 50000\n-- y que trabajen en el departamento 'IT' o 'Desarrollo'\n-- Escribe tu código aquí",
                "SELECT * FROM empleados WHERE salario > 50000 AND (departamento = 'IT' OR departamento = 'Desarrollo')",
                40);

            InsertProblema(connection, tema3Id, 5, "GROUP BY y Agregaciones",
                "GROUP BY agrupa filas que tienen los mismos valores. Funciones de agregación como COUNT, SUM, AVG, MAX, MIN operan sobre grupos.",
                "SELECT categoria, COUNT(*) as total, AVG(precio) as precio_promedio\nFROM productos\nGROUP BY categoria",
                "Media",
                "-- Agrupa los pedidos por cliente y muestra el total de pedidos y la suma total gastada\n-- Escribe tu código aquí",
                "SELECT cliente_id, COUNT(*) as total_pedidos, SUM(total) as total_gastado\nFROM pedidos\nGROUP BY cliente_id",
                45);

            InsertProblema(connection, tema3Id, 6, "LEFT JOIN y RIGHT JOIN",
                "LEFT JOIN devuelve todos los registros de la tabla izquierda y los coincidentes de la derecha. RIGHT JOIN hace lo contrario.",
                "SELECT u.nombre, p.titulo\nFROM usuarios u\nLEFT JOIN posts p ON u.id = p.usuario_id",
                "Avanzada",
                "-- Muestra todos los productos y sus categorías, incluso si no tienen categoría asignada\n-- Usa LEFT JOIN\n-- Escribe tu código aquí",
                "SELECT p.nombre, c.nombre as categoria\nFROM productos p\nLEFT JOIN categorias c ON p.categoria_id = c.id",
                50);

                // Seed Logros
                SeedLogros(connection);

                Console.WriteLine("Initial data seeded successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR seeding data: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                // Don't throw here - we want the database to be usable even if seed fails
                // The tables are already created, so users can still be created
            }
        }

        private static void InsertProblema(SqliteConnection connection, int temaId, int orden, string titulo, 
            string descripcion, string ejemplo, string dificultad, string codigoInicial, string solucion, int puntosOtorgados)
        {
            try
            {
                var command = connection.CreateCommand();
                command.CommandText = @"
                    INSERT INTO problemas (tema_id, titulo, descripcion, ejemplo, dificultad, codigo_inicial, solucion, orden, locked, puntos_otorgados)
                    VALUES (@temaId, @titulo, @descripcion, @ejemplo, @dificultad, @codigoInicial, @solucion, @orden, 0, @puntosOtorgados)";
                command.Parameters.AddWithValue("@temaId", temaId);
                command.Parameters.AddWithValue("@titulo", titulo);
                command.Parameters.AddWithValue("@descripcion", descripcion);
                command.Parameters.AddWithValue("@ejemplo", ejemplo);
                command.Parameters.AddWithValue("@dificultad", dificultad);
                command.Parameters.AddWithValue("@codigoInicial", codigoInicial);
                command.Parameters.AddWithValue("@solucion", solucion);
                command.Parameters.AddWithValue("@orden", orden);
                command.Parameters.AddWithValue("@puntosOtorgados", puntosOtorgados);
                command.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR inserting problema '{titulo}': {ex.Message}");
                throw;
            }
        }

        private static void SeedLogros(SqliteConnection connection)
        {
            try
            {
                // Check if logros already exist
                var checkCommand = connection.CreateCommand();
                checkCommand.CommandText = "SELECT COUNT(*) FROM logros";
                var logroCount = Convert.ToInt32(checkCommand.ExecuteScalar());
                
                if (logroCount > 0)
                {
                    Console.WriteLine($"Database already contains {logroCount} logros. Skipping logros seed.");
                    return;
                }

                Console.WriteLine("Seeding logros...");

                // Logro 1: Crear cuenta
                var logro1Command = connection.CreateCommand();
                logro1Command.CommandText = @"
                    INSERT INTO logros (nombre, descripcion, iconoPhoto)
                    VALUES ('Crear cuenta', 'Has creado tu cuenta en Dorja. ¡Bienvenido!', 'fa-user-plus')";
                logro1Command.ExecuteNonQuery();

                // Logro 2: Personalizar perfil
                var logro2Command = connection.CreateCommand();
                logro2Command.CommandText = @"
                    INSERT INTO logros (nombre, descripcion, iconoPhoto)
                    VALUES ('Personalizar perfil', 'Has añadido una foto de perfil. ¡Tu perfil se ve genial!', 'fa-user-circle')";
                logro2Command.ExecuteNonQuery();

                // Logro 3: Tu primer código
                var logro3Command = connection.CreateCommand();
                logro3Command.CommandText = @"
                    INSERT INTO logros (nombre, descripcion, iconoPhoto)
                    VALUES ('Tu primer código', 'Has ejecutado tu primer código. ¡El inicio de una gran aventura!', 'fa-code')";
                logro3Command.ExecuteNonQuery();

                Console.WriteLine("Logros seeded successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR seeding logros: {ex.Message}");
                // Don't throw - logros are not critical for database initialization
            }
        }
    }
}

