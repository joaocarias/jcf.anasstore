using System.Text;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Services.Labels;
using Jcf.AnasStore.Application.Abstractions.Notifications;
using Jcf.AnasStore.Application.Abstractions.Persistence;
using Jcf.AnasStore.Application.Abstractions.Security;
using Jcf.AnasStore.Application.Features.Auth.Login;
using Jcf.AnasStore.Application.Features.Dashboard.Common;
using Jcf.AnasStore.Application.Features.Dashboard.GetDashboardSummary;
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
using Jcf.AnasStore.Application.Features.Sales.GetSaleById;
using Jcf.AnasStore.Application.Features.Sales.GetSalesHistory;
using Jcf.AnasStore.Application.Features.Sales.GetRecentSales;
using Jcf.AnasStore.Infrastructure.Cqrs;
using Jcf.AnasStore.Infrastructure.Data;
using Jcf.AnasStore.Infrastructure.Email;
using Jcf.AnasStore.Infrastructure.Identity;
using Jcf.AnasStore.Infrastructure.Persistence;
using Jcf.AnasStore.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Resend;
using System.Text.Json;

namespace Jcf.AnasStore.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

        services.AddOptions();

        services.AddIdentityCore<AppUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
            })
            .AddRoles<AppRole>()
            .AddTokenProvider<DataProtectorTokenProvider<AppUser>>(TokenOptions.DefaultProvider)
            .AddEntityFrameworkStores<AppDbContext>();

        var jwtSection = configuration.GetSection(JwtSettings.SectionName);
        services.Configure<JwtSettings>(jwtSection);
        var jwt = jwtSection.Get<JwtSettings>() ?? throw new InvalidOperationException("JwtSettings section is invalid.");
        if (string.IsNullOrWhiteSpace(jwt.SigningKey))
        {
            throw new InvalidOperationException("JwtSettings:SigningKey must be configured.");
        }

        if (string.Equals(jwt.SigningKey, "CHANGE_ME", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(jwt.SigningKey, "super-secret-key-for-local-development-only-change-me", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("JwtSettings:SigningKey must be replaced with a secure value.");
        }

        if (Encoding.UTF8.GetByteCount(jwt.SigningKey) < 32)
        {
            throw new InvalidOperationException("JwtSettings:SigningKey must be at least 32 bytes for HS256.");
        }

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
                        var payload = JsonSerializer.Serialize(new { message = "Voce nao possui acesso para realizar esta acao." });
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
                        var payload = JsonSerializer.Serialize(new { message = "Usuario nao autenticado." });
                        await context.Response.WriteAsync(payload);
                    }
                };
            });

        services.AddAuthorization();

        ConfigureResend(services, configuration);

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<ILabelService, LabelService>();
        services.AddScoped<ISalesRepository, SalesRepository>();
        services.AddScoped<IPaymentMethodsRepository, PaymentMethodsRepository>();
        services.AddScoped<ISalesReadRepository>(_ => new SalesReadRepository(connectionString));
        services.AddScoped<IReportsReadRepository>(_ => new ReportsReadRepository(connectionString));
        services.AddScoped<IRolesReadRepository>(_ => new RolesReadRepository(connectionString));
        services.AddScoped<IProductsReadRepository>(_ => new ProductsReadRepository(connectionString));
        services.AddScoped<IProductVariationsReadRepository>(_ => new ProductVariationsReadRepository(connectionString));
        services.AddScoped<IPaymentMethodsReadRepository>(_ => new PaymentMethodsReadRepository(connectionString));
        services.AddScoped<IDashboardReadRepository>(_ => new DashboardReadRepository(connectionString));
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
        services.AddScoped<IQueryHandler<GetSaleByIdQuery, SaleDetailDto?>, GetSaleByIdQueryHandler>();
        services.AddScoped<IQueryHandler<GetSalesHistoryQuery, PagedReadResult<SaleSummaryDto>>, GetSalesHistoryQueryHandler>();
        services.AddScoped<IQueryHandler<GetProductsQuery, PagedReadResult<ProductReadDto>>, GetProductsQueryHandler>();
        services.AddScoped<IQueryHandler<GetProductByIdQuery, ProductReadDto?>, GetProductByIdQueryHandler>();
        services.AddScoped<IQueryHandler<GetProductVariationsQuery, PagedReadResult<ProductVariationReadDto>>, GetProductVariationsQueryHandler>();
        services.AddScoped<IQueryHandler<GetProductVariationByIdQuery, ProductVariationReadDto?>, GetProductVariationByIdQueryHandler>();
        services.AddScoped<IQueryHandler<GetPaymentMethodsQuery, PagedReadResult<PaymentMethodReadDto>>, GetPaymentMethodsQueryHandler>();
        services.AddScoped<IQueryHandler<GetPaymentMethodByIdQuery, PaymentMethodReadDto?>, GetPaymentMethodByIdQueryHandler>();
        services.AddScoped<IQueryHandler<GetDashboardSummaryQuery, DashboardSummaryDto>, GetDashboardSummaryQueryHandler>();

        return services;
    }

    private static void ConfigureResend(IServiceCollection services, IConfiguration configuration)
    {
        var resendSection = configuration.GetSection(ResendEmailOptions.SectionName);
        var resendOptions = resendSection.Get<ResendEmailOptions>() ?? new ResendEmailOptions();
        var apiToken = resendOptions.ApiToken ?? Environment.GetEnvironmentVariable("RESEND_APITOKEN");

        if (string.IsNullOrWhiteSpace(apiToken))
        {
            // Resend é opcional - registrar um serviço nulo para desenvolvimento
            services.Configure<ResendEmailOptions>(resendSection);
            services.AddScoped<IEmailSender, NullEmailSender>();
            return;
        }

        services.Configure<ResendEmailOptions>(resendSection);
        services.Configure<ResendClientOptions>(options => options.ApiToken = apiToken);
        services.AddHttpClient<ResendClient>();
        services.AddTransient<IResend, ResendClient>();
        services.AddScoped<IEmailSender, ResendEmailSender>();
    }
}
