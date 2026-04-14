namespace Jcf.AnasStore.Api.Contracts.Auth;

public sealed record ConfirmPasswordResetRequest(string Email, string TemporaryPassword, string NewPassword);
