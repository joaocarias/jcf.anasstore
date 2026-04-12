using Jcf.AnasStore.Application;
using Jcf.AnasStore.Application.Abstractions.Security;
using Jcf.AnasStore.Infrastructure;
using Jcf.AnasStore.Infrastructure.Persistence;
using Jcf.AnasStore.Infrastructure.Security;
using Jcf.AnasStore.Api.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.Configure<PasswordResetOptions>(
    builder.Configuration.GetSection(PasswordResetOptions.SectionName));
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var bearerScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Informe apenas o token JWT. Exemplo: eyJhbGciOi..."
    };

    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Ana's Store API",
        Version = "v1",
        Description = "API do sistema de controle de vendas da Ana's Store."
    });

    options.AddSecurityDefinition("Bearer", bearerScheme);
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", document, externalResource: null), [] }
    });

    var xmlFile = $"{typeof(Program).Assembly.GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
    }
});

var app = builder.Build();

await ApplyMigrationsAndSeedAsync(app);

if (app.Environment.IsProduction())
{
    var jwt = app.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
    if (jwt is null || string.IsNullOrWhiteSpace(jwt.SigningKey) || jwt.SigningKey.Equals("CHANGE_ME", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("JwtSettings:SigningKey must be configured with a secure value in production.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => Results.Ok(new { message = "Ana's Store API is running." })).AllowAnonymous();

await app.RunAsync();

static async Task ApplyMigrationsAndSeedAsync(WebApplication app)
{
    var configuration = app.Configuration;
    var isDevelopment = app.Environment.IsDevelopment();
    var autoMigrate = isDevelopment || configuration.GetValue("Database:AutoMigrate", false);
    var seedLookups = isDevelopment || configuration.GetValue("Seed:EnableLookupSeed", false);
    var seedDefaultUsers = isDevelopment && configuration.GetValue("Seed:EnableDefaultUsers", false);

    if (!autoMigrate && !seedLookups && !seedDefaultUsers)
    {
        return;
    }

    await using var scope = app.Services.CreateAsyncScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (autoMigrate)
    {
        await dbContext.Database.MigrateAsync();
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            drop index if exists "IX_product_variations_code";
            drop index if exists "IX_product_variations_product_id_color_id_item_size_id";
            """);
    }

    if (seedDefaultUsers)
    {
        var identitySeeder = scope.ServiceProvider.GetRequiredService<IdentitySeeder>();
        await identitySeeder.SeedAsync(CancellationToken.None);
    }

    if (seedLookups)
    {
        var genreSeeder = scope.ServiceProvider.GetRequiredService<GenreSeeder>();
        await genreSeeder.SeedAsync(CancellationToken.None);

        var itemSizeSeeder = scope.ServiceProvider.GetRequiredService<ItemSizeSeeder>();
        await itemSizeSeeder.SeedAsync(CancellationToken.None);

        var colorSeeder = scope.ServiceProvider.GetRequiredService<ColorSeeder>();
        await colorSeeder.SeedAsync(CancellationToken.None);
    }
}

