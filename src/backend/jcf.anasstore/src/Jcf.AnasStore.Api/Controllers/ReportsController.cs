using Jcf.AnasStore.Application.Abstractions.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class ReportsController(IReportsReadRepository reportsRepository) : ControllerBase
{
    /// <summary>
    /// Returns the list of sellers (users who created at least one sale) for filter dropdowns.
    /// </summary>
    [HttpGet("sellers")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSellers(CancellationToken cancellationToken)
    {
        var sellers = await reportsRepository.GetSellersAsync(cancellationToken);
        return Ok(sellers);
    }

    /// <summary>
    /// Sales report filtered by date range and seller.
    /// Returns each item sold with product details, customer, payment method and seller.
    /// </summary>
    [HttpGet("sales")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSalesReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] Guid? sellerUid,
        CancellationToken cancellationToken)
    {
        if (startDate.HasValue && endDate.HasValue && startDate > endDate)
        {
            return BadRequest(new { message = "A data inicial não pode ser maior que a data final." });
        }

        var report = await reportsRepository.GetSalesReportAsync(
            startDate,
            endDate,
            sellerUid,
            cancellationToken);

        return Ok(report);
    }

    /// <summary>
    /// ABC product classification report.
    /// Class A: top products representing 80% of revenue.
    /// Class B: products from 80% to 95% of cumulative revenue.
    /// Class C: remaining products (last 5% of revenue).
    /// </summary>
    [HttpGet("abc")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAbcReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        if (startDate.HasValue && endDate.HasValue && startDate > endDate)
        {
            return BadRequest(new { message = "A data inicial não pode ser maior que a data final." });
        }

        var items = await reportsRepository.GetAbcReportAsync(startDate, endDate, cancellationToken);
        return Ok(items);
    }

    /// <summary>
    /// Monthly cash flow report for the given year.
    /// Includes revenue, discounts, net revenue, average ticket and payment method breakdown.
    /// </summary>
    [HttpGet("cash-flow")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCashFlowReport(
        [FromQuery] int? year,
        CancellationToken cancellationToken)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;

        if (targetYear < 2000 || targetYear > DateTime.UtcNow.Year + 1)
        {
            return BadRequest(new { message = "Ano inválido." });
        }

        var report = await reportsRepository.GetCashFlowReportAsync(targetYear, cancellationToken);
        return Ok(report);
    }
}
