using Jcf.AnasStore.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace Jcf.AnasStore.Infrastructure.Security;

public sealed class IdentitySeeder(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager)
{
    public const string DefaultAdminEmail = "admin@anasstore.com";
    public const string DefaultAdminPassword = "Admin@123";
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

    private static readonly SeedUser[] DefaultUsers =
    [
        new("Usuário Básico", "basic@anasstore.com.br", "Basic@123", BasicRoleName),
        new("Usuário Vendedor", "seller@anasstore.com.br", "Seller@123", SellerRoleName),
        new("Usuário Gerente", "manager@anasstore.com.br", "Manager@123", ManagerRoleName)
    ];

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

        await SeedUserAsync("Administrador", DefaultAdminEmail, DefaultAdminPassword, AdminRoleName);

        foreach (var defaultUser in DefaultUsers)
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
