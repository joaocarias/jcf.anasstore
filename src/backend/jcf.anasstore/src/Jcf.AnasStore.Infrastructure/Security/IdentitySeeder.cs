using Jcf.AnasStore.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace Jcf.AnasStore.Infrastructure.Security;

public sealed class IdentitySeeder(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager)
{
    public const string DefaultAdminEmail = "admin@anasstore.com";
    public const string DefaultAdminPassword = "Admin@123";
    public const string AdminRoleName = "Admin";

    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        if (!await roleManager.RoleExistsAsync(AdminRoleName))
        {
            await roleManager.CreateAsync(new AppRole { Name = AdminRoleName });
        }

        var existingUser = await userManager.FindByEmailAsync(DefaultAdminEmail);
        if (existingUser is not null)
        {
            return;
        }

        var user = new AppUser
        {
            UserName = DefaultAdminEmail,
            Email = DefaultAdminEmail,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, DefaultAdminPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(x => x.Description));
            throw new InvalidOperationException($"Failed to seed default admin user: {errors}");
        }

        await userManager.AddToRoleAsync(user, AdminRoleName);
    }
}
