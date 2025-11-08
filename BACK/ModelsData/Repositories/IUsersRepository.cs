using System;
using System.Collections.Generic;
using System.Text;

namespace DorjaModelado.Repositories
{
    public interface IUserRepository
    {
        Task<IEnumerable<Users>> GetAllUsers();
        Task<Users> GetDetails(int id);
        Task<bool> InsertUsers(Users usuario);
        Task<bool> UpdateUsuarios(Users usuario);
        Task<bool> DeleteUsuarios(Users usuario);
    }
}
