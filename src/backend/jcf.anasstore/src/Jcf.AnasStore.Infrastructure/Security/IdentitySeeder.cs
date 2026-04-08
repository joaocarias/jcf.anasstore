using Jcf.AnasStore.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace Jcf.AnasStore.Infrastructure.Security;

public sealed class IdentitySeeder(
    UserManager<AppUser> userManager,
    RoleManager<AppRole> roleManager,
    IConfiguration configuration)
{
    public const string AdminRoleName = "Admin";
    public const string BasicRoleName = "Basic";
    public const string SellerRoleName = "Seller";
    public const string ManagerRoleName = "Manager";
    public const string AuditorRoleName = "Auditor";

    private static readonly string[] BasicRoles =
    [
        AdminRoleName,
        BasicRoleName,
        SellerRoleName,
        ManagerRoleName,
        AuditorRoleName
    ];

    private readonly SeedUser? defaultAdmin = configuration.GetSection("Seed:DefaultAdmin").Get<SeedUser>();
    private readonly List<SeedUser> defaultUsers =
        configuration.GetSection("Seed:DefaultUsers").Get<List<SeedUser>>() ?? [];

    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        foreach (var roleName in BasicRoles)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            await roleManager.CreateAsync(new AppRole { Name = roleName });
        }

        if (defaultAdmin is null && defaultUsers.Count == 0)
        {
            throw new InvalidOperationException("Seed default users enabled, but no users are configured.");
        }

        if (defaultAdmin is not null)
        {
            var adminRole = string.IsNullOrWhiteSpace(defaultAdmin.RoleName)
                ? AdminRoleName
                : defaultAdmin.RoleName;
            await SeedUserAsync(defaultAdmin.Name, defaultAdmin.Email, defaultAdmin.Password, adminRole);
        }

        foreach (var defaultUser in defaultUsers)
        {
            await SeedUserAsync(defaultUser.Name, defaultUser.Email, defaultUser.Password, defaultUser.RoleName);
        }
    }

    private async Task SeedUserAsync(string name, string email, string password, string roleName)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new AppUser
            {
                Name = name,
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(user, password);
            if (!createResult.Succeeded)
            {
                var errors = string.Join("; ", createResult.Errors.Select(x => x.Description));
                throw new InvalidOperationException($"Failed to seed user '{email}': {errors}");
            }
        }

        if (!await userManager.IsInRoleAsync(user, roleName))
        {
            await userManager.AddToRoleAsync(user, roleName);
        }

        if (!string.Equals(user.Name, name, StringComparison.Ordinal))
        {
            user.Name = name;
            await userManager.UpdateAsync(user);
        }
    }

    private sealed record SeedUser(string Name, string Email, string Password, string RoleName);
}
