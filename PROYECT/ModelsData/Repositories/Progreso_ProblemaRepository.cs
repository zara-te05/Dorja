using DorjaModelado;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DorjaData.Repositories
{
    public class Progreso_ProblemaRepository : IProgreso_ProblemaRepository
    {
        public Task<IEnumerable<Progreso_Problema>> GetAllProgreso_Problemas()
        {
            throw new NotImplementedException();
        }

        public Task<Progreso_Problema> GetDetails(int id)
        {
            throw new NotImplementedException();
        }

        public Task<bool> InsertProgreso_Problemas(Progreso_Problema progreso_problema)
        {
            throw new NotImplementedException();
        }

        public Task<bool> UpdateProgreso_Problemas(Progreso_Problema progreso_problema)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteProgreso_Problemas(int id)
        {
            throw new NotImplementedException();
        }
    }
}
