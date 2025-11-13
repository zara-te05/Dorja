using DorjaData;
using DorjaData.Repositories;
using DorjaModelado.Repositories;

var builder = WebApplication.CreateBuilder(args);

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins, policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


// REGISTRAR CONFIGURACIÓN MYSQL
builder.Services.AddSingleton(new MySQLConfiguration(
    builder.Configuration.GetConnectionString("DorjaConnection")
));


// REGISTRAR REPOSITORIO
builder.Services.AddScoped<IUserRepository, UsersRepository>();
builder.Services.AddScoped<INivelesRepository, NivelesRepository>();
builder.Services.AddScoped<ITemasRepository, TemasRepository>();
builder.Services.AddScoped<IProblemaRepository, ProblemaRepository>();
builder.Services.AddScoped<IProgreso_ProblemaRepository, Progreso_ProblemaRepository>();
builder.Services.AddScoped<ILogrosRepository, LogrosRepository>();
builder.Services.AddScoped<ILogros_UsuarioRepository, Logros_UsuarioRepository>();
builder.Services.AddScoped<ICertificadosRepository, CertificadoRepository>();

var app = builder.Build();

app.UseCors(MyAllowSpecificOrigins);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();

app.Run();
