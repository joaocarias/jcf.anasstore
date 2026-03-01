namespace Jcf.AnasStore.Domain.Entities;

public abstract class EntityBase
{
    public long Id { get; protected set; }
    public Guid Uid { get; protected set; } = Guid.NewGuid();
    public bool IsActive { get; protected set; } = true;
    public DateTime CreateAt { get; protected set; } = DateTime.UtcNow;
    public long? UserCreateId { get; protected set; }
    public DateTime? UpdateAt { get; protected set; }
    public long? UserUpdateId { get; protected set; }

    public void SetCreateUser(long? userId)
    {
        UserCreateId = userId;
    }

    public void SetUpdate(long? userId)
    {
        UpdateAt = DateTime.UtcNow;
        UserUpdateId = userId;
    }

    public void SetActive(bool isActive, long? userId = null)
    {
        IsActive = isActive;
        SetUpdate(userId);
    }
}
