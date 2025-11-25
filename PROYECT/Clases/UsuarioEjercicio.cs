using System;

namespace DorjaModelado
{
    public class UsuarioEjercicio
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ProblemaId { get; set; }
        public DateTime FechaAsignado { get; set; }
        public bool Completado { get; set; } = false;
        public DateTime? FechaCompletado { get; set; }
        public int Intentos { get; set; } = 0;
        public int? TiempoResolucion { get; set; } // in seconds
    }
}
