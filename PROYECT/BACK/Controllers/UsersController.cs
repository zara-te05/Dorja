using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using DorjaModelado.Repositories;
using DorjaModelado;
using DorjaData.Repositories;
using System.Text;


namespace BACK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _usersRepository;
        private readonly ILogrosRepository _logrosRepository;
        private readonly ILogros_UsuarioRepository _logrosUsuarioRepository;

        public UsersController(IUserRepository usersRepository, ILogrosRepository logrosRepository, ILogros_UsuarioRepository logrosUsuarioRepository)
        {
            _usersRepository = usersRepository;
            _logrosRepository = logrosRepository;
            _logrosUsuarioRepository = logrosUsuarioRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            return Ok(await _usersRepository.GetAllUsers());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetails(int id)
        {
            return Ok(await _usersRepository.GetDetails(id));
        }

        [HttpPost]
        public async Task<IActionResult> CreateUsuers([FromBody] Users usuario)
        {
            if (usuario == null)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var created = await _usersRepository.InsertUsers(usuario);

            return Created("created", created);
        }


        [HttpPut]
        public async Task<IActionResult> UpdateUsers([FromBody] Users usuario)
        {
            if (usuario == null)
            {
                return BadRequest(new { message = "Datos inválidos" });
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Obtener datos actuales del usuario desde la base de datos para preservar campos que no se están actualizando
            var currentUser = await _usersRepository.GetDetails(usuario.Id);
            if (currentUser == null)
            {
                return NotFound(new { message = "Usuario no encontrado" });
            }

            // Fusionar: usar valores proporcionados, recurrir a valores actuales de la base de datos
            // Esto asegura que no perdamos datos como rutas de fotos, contraseña, etc.
            var userToUpdate = new Users
            {
                Id = usuario.Id,
                Username = !string.IsNullOrWhiteSpace(usuario.Username) ? usuario.Username : currentUser.Username,
                Email = !string.IsNullOrWhiteSpace(usuario.Email) ? usuario.Email : currentUser.Email,
                Nombre = !string.IsNullOrWhiteSpace(usuario.Nombre) ? usuario.Nombre : currentUser.Nombre,
                ApellidoPaterno = !string.IsNullOrWhiteSpace(usuario.ApellidoPaterno) ? usuario.ApellidoPaterno : currentUser.ApellidoPaterno,
                ApellidoMaterno = !string.IsNullOrWhiteSpace(usuario.ApellidoMaterno) ? usuario.ApellidoMaterno : currentUser.ApellidoMaterno,
                Password = !string.IsNullOrWhiteSpace(usuario.Password) ? usuario.Password : currentUser.Password,
                FechaRegistro = usuario.FechaRegistro != default ? usuario.FechaRegistro : currentUser.FechaRegistro,
                UltimaConexion = usuario.UltimaConexion ?? currentUser.UltimaConexion,
                PuntosTotales = usuario.PuntosTotales != default ? usuario.PuntosTotales : currentUser.PuntosTotales,
                NivelActual = usuario.NivelActual != default ? usuario.NivelActual : currentUser.NivelActual,
                // CRÍTICO: Preservar rutas de fotos desde la base de datos a menos que se proporcionen explícitamente
                ProfilePhotoPath = !string.IsNullOrWhiteSpace(usuario.ProfilePhotoPath) ? usuario.ProfilePhotoPath : currentUser.ProfilePhotoPath,
                CoverPhotoPath = !string.IsNullOrWhiteSpace(usuario.CoverPhotoPath) ? usuario.CoverPhotoPath : currentUser.CoverPhotoPath
            };

            var updated = await _usersRepository.UpdateUsuarios(userToUpdate);
            if (!updated)
            {
                return StatusCode(500, new { message = "Error al actualizar el usuario" });
            }
            
            // Devolver los datos actualizados del usuario
            var updatedUser = await _usersRepository.GetDetails(usuario.Id);
            return Ok(updatedUser);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteUsers(int id)
        {
            await _usersRepository.DeleteUsuarios(new Users { Id = id });

            return NoContent();
        }

        // --------------------------  SIGNUP  ----------------------------

        [HttpPost("signup")]

        public async Task<IActionResult> Signup([FromBody] Users users)
        {
            if (users == null)
            {
                return BadRequest(new { message = "Datos invalidos" });
            }

            if (string.IsNullOrWhiteSpace(users.Email) ||
               string.IsNullOrWhiteSpace(users.Password) ||
               string.IsNullOrWhiteSpace(users.Username))
            {
                return BadRequest(new { message = "Email, Username y Password son obligatorios" });
            }

            // Verificar si el email ya existe
            var existingByEmail = await _usersRepository.GetByEmail(users.Email);
            if (existingByEmail != null)
            {
                return Conflict(new { message = "El email ya está registrado" });
            }

            // Verificar si el nombre de usuario ya existe
            var existingByUsername = await _usersRepository.GetByUsername(users.Username);
            if (existingByUsername != null)
            {
                return Conflict(new { message = "El nombre de usuario ya está en uso" });
            }

            // Establecer valores predeterminados para el nuevo usuario
            users.Password = HashPassword(users.Password);
            users.FechaRegistro = DateTime.Now;
            users.UltimaConexion = null; // Se establecerá en el primer inicio de sesión
            users.PuntosTotales = 0;
            users.NivelActual = 1; // Comenzar en el nivel 1
            users.ProfilePhotoPath = string.Empty;
            users.CoverPhotoPath = string.Empty;

            var created = await _usersRepository.InsertUsers(users);

            if (!created)
            {
                return StatusCode(500, new { message = "Error al registrar el usuario" });
            }

            // Obtener el usuario creado para obtener el ID
            var createdUser = await _usersRepository.GetByEmail(users.Email);
            
            // Otorgar logro "Crear cuenta"
            if (createdUser != null)
            {
                await GrantLogroIfNotExists(createdUser.Id, "Crear cuenta");
            }

            return Ok(new { 
                message = "Usuario registrado correctamente",
                userId = createdUser?.Id,
                achievementGranted = createdUser != null
            });
        }

        // --------------------------  LOGIN  ----------------------------

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Datos inválidos" });
            }

            if ((string.IsNullOrWhiteSpace(request.Email) && string.IsNullOrWhiteSpace(request.Username)) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Email/Username y Password son obligatorios" });
            }

            // Intentar encontrar usuario por email o nombre de usuario
            Users? existing = null;
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                existing = await _usersRepository.GetByEmail(request.Email);
            }
            
            if (existing == null && !string.IsNullOrWhiteSpace(request.Username))
            {
                existing = await _usersRepository.GetByUsername(request.Username);
            }

            if (existing == null)
            {
                return Unauthorized(new { message = "Email/Username o contraseña incorrectos" });
            }

            // Hashear la contraseña ingresada para compararla con la almacenada
            var hashedInputPassword = HashPassword(request.Password);

            if (existing.Password != hashedInputPassword)
            {
                return Unauthorized(new { message = "Email/Username o contraseña incorrectos" });
            }

            // Aquí podrías generar un token JWT (si quieres seguridad avanzada)
            return Ok(new
            {
                message = "Inicio de sesión exitoso",
                user = new
                {
                    existing.Id,
                    existing.Username,
                    existing.Email,
                    existing.Nombre,
                    existing.ApellidoPaterno,
                    existing.ApellidoMaterno
                }
            });
        }

        // Clase auxiliar para solicitud de inicio de sesión
        public class LoginRequest
        {
            public string? Username { get; set; }
            public string? Email { get; set; }
            public string? Password { get; set; }
        }

        // --------------------------  IMAGE UPLOAD  ----------------------------

        [HttpPost("{userId}/upload-image")]
        public async Task<IActionResult> UploadImage(int userId, [FromForm] IFormFile file, [FromForm] string imageType)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No se proporcionó ningún archivo" });
            }

            if (string.IsNullOrWhiteSpace(imageType) || (imageType != "profile" && imageType != "cover"))
            {
                return BadRequest(new { message = "Tipo de imagen inválido. Debe ser 'profile' o 'cover'" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF)" });
            }

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "El archivo es demasiado grande. El tamaño máximo es 5MB" });
            }

            try
            {
                // Obtener usuario para actualizar
                var user = await _usersRepository.GetDetails(userId);
                if (user == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                // Asegurar que las rutas de fotos no sean nulas
                if (user.ProfilePhotoPath == null) user.ProfilePhotoPath = string.Empty;
                if (user.CoverPhotoPath == null) user.CoverPhotoPath = string.Empty;

                // Crear directorio de subidas si no existe
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "users", userId.ToString());
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                // Generar nombre de archivo único
                var fileName = $"{imageType}_{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsDir, fileName);
                var relativePath = $"/uploads/users/{userId}/{fileName}";

                // Guardar archivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Actualizar registro de usuario - solo actualizar la ruta para el tipo de imagen que se está subiendo
                // La otra ruta de foto ya está cargada desde la base de datos y será preservada
                if (imageType == "profile")
                {
                    user.ProfilePhotoPath = relativePath;
                    // CoverPhotoPath ya está establecido desde GetDetails, por lo que será preservado
                }
                else
                {
                    user.CoverPhotoPath = relativePath;
                    // ProfilePhotoPath ya está establecido desde GetDetails, por lo que será preservado
                }

                // Registrar antes de actualizar para depuración
                Console.WriteLine($"Updating user {userId}: ProfilePhotoPath='{user.ProfilePhotoPath}', CoverPhotoPath='{user.CoverPhotoPath}'");

                var updateResult = await _usersRepository.UpdateUsuarios(user);
                
                if (!updateResult)
                {
                    Console.WriteLine($"ERROR: Failed to update user {userId} in database");
                    return StatusCode(500, new { message = "Error al actualizar el registro del usuario en la base de datos" });
                }

                // Verificar la actualización obteniendo el usuario nuevamente
                var updatedUser = await _usersRepository.GetDetails(userId);
                var savedPath = imageType == "profile" ? updatedUser?.ProfilePhotoPath : updatedUser?.CoverPhotoPath;

                // Registrar después de actualizar para depuración
                Console.WriteLine($"After update - User {userId}: ProfilePhotoPath='{updatedUser?.ProfilePhotoPath}', CoverPhotoPath='{updatedUser?.CoverPhotoPath}'");
                Console.WriteLine($"Saved path for {imageType}: '{savedPath}'");

                if (string.IsNullOrEmpty(savedPath))
                {
                    Console.WriteLine($"WARNING: Path was not saved correctly for {imageType} image");
                }

                // Grant "Personalizar perfil" achievement if profile photo was uploaded
                bool achievementGranted = false;
                if (imageType == "profile" && !string.IsNullOrEmpty(savedPath))
                {
                    achievementGranted = await GrantLogroIfNotExists(userId, "Personalizar perfil");
                }

                return Ok(new
                {
                    success = true,
                    message = "Imagen subida exitosamente",
                    path = relativePath,
                    savedPath = savedPath, // Return the saved path for verification
                    achievementGranted = achievementGranted
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error al subir la imagen: {ex.Message}" });
            }
        }

        // --------------------------  IMAGE UPLOAD AS BLOB (Database Storage)  ----------------------------

        [HttpPost("{userId}/upload-image-blob")]
        public async Task<IActionResult> UploadImageAsBlob(int userId, [FromForm] IFormFile file, [FromForm] string imageType)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No se proporcionó ningún archivo" });
            }

            if (string.IsNullOrWhiteSpace(imageType) || (imageType != "profile" && imageType != "cover"))
            {
                return BadRequest(new { message = "Tipo de imagen inválido. Debe ser 'profile' o 'cover'" });
            }

            // Validar tipo de archivo
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF)" });
            }

            // Validar tamaño de archivo (máximo 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "El archivo es demasiado grande. El tamaño máximo es 5MB" });
            }

            try
            {
                // Obtener usuario para verificar existencia
                var user = await _usersRepository.GetDetails(userId);
                if (user == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                // Leer datos de imagen en un array de bytes
                byte[] imageData;
                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    imageData = memoryStream.ToArray();
                }

                // Guardar en la base de datos como BLOB
                var updateResult = await _usersRepository.UpdatePhotoBlob(userId, imageType, imageData);
                
                if (!updateResult)
                {
                    return StatusCode(500, new { message = "Error al guardar la imagen en la base de datos" });
                }

                // Otorgar logro "Personalizar perfil" si se subió foto de perfil
                bool achievementGranted = false;
                if (imageType == "profile")
                {
                    achievementGranted = await GrantLogroIfNotExists(userId, "Personalizar perfil");
                }

                return Ok(new
                {
                    success = true,
                    message = "Imagen guardada exitosamente en la base de datos",
                    storageType = "blob",
                    size = imageData.Length,
                    achievementGranted = achievementGranted
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error al subir la imagen: {ex.Message}" });
            }
        }

        [HttpGet("{userId}/image-blob")]
        public async Task<IActionResult> GetImageBlob(int userId, [FromQuery] string imageType)
        {
            if (string.IsNullOrWhiteSpace(imageType) || (imageType != "profile" && imageType != "cover"))
            {
                return BadRequest(new { message = "Tipo de imagen inválido. Debe ser 'profile' o 'cover'" });
            }

            try
            {
                var imageData = await _usersRepository.GetPhotoBlob(userId, imageType);
                
                if (imageData == null || imageData.Length == 0)
                {
                    return NotFound(new { message = "Imagen no encontrada en la base de datos" });
                }

                // Determinar tipo de contenido basado en los datos de la imagen
                string contentType = "image/jpeg"; // Predeterminado
                if (imageData.Length > 4)
                {
                    // Verificar firma PNG
                    if (imageData[0] == 0x89 && imageData[1] == 0x50 && imageData[2] == 0x4E && imageData[3] == 0x47)
                    {
                        contentType = "image/png";
                    }
                    // Verificar firma GIF
                    else if (imageData[0] == 0x47 && imageData[1] == 0x49 && imageData[2] == 0x46)
                    {
                        contentType = "image/gif";
                    }
                }

                return File(imageData, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error al recuperar la imagen: {ex.Message}" });
            }
        }

        // --------------------------  HASH  ----------------------------
        private string HashPassword(string password)
        {
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        // --------------------------  ACHIEVEMENTS  ----------------------------
        private async Task<bool> GrantLogroIfNotExists(int userId, string logroNombre)
        {
            try
            {
                // Obtener logro por nombre
                var logro = await _logrosRepository.GetLogroByNombre(logroNombre);
                if (logro == null)
                {
                    Console.WriteLine($"Logro '{logroNombre}' no encontrado");
                    return false;
                }

                // Verificar si el usuario ya tiene este logro
                var hasLogro = await _logrosUsuarioRepository.UserHasLogro(userId, logro.Id);
                if (hasLogro)
                {
                    return false; // Ya lo tiene
                }

                // Otorgar el logro
                var logroUsuario = new Logros_Usuario
                {
                    Id_Usuario = userId,
                    Id_Logro = logro.Id,
                    Fecha_Obtencion = DateTime.Now
                };

                var created = await _logrosUsuarioRepository.InsertLogrosUsuario(logroUsuario);
                return created;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error granting logro '{logroNombre}' to user {userId}: {ex.Message}");
                return false;
            }
        }
    }
}
