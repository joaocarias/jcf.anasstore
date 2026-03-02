using System.Text;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Application.Abstractions.Security;
using Jcf.AnasStore.Application.Features.Auth.Login;
using Jcf.AnasStore.Application.Features.Roles.Common;
using Jcf.AnasStore.Application.Features.Roles.GetAllRoles;
using Jcf.AnasStore.Application.Features.Roles.GetRoleById;
using Jcf.AnasStore.Application.Features.Sales.Common;
using Jcf.AnasStore.Application.Features.Sales.CreateSale;
using Jcf.AnasStore.Application.Features.Sales.GetRecentSales;
using Jcf.AnasStore.Infrastructure.Cqrs;
using Jcf.AnasStore.Infrastructure.Data;
using Jcf.AnasStore.Infrastructure.Identity;
using Jcf.AnasStore.Infrastructure.Persistence;
using Jcf.AnasStore.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Jcf.AnasStore.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

        services.AddIdentityCore<AppUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<AppRole>()
            .AddEntityFrameworkStores<AppDbContext>();

        var jwtSection = configuration.GetSection(JwtSettings.SectionName);
        services.Configure<JwtSettings>(jwtSection);
        var jwt = jwtSection.Get<JwtSettings>() ?? throw new InvalidOperationException("JwtSettings section is invalid.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });

        services.AddAuthorization();

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<ISalesReadRepository>(_ => new SalesReadRepository(connectionString));
        services.AddScoped<IRolesReadRepository>(_ => new RolesReadRepository(connectionString));
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IdentitySeeder>();
        services.AddScoped<GenreSeeder>();
        services.AddScoped<ItemSizeSeeder>();
        services.AddScoped<ColorSeeder>();

        services.AddScoped<ICommandDispatcher, CommandDispatcher>();
        services.AddScoped<IQueryDispatcher, QueryDispatcher>();
        services.AddScoped<ICommandHandler<LoginCommand, LoginResult>, LoginCommandHandler>();
        services.AddScoped<ICommandHandler<CreateSaleCommand, Guid>, CreateSaleCommandHandler>();
        services.AddScoped<IQueryHandler<GetAllRolesQuery, IReadOnlyList<RoleDto>>, GetAllRolesQueryHandler>();
        services.AddScoped<IQueryHandler<GetRoleByIdQuery, RoleDto?>, GetRoleByIdQueryHandler>();
        services.AddScoped<IQueryHandler<GetRecentSalesQuery, IReadOnlyList<SaleSummaryDto>>, GetRecentSalesQueryHandler>();

        return services;
    }
}
