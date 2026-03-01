using Microsoft.AspNetCore.Identity;

namespace Jcf.AnasStore.Infrastructure.Identity;

public sealed class AppUser : IdentityUser<long>
{
    public Guid Uid { get; set; } = Guid.NewGuid();
    public bool IsActive { get; set; } = true;
    public DateTime CreateAt { get; set; } = DateTime.UtcNow;
    public long? UserCreateId { get; set; }
    public DateTime? UpdateAt { get; set; }
    public long? UserUpdateId { get; set; }
}
