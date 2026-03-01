namespace Jcf.AnasStore.Api.Contracts.Sales;

public sealed record CreateSaleRequest(string CustomerEmail, decimal TotalAmount);
