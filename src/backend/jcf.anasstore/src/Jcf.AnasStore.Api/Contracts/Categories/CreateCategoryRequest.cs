namespace Jcf.AnasStore.Api.Contracts.Categories;

public sealed record CreateCategoryRequest(string Name, string Description, bool IsActive = true);
