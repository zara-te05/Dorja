var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Habilita el uso de archivos estáticos desde wwwroot
app.UseStaticFiles();

// Redirige cualquier ruta no encontrada a index.html (ideal para SPA)
app.MapFallbackToFile("home.html");

app.Run();