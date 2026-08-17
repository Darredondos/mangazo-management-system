using Microsoft.EntityFrameworkCore;
using Mangazo.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =========================================================
// JWT CONFIGURATION
// =========================================================

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key no configurado."
    );

var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "Jwt:Issuer no configurado."
    );

var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "Jwt:Audience no configurado."
    );

// =========================================================
// DATABASE
// =========================================================

builder.Services.AddDbContext<MangazoDbContext>(
    options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString(
                "MangazoConnection"
            )
        )
);

// =========================================================
// CORS
// =========================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "MangazoWeb",
        policy =>
        {
            policy
                .WithOrigins(
                    "https://mangazo-management-system.vercel.app",
                    "http://localhost:3000"
                )
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    );
});

// =========================================================
// AUTHENTICATION
// =========================================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,

                ValidateAudience = true,
                ValidAudience = jwtAudience,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtKey
                        )
                    ),

                ClockSkew =
                    TimeSpan.FromMinutes(1)
            };
    });

builder.Services.AddAuthorization();

// =========================================================
// CONTROLLERS / OPENAPI
// =========================================================

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// =========================================================
// BUILD APP
// =========================================================

var app = builder.Build();

// =========================================================
// DEVELOPMENT
// =========================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// =========================================================
// HTTP PIPELINE
// =========================================================

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("MangazoWeb");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();