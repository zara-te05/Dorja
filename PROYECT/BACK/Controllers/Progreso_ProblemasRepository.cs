using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using DorjaData.Repositories;
using DorjaModelado;

namespace BACK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProgresoProblemasController : ControllerBase
    {
        private readonly IProgreso_ProblemaRepository _progresoProblemaRepository;

        public ProgresoProblemasController(IProgreso_ProblemaRepository progresoProblemaRepository)
        {
            _progresoProblemaRepository = progresoProblemaRepository;
        }

        // GET: api/ProgresoProblemas
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var progresos = await _progresoProblemaRepository.GetAllProgreso_Problemas();
            return Ok(progresos);
        }

        // GET: api/ProgresoProblemas/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetails(int id)
        {
            var progreso = await _progresoProblemaRepository.GetDetails(id);
            if (progreso == null)
                return NotFound();

            return Ok(progreso);
        }

        // POST: api/ProgresoProblemas
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Progreso_Problema progresoProblema)
        {
            if (progresoProblema == null)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _progresoProblemaRepository.InsertProgreso_Problemas(progresoProblema);
            if (!created)
                return StatusCode(500, "Error al crear el registro.");

            return CreatedAtAction(nameof(GetDetails), new { id = progresoProblema.Id }, progresoProblema);
        }

        // PUT: api/ProgresoProblemas
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Progreso_Problema progresoProblema)
        {
            if (progresoProblema == null)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _progresoProblemaRepository.UpdateProgreso_Problemas(progresoProblema);
            if (!updated)
                return StatusCode(500, "Error al actualizar el registro.");

            return NoContent();
        }

        // DELETE: api/ProgresoProblemas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var progreso = await _progresoProblemaRepository.GetDetails(id);
            if (progreso == null)
                return NotFound();

            var deleted = await _progresoProblemaRepository.DeleteProgreso_Problemas(id);
            if (!deleted)
                return StatusCode(500, "Error al eliminar el registro.");

            return NoContent();
        }
    }
}
