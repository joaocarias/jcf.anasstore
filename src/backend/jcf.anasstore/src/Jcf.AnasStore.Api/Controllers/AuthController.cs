using Jcf.AnasStore.Api.Contracts.Auth;
using Jcf.AnasStore.Api.Options;
using Jcf.AnasStore.Application.Abstractions.Notifications;
using Jcf.AnasStore.Application.Abstractions.Security;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Features.Auth.Login;
using Jcf.AnasStore.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Net;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class AuthController(
    ICommandDispatcher commandDispatcher,
    IIdentityService identityService,
    ITokenService tokenService,
    UserManager<AppUser> userManager,
    IEmailSender emailSender,
    IOptions<PasswordResetOptions> resetOptions) : ControllerBase
{
    private readonly PasswordResetOptions _resetOptions = resetOptions.Value ?? new PasswordResetOptions();

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
    /// Renova o access token utilizando um refresh token válido.
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

    /// <summary>
    /// Sends a temporary password with a link to change it.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("request-password-reset")]
    [ProducesResponseType(typeof(RequestPasswordResetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RequestPasswordReset(
        [FromBody] RequestPasswordResetRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email e obrigatorio." });
        }

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
        {
            return Ok(new RequestPasswordResetResponse(
                "Se o email existir, enviaremos uma senha temporaria para voce."));
        }

        var temporaryPassword = GenerateTemporaryPassword();
        var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await userManager.ResetPasswordAsync(user, resetToken, temporaryPassword);
        if (!resetResult.Succeeded)
        {
            return BadRequest(new { errors = resetResult.Errors.Select(x => x.Description).ToArray() });
        }

        var resetLink = BuildResetLink(user.Email);
        var htmlBody = $"""
            <p>Ola, {WebUtility.HtmlEncode(user.Name)}.</p>
            <p>Sua senha temporaria: <strong>{WebUtility.HtmlEncode(temporaryPassword)}</strong></p>
            <p>Para trocar sua senha, acesse o link abaixo:</p>
            <p><a href="{WebUtility.HtmlEncode(resetLink)}">Trocar senha</a></p>
            <p>Se voce nao solicitou essa alteracao, ignore este email.</p>
            """;

        await emailSender.SendAsync(
            new EmailRequest(
                user.Email ?? request.Email,
                "Reset de senha",
                htmlBody),
            cancellationToken);

        user.UpdateAt = DateTime.UtcNow;
        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { errors = updateResult.Errors.Select(x => x.Description).ToArray() });
        }

        return Ok(new RequestPasswordResetResponse(
            "Se o email existir, enviaremos uma senha temporaria para voce."));
    }

    /// <summary>
    /// Confirms password reset using a temporary password.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("confirm-password-reset")]
    [ProducesResponseType(typeof(ConfirmPasswordResetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmPasswordReset(
        [FromBody] ConfirmPasswordResetRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.TemporaryPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "Email, senha temporaria e nova senha sao obrigatorios." });
        }

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
        {
            return BadRequest(new { message = "Usuario nao encontrado." });
        }

        var isTempValid = await userManager.CheckPasswordAsync(user, request.TemporaryPassword);
        if (!isTempValid)
        {
            return BadRequest(new { message = "Senha temporaria invalida." });
        }

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);
        if (!resetResult.Succeeded)
        {
            return BadRequest(new { errors = resetResult.Errors.Select(x => x.Description).ToArray() });
        }

        user.UpdateAt = DateTime.UtcNow;
        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { errors = updateResult.Errors.Select(x => x.Description).ToArray() });
        }

        return Ok(new ConfirmPasswordResetResponse("Senha atualizada com sucesso."));
    }

    private string BuildResetLink(string email)
    {
        var baseUrl = _resetOptions.BaseUrl;
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            baseUrl = $"{Request.Scheme}://{Request.Host}";
        }

        var normalizedBase = baseUrl.TrimEnd('/');
        var normalizedPath = (_resetOptions.Path ?? "/reset-password").TrimStart('/');
        var encodedEmail = WebUtility.UrlEncode(email);

        return $"{normalizedBase}/{normalizedPath}?email={encodedEmail}";
    }

    private static string GenerateTemporaryPassword()
    {
        var random = Random.Shared.Next(100000, 999999);
        return $"Temp@{random}A";
    }
}
