using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using DorjaModelado.Repositories;
using DorjaModelado;


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
            if(usuario == null)
            {
                return BadRequest();
            }

            if(!ModelState.IsValid)
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
            await _usersRepository.DeleteUsuarios(new Users { IdUsario = id});

            return NoContent();
        }
    }
}
