using Jcf.AnasStore.Application.Abstractions.Security;
using Jcf.AnasStore.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace Jcf.AnasStore.Infrastructure.Security;

public sealed class IdentityService(UserManager<AppUser> userManager) : IIdentityService
{
    public async Task<AuthenticatedUser?> ValidateCredentialsAsync(string email, string password, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return null;
        }

        var isPasswordValid = await userManager.CheckPasswordAsync(user, password);
        if (!isPasswordValid)
        {
            return null;
        }

        var roles = (await userManager.GetRolesAsync(user)).ToList();
        return new AuthenticatedUser(user.Id, user.Email ?? email, roles);
    }
}
