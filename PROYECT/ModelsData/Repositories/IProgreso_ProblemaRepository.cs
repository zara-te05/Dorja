using DorjaModelado;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DorjaData.Repositories
{
    public interface IProgreso_ProblemaRepository
    {
        Task<IEnumerable<Progreso_Problema>> GetAllProgreso_Problemas();
        Task<Progreso_Problema> GetDetails(int id);
        Task<bool> InsertProgreso_Problemas(Progreso_Problema progreso_problema);
        Task<bool> UpdateProgreso_Problemas(Progreso_Problema progreso_problema);
        Task<bool> DeleteProgreso_Problemas(int id);
    }
}
