namespace Jcf.AnasStore.Api.Contracts.Categories;

public sealed record UpdateCategoryRequest(string Name, string Description, bool? IsActive);
