using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using DorjaModelado.Repositories;
using DorjaModelado;
using System.Text;


namespace BACK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _usersRepository;

        public UsersController(IUserRepository usersRepository)
        {
            _usersRepository = usersRepository;
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
                return BadRequest();
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var updated = await _usersRepository.UpdateUsuarios(usuario);
            return Ok(updated);
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

            var existing = await _usersRepository.GetByEmail(users.Email);

            if (existing != null)
            {
                return Conflict(new { message = "El email ya está registrado" });
            }

            users.Password = HashPassword(users.Password);
            var created = await _usersRepository.InsertUsers(users);

            if (!created)
            {
                return StatusCode(500, new { message = "Error al registrar el usuario" });
            }

            return Ok(new { message = "Usuario registrado correctamente" });
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

            // Try to find user by email or username
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

        // Helper class for login request
        public class LoginRequest
        {
            public string? Username { get; set; }
            public string? Email { get; set; }
            public string? Password { get; set; }
        }

        // --------------------------  HASH  ----------------------------
        private string HashPassword(string password)
        {
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
