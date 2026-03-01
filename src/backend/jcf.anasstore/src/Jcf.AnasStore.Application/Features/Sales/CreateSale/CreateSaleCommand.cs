using Jcf.AnasStore.Application.Abstractions.Cqrs;

namespace Jcf.AnasStore.Application.Features.Sales.CreateSale;

public sealed record CreateSaleCommand(string CustomerEmail, decimal TotalAmount) : ICommand<long>;
