using DorjaData.Repositories;
using DorjaModelado;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using RouteAttribute = Microsoft.AspNetCore.Mvc.RouteAttribute;

namespace BACK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProblemasController: ControllerBase
    {
        private readonly IProblemaRepository _problemaRepository;

        public ProblemasController(IProblemaRepository nivelesRepository)
        {
            _problemaRepository = nivelesRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllProblems() 
        {

            return Ok(await _problemaRepository.GetAllProblemas());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetails(int id) 
        { 
            return Ok(await _problemaRepository.GetDetails(id));
        }

        [HttpPost]
        public async Task<IActionResult> CreateProblema([FromBody] Problema problema)
        {
            if(problema == null)
            {
                return BadRequest();
            }
            if (!ModelState.IsValid) 
            {
                return BadRequest(ModelState);
            }

            var created = await _problemaRepository.InsertProblemas(problema);
            if (!created)
            {
                return StatusCode(500, new { message = "Error al crear el problema" });
            }
            return Created("created", problema); 
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProblemas([FromBody] Problema problema)
        {
            if (problema == null)
            {
                return BadRequest();
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            await _problemaRepository.UpdateProblemas(problema);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProblema(int id)
        {
            var temasToDelete = await _problemaRepository.GetDetails(id);
            if (temasToDelete == null)
            {
                return NotFound();
            }
            await _problemaRepository.DeleteProblemas(new Problema { Id = id });
            return NoContent();
        }
    }
}
