using DorjaData;
using DorjaModelado.Repositories;
using MySql.Data.MySqlClient;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Politica del CORS
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:5173") // URL del frontend
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

// Agrega servicios necesarios para Web API
builder.Services.AddControllers();
builder.Services.AddOpenApi(); //Swagger

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

//var mySQLConfiguration = new MySQLConfiguration(builder.Configuration.GetConnectionString("DorjaConnection"));
//builder.Services.AddSingleton(mySQLConfiguration);

builder.Services.AddSingleton(new MySqlConnection(builder.Configuration.GetConnectionString("DorjaConnection")));

builder.Services.AddScoped<IUserRepository, IUserRepository>();




var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
