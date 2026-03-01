using Jcf.AnasStore.Application.Abstractions.Cqrs;

namespace Jcf.AnasStore.Application.Features.Auth.Login;

public sealed record LoginCommand(string Email, string Password) : ICommand<LoginResult>;
