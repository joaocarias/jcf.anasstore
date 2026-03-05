using Jcf.AnasStore.Api.Contracts.Auth;
using Jcf.AnasStore.Application.Abstractions.Security;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Auth.Login;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class AuthController(
    ICommandDispatcher commandDispatcher,
    IIdentityService identityService,
    ITokenService tokenService) : ControllerBase
{
    /// <summary>
    /// Realiza login e retorna um token JWT válido para autorização nos demais endpoints.
    /// </summary>
    /// <param name="request">Credenciais de acesso do usuário.</param>
    /// <param name="cancellationToken">Token de cancelamento da requisição.</param>
    /// <returns>Dados de autenticação com token JWT.</returns>
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await commandDispatcher.SendAsync<LoginCommand, LoginResult>(
            new LoginCommand(request.Email, request.Password),
            cancellationToken);

        if (!result.Success)
        {
            return Unauthorized(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Renova o access token utilizando um refresh token vÃ¡lido.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return Unauthorized(LoginResult.Fail("Invalid refresh token."));
        }

        var user = await identityService.GetUserByRefreshTokenAsync(request.RefreshToken, cancellationToken);
        if (user is null)
        {
            return Unauthorized(LoginResult.Fail("Invalid refresh token."));
        }

        await identityService.RevokeRefreshTokenAsync(request.RefreshToken, cancellationToken);

        var newRefreshToken = tokenService.GenerateRefreshToken();
        await identityService.SaveRefreshTokenAsync(user.UserId, newRefreshToken, cancellationToken);

        var accessToken = tokenService.GenerateAccessToken(user);
        return Ok(LoginResult.Ok(accessToken, newRefreshToken));
    }
}
