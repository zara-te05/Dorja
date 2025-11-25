using DorjaModelado;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DorjaData.Repositories
{
    public interface IUsuarioEjercicioRepository
    {
        Task<IEnumerable<UsuarioEjercicio>> GetAllUsuarioEjercicios();
        Task<UsuarioEjercicio> GetDetails(int id);
        Task<UsuarioEjercicio> GetByUserAndProblema(int userId, int problemaId);
        Task<IEnumerable<UsuarioEjercicio>> GetByUserId(int userId);
        Task<IEnumerable<int>> GetAssignedProblemaIds(int userId);
        Task<bool> InsertUsuarioEjercicio(UsuarioEjercicio usuarioEjercicio);
        Task<bool> UpdateUsuarioEjercicio(UsuarioEjercicio usuarioEjercicio);
        Task<bool> DeleteUsuarioEjercicio(int id);
    }
}
