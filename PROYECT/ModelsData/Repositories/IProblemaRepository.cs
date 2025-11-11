using DorjaModelado;
using System;
using System.Collections.Generic;
using System.Text;

namespace DorjaData.Repositories
{
    public interface IProblemaRepository
    {
        Task<IEnumerable<Problema>> GetAllProblemas();
        Task<Problema> GetDetails(int id);
        Task<bool> InsertProblemas(Problema problema);
        Task<bool> UpdateProblemas(Problema problema);
        Task<bool> DeleteProblemas(Problema problema);
    }
}
