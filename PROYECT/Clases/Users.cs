using System;
using System.Collections.Generic;
using System.Text;

namespace DorjaModelado
{
    public class Users
    {
        public int IdUsario { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string ApellidoPaterno { get; set; } = string.Empty;
        public string ApellidoMaterno { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FotoPerfil { get; set; } = string.Empty;
        public string FotoBanner { get; set; } = string.Empty;

        public DateTime FechaRegistro { get; set; }
        public DateTime UltimaConexion { get; set; }

        public int PuntosTotales { get; set; }
        public int NivelActual { get; set; }

    }
}
