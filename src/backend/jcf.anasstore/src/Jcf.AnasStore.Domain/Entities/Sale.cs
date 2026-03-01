namespace Jcf.AnasStore.Domain.Entities;

public sealed class Sale : EntityBase
{
    public string CustomerEmail { get; private set; } = string.Empty;
    public decimal TotalAmount { get; private set; }

    private Sale()
    {
    }

    public Sale(string customerEmail, decimal totalAmount)
    {
        if (string.IsNullOrWhiteSpace(customerEmail))
        {
            throw new ArgumentException("Customer e-mail is required.", nameof(customerEmail));
        }

        if (totalAmount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(totalAmount), "Total amount must be greater than zero.");
        }

        CustomerEmail = customerEmail.Trim();
        TotalAmount = totalAmount;
    }
}
