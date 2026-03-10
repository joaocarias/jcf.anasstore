using System.Text;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Application.Abstractions.Security;
using Jcf.AnasStore.Application.Features.Auth.Login;
using Jcf.AnasStore.Application.Features.PaymentMethods.Common;
using Jcf.AnasStore.Application.Features.PaymentMethods.CreatePaymentMethod;
using Jcf.AnasStore.Application.Features.PaymentMethods.DeletePaymentMethod;
using Jcf.AnasStore.Application.Features.PaymentMethods.GetPaymentMethodById;
using Jcf.AnasStore.Application.Features.PaymentMethods.GetPaymentMethods;
using Jcf.AnasStore.Application.Features.PaymentMethods.UpdatePaymentMethod;
using Jcf.AnasStore.Application.Features.Products.Common;
using Jcf.AnasStore.Application.Features.Products.GetProductById;
using Jcf.AnasStore.Application.Features.Products.GetProducts;
using Jcf.AnasStore.Application.Features.ProductVariations.Common;
using Jcf.AnasStore.Application.Features.ProductVariations.GetProductVariationById;
using Jcf.AnasStore.Application.Features.ProductVariations.GetProductVariations;
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
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;

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

                options.Events = new JwtBearerEvents
                {
                    OnForbidden = async context =>
                    {
                        if (context.Response.HasStarted)
                        {
                            return;
                        }

                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        var payload = JsonSerializer.Serialize(new { message = "Você não possui acesso para realizar esta ação." });
                        await context.Response.WriteAsync(payload);
                    },
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        if (context.Response.HasStarted)
                        {
                            return;
                        }

                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";
                        var payload = JsonSerializer.Serialize(new { message = "Usuário não autenticado." });
                        await context.Response.WriteAsync(payload);
                    }
                };
            });

        services.AddAuthorization();

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<IPaymentMethodsRepository, PaymentMethodsRepository>();
        services.AddScoped<ISalesReadRepository>(_ => new SalesReadRepository(connectionString));
        services.AddScoped<IRolesReadRepository>(_ => new RolesReadRepository(connectionString));
        services.AddScoped<IProductsReadRepository>(_ => new ProductsReadRepository(connectionString));
        services.AddScoped<IProductVariationsReadRepository>(_ => new ProductVariationsReadRepository(connectionString));
        services.AddScoped<IPaymentMethodsReadRepository>(_ => new PaymentMethodsReadRepository(connectionString));
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
        services.AddScoped<ICommandHandler<CreatePaymentMethodCommand, PaymentMethodReadDto>, CreatePaymentMethodCommandHandler>();
        services.AddScoped<ICommandHandler<UpdatePaymentMethodCommand, PaymentMethodReadDto?>, UpdatePaymentMethodCommandHandler>();
        services.AddScoped<ICommandHandler<DeletePaymentMethodCommand, bool>, DeletePaymentMethodCommandHandler>();
        services.AddScoped<IQueryHandler<GetAllRolesQuery, IReadOnlyList<RoleDto>>, GetAllRolesQueryHandler>();
        services.AddScoped<IQueryHandler<GetRoleByIdQuery, RoleDto?>, GetRoleByIdQueryHandler>();
        services.AddScoped<IQueryHandler<GetRecentSalesQuery, IReadOnlyList<SaleSummaryDto>>, GetRecentSalesQueryHandler>();
        services.AddScoped<IQueryHandler<GetProductsQuery, PagedReadResult<ProductReadDto>>, GetProductsQueryHandler>();
        services.AddScoped<IQueryHandler<GetProductByIdQuery, ProductReadDto?>, GetProductByIdQueryHandler>();
        services.AddScoped<IQueryHandler<GetProductVariationsQuery, PagedReadResult<ProductVariationReadDto>>, GetProductVariationsQueryHandler>();
        services.AddScoped<IQueryHandler<GetProductVariationByIdQuery, ProductVariationReadDto?>, GetProductVariationByIdQueryHandler>();
        services.AddScoped<IQueryHandler<GetPaymentMethodsQuery, PagedReadResult<PaymentMethodReadDto>>, GetPaymentMethodsQueryHandler>();
        services.AddScoped<IQueryHandler<GetPaymentMethodByIdQuery, PaymentMethodReadDto?>, GetPaymentMethodByIdQueryHandler>();

        return services;
    }
}
