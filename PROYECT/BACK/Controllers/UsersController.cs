using Microsoft.AspNetCore.Mvc;
using DorjaModelado.Repositories;
using DorjaModelado;
using System.Threading.Tasks;

namespace BACK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // GET api/users
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetAllUsers();
            return Ok(users);
        }

        // GET api/users/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetDetails(int id)
        {
            var user = await _userRepository.GetDetails(id);
            if (user == null)
                return NotFound(new { message = "Usuario no encontrado." });

            return Ok(user);
        }

        // POST api/users
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] Users usuario)
        {
            if (usuario == null)
                return BadRequest(new { message = "Datos inválidos." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _userRepository.InsertUsers(usuario);

            return CreatedAtAction(nameof(GetDetails), new { id = created.Id }, created);
        }

        // PUT api/users/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] Users usuario)
        {
            if (usuario == null || usuario.Id != id)
                return BadRequest(new { message = "Los datos del usuario no coinciden." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = await _userRepository.GetDetails(id);
            if (existing == null)
                return NotFound(new { message = "Usuario no encontrado." });

            var updated = await _userRepository.UpdateUsuarios(usuario);
            return Ok(updated);
        }

        // DELETE api/users/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var existing = await _userRepository.GetDetails(id);
            if (existing == null)
                return NotFound(new { message = "Usuario no encontrado." });

            await _userRepository.DeleteUsuarios(existing);
            return NoContent();
        }
    }
}
