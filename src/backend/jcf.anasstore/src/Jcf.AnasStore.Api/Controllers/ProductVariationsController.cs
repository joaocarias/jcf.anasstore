using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.ProductVariations;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.ProductVariations.Common;
using Jcf.AnasStore.Application.Features.ProductVariations.GetProductVariationById;
using Jcf.AnasStore.Application.Features.ProductVariations.GetProductVariations;
using Jcf.AnasStore.Domain.Entities;
using Jcf.AnasStore.Infrastructure.Persistence;
using Jcf.AnasStore.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class ProductVariationsController(AppDbContext dbContext, IQueryDispatcher queryDispatcher) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ProductVariationResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] PaginationQuery query,
        [FromQuery] Guid? productUid,
        CancellationToken cancellationToken)
    {
        var result = await queryDispatcher.SendAsync<GetProductVariationsQuery, PagedReadResult<ProductVariationReadDto>>(
            new GetProductVariationsQuery(query.ValidPage, query.ValidPageSize, productUid),
            cancellationToken);

        return Ok(new PagedResponse<ProductVariationResponse>(
            result.Items.Select(ToResponse).ToList(),
            result.Total,
            query.ValidPage,
            query.ValidPageSize));
    }

    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(ProductVariationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var variation = await queryDispatcher.SendAsync<GetProductVariationByIdQuery, ProductVariationReadDto?>(
            new GetProductVariationByIdQuery(uid),
            cancellationToken);

        if (variation is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(variation));
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPost]
    [ProducesResponseType(typeof(ProductVariationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProductVariationRequest request, CancellationToken cancellationToken)
    {
        var related = await LoadRelatedEntitiesAsync(request.ProductUid, request.ColorUid, request.ItemSizeUid, cancellationToken);
        if (!related.IsValid)
        {
            return BadRequest(new { message = related.ErrorMessage });
        }

        var alreadyExists = await ProductVariationExistsAsync(
            related.Product!.Id,
            request.Code,
            related.Color!.Id,
            related.ItemSize!.Id,
            null,
            cancellationToken);
        if (alreadyExists)
        {
            return BadRequest(new { message = "J\u00E1 Cadastrado" });
        }

        try
        {
            var variation = new ProductVariation(
                related.Product.Id,
                request.Code,
                related.Color.Id,
                related.ItemSize.Id);

            if (!request.IsActive)
            {
                variation.SetActive(false, GetCurrentUserId());
            }

            variation.SetCreateUser(GetCurrentUserId());

            await dbContext.ProductVariations.AddAsync(variation, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            variation = await dbContext.ProductVariations
                .AsNoTracking()
                .Include(x => x.Product)
                .Include(x => x.Color)
                .Include(x => x.ItemSize)
                .FirstAsync(x => x.Uid == variation.Uid, cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = variation.Uid }, ToResponse(variation, 0));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (DbUpdateException)
        {
            return BadRequest(new { message = "J\u00E1 Cadastrado" });
        }
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(ProductVariationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        [FromRoute] Guid uid,
        [FromBody] UpdateProductVariationRequest request,
        CancellationToken cancellationToken)
    {
        var variation = await dbContext.ProductVariations.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (variation is null)
        {
            return NotFound();
        }

        var related = await LoadRelatedEntitiesAsync(request.ProductUid, request.ColorUid, request.ItemSizeUid, cancellationToken);
        if (!related.IsValid)
        {
            return BadRequest(new { message = related.ErrorMessage });
        }

        var alreadyExists = await ProductVariationExistsAsync(
            related.Product!.Id,
            request.Code,
            related.Color!.Id,
            related.ItemSize!.Id,
            variation.Id,
            cancellationToken);
        if (alreadyExists)
        {
            return BadRequest(new { message = "J\u00E1 Cadastrado" });
        }

        try
        {
            variation.Update(
                related.Product.Id,
                request.Code,
                related.Color.Id,
                related.ItemSize.Id);

            if (request.IsActive.HasValue)
            {
                variation.SetActive(request.IsActive.Value, GetCurrentUserId());
            }
            else
            {
                variation.SetUpdate(GetCurrentUserId());
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            variation = await dbContext.ProductVariations
                .AsNoTracking()
                .Include(x => x.Product)
                .Include(x => x.Color)
                .Include(x => x.ItemSize)
                .FirstAsync(x => x.Uid == uid, cancellationToken);

            var stockQuantity = await dbContext.Stocks
                .AsNoTracking()
                .Where(x => x.ProductVariationId == variation.Id)
                .Select(x => (int?)x.Quantity)
                .SumAsync(cancellationToken) ?? 0;

            return Ok(ToResponse(variation, stockQuantity));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (DbUpdateException)
        {
            return BadRequest(new { message = "J\u00E1 Cadastrado" });
        }
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpDelete("{uid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var variation = await dbContext.ProductVariations.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (variation is null)
        {
            return NotFound();
        }

        variation.SetActive(false, GetCurrentUserId());
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPut("{uid:guid}/stock")]
    [ProducesResponseType(typeof(ProductVariationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpsertStock(
        [FromRoute] Guid uid,
        [FromBody] UpsertProductVariationStockRequest request,
        CancellationToken cancellationToken)
    {
        var variation = await dbContext.ProductVariations
            .Include(x => x.Product)
            .Include(x => x.Color)
            .Include(x => x.ItemSize)
            .FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (variation is null)
        {
            return NotFound();
        }

        try
        {
            var stock = await dbContext.Stocks
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.ProductVariationId == variation.Id, cancellationToken);

            if (stock is null)
            {
                stock = new Stock(variation.Id, request.Quantity);
                stock.SetCreateUser(GetCurrentUserId());
                await dbContext.Stocks.AddAsync(stock, cancellationToken);
            }
            else
            {
                stock.Update(variation.Id, request.Quantity);
                if (!stock.IsActive)
                {
                    stock.SetActive(true, GetCurrentUserId());
                }
                else
                {
                    stock.SetUpdate(GetCurrentUserId());
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Ok(ToResponse(variation, stock.Quantity));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private async Task<RelatedEntitiesResult> LoadRelatedEntitiesAsync(
        Guid productUid,
        Guid colorUid,
        Guid itemSizeUid,
        CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == productUid, cancellationToken);
        if (product is null)
        {
            return RelatedEntitiesResult.Fail("ProductUid is invalid.");
        }

        var color = await dbContext.Colors
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == colorUid, cancellationToken);
        if (color is null)
        {
            return RelatedEntitiesResult.Fail("ColorUid is invalid.");
        }

        var itemSize = await dbContext.ItemSizes
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == itemSizeUid, cancellationToken);
        if (itemSize is null)
        {
            return RelatedEntitiesResult.Fail("ItemSizeUid is invalid.");
        }

        return RelatedEntitiesResult.Ok(product, color, itemSize);
    }

    private static ProductVariationResponse ToResponse(ProductVariation variation, int stockQuantity)
    {
        if (variation.Product is null)
        {
            throw new InvalidOperationException("Product variation product is not loaded.");
        }

        if (variation.Color is null)
        {
            throw new InvalidOperationException("Product variation color is not loaded.");
        }

        if (variation.ItemSize is null)
        {
            throw new InvalidOperationException("Product variation item size is not loaded.");
        }

        return new ProductVariationResponse(
            variation.Uid,
            variation.Product.Uid,
            variation.Product.Name,
            variation.Code,
            variation.Color.Uid,
            variation.Color.Name,
            variation.ItemSize.Uid,
            variation.ItemSize.Name,
            stockQuantity,
            variation.IsActive,
            variation.CreateAt,
            variation.UpdateAt);
    }

    private static ProductVariationResponse ToResponse(ProductVariationReadDto variation)
    {
        return new ProductVariationResponse(
            variation.Uid,
            variation.ProductUid,
            variation.ProductName,
            variation.Code,
            variation.ColorUid,
            variation.ColorName,
            variation.ItemSizeUid,
            variation.ItemSizeName,
            variation.StockQuantity,
            variation.IsActive,
            variation.CreateAt,
            variation.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }

    private async Task<bool> ProductVariationExistsAsync(
        long productId,
        string? code,
        long colorId,
        long itemSizeId,
        long? currentVariationId,
        CancellationToken cancellationToken)
    {
        var normalizedCode = code?.Trim() ?? string.Empty;
        return await dbContext.ProductVariations
            .IgnoreQueryFilters()
            .AnyAsync(
                x => x.IsActive
                     && x.ProductId == productId
                     && x.Code == normalizedCode
                     && x.ColorId == colorId
                     && x.ItemSizeId == itemSizeId
                     && (!currentVariationId.HasValue || x.Id != currentVariationId.Value),
                cancellationToken);
    }

    private sealed record RelatedEntitiesResult(
        bool IsValid,
        string? ErrorMessage,
        Product? Product,
        Color? Color,
        ItemSize? ItemSize)
    {
        public static RelatedEntitiesResult Fail(string message) =>
            new(false, message, null, null, null);

        public static RelatedEntitiesResult Ok(Product product, Color color, ItemSize itemSize) =>
            new(true, null, product, color, itemSize);
    }
}

