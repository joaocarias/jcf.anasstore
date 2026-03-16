namespace Jcf.AnasStore.Api.Contracts.Profile;

public sealed record UserProfileResponse(
    Guid Uid,
    string Name,
    string Email,
    string RoleName,
    DateTime CreateAt);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
