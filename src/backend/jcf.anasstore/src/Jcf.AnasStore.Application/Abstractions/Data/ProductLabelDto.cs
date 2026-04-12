namespace Jcf.AnasStore.Application.Abstractions.Data;

public sealed record ProductLabelDto(
    string Reference,
    string Name,
    decimal Price,
    int Quantity);
