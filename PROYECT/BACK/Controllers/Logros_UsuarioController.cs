using DorjaData.Repositories;
using DorjaModelado;
using Microsoft.AspNetCore.Mvc;

namespace BACK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class Logros_UsuarioController : ControllerBase
    {
        private readonly ILogros_UsuarioRepository  _logros_UsuarioRepository;

        public Logros_UsuarioController(ILogros_UsuarioRepository logros_UsuarioRepository)
        {
            _logros_UsuarioRepository = logros_UsuarioRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllLogros_Usuario()
        {
            return Ok(await _logros_UsuarioRepository.GetAllLogrosUsuario());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetails(int id)
        {
            return Ok(await _logros_UsuarioRepository.GetDetails(id));
        }

        [HttpPost]
        public async Task<IActionResult> CreateNiveles([FromBody] Logros_Usuario logros_usuario)
        {
            if (logros_usuario == null)
            {
                return BadRequest();
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var created = await _logros_UsuarioRepository.InsertLogrosUsuario(logros_usuario);
            return Created("created", created);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateNiveles([FromBody] Logros_Usuario logros_Usuario)
        {
            if (logros_Usuario == null)
            {
                return BadRequest();
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            await _logros_UsuarioRepository.UpdateLogrosUsuario(logros_Usuario);
            return NoContent();
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteNiveles(int id)
        {
            await _logros_UsuarioRepository.DeleteLogrosUsuario(new Logros_Usuario { id = id });
            return NoContent();
        }
    }
}
