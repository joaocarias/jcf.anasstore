using System.Security.Claims;
using Jcf.AnasStore.Api.Contracts.Common;
using Jcf.AnasStore.Api.Contracts.Products;
using Jcf.AnasStore.Application.Abstractions.Cqrs;
using Jcf.AnasStore.Application.Abstractions.Data;
using Jcf.AnasStore.Application.Features.Products.Common;
using Jcf.AnasStore.Application.Features.Products.GetProductById;
using Jcf.AnasStore.Application.Features.Products.GetProducts;
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
public sealed class ProductsController(AppDbContext dbContext, IQueryDispatcher queryDispatcher) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery query, [FromQuery] string? name, CancellationToken cancellationToken)
    {
        var result = await queryDispatcher.SendAsync<GetProductsQuery, PagedReadResult<ProductReadDto>>(
            new GetProductsQuery(query.ValidPage, query.ValidPageSize, name),
            cancellationToken);

        return Ok(new PagedResponse<ProductResponse>(
            result.Items.Select(ToResponse).ToList(),
            result.Total,
            query.ValidPage,
            query.ValidPageSize));
    }

    [HttpGet("{uid:guid}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUid([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var product = await queryDispatcher.SendAsync<GetProductByIdQuery, ProductReadDto?>(
            new GetProductByIdQuery(uid),
            cancellationToken);

        if (product is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(product));
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPost]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request, CancellationToken cancellationToken)
    {
        var related = await LoadRelatedEntitiesAsync(request.SupplierUid, request.CategoryUid, cancellationToken);
        if (!related.IsValid)
        {
            return BadRequest(new { message = related.ErrorMessage });
        }

        try
        {
            var product = new Product(
                request.Name,
                request.Description,
                related.Supplier!.Id,
                request.PurchasePrice,
                request.SalePrice,
                related.Category!.Id);

            if (!request.IsActive)
            {
                product.SetActive(false, GetCurrentUserId());
            }

            product.SetCreateUser(GetCurrentUserId());

            await dbContext.Products.AddAsync(product, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            product = await dbContext.Products
                .AsNoTracking()
                .Include(x => x.Supplier)
                .Include(x => x.Category)
                .FirstAsync(x => x.Uid == product.Uid, cancellationToken);

            return CreatedAtAction(nameof(GetByUid), new { uid = product.Uid }, ToResponse(product, 0));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpPut("{uid:guid}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid uid, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        var related = await LoadRelatedEntitiesAsync(request.SupplierUid, request.CategoryUid, cancellationToken);
        if (!related.IsValid)
        {
            return BadRequest(new { message = related.ErrorMessage });
        }

        try
        {
            product.Update(
                request.Name,
                request.Description,
                related.Supplier!.Id,
                request.PurchasePrice,
                request.SalePrice,
                related.Category!.Id);

            if (request.IsActive.HasValue)
            {
                product.SetActive(request.IsActive.Value, GetCurrentUserId());
            }
            else
            {
                product.SetUpdate(GetCurrentUserId());
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            product = await dbContext.Products
                .AsNoTracking()
                .Include(x => x.Supplier)
                .Include(x => x.Category)
                .FirstAsync(x => x.Uid == uid, cancellationToken);

            var stockQuantity = await (
                    from productVariation in dbContext.ProductVariations.AsNoTracking()
                    join stock in dbContext.Stocks.AsNoTracking()
                        on productVariation.Id equals stock.ProductVariationId
                    where productVariation.ProductId == product.Id
                    select (int?)stock.Quantity)
                .SumAsync(cancellationToken) ?? 0;

            return Ok(ToResponse(product, stockQuantity));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = $"{IdentitySeeder.AdminRoleName},{IdentitySeeder.ManagerRoleName}")]
    [HttpDelete("{uid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid uid, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.Uid == uid, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        product.SetActive(false, GetCurrentUserId());
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<RelatedEntitiesResult> LoadRelatedEntitiesAsync(
        Guid supplierUid,
        Guid categoryUid,
        CancellationToken cancellationToken)
    {
        var supplier = await dbContext.Suppliers
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == supplierUid, cancellationToken);
        if (supplier is null)
        {
            return RelatedEntitiesResult.Fail("SupplierUid is invalid.");
        }

        var category = await dbContext.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Uid == categoryUid, cancellationToken);
        if (category is null)
        {
            return RelatedEntitiesResult.Fail("CategoryUid is invalid.");
        }

        return RelatedEntitiesResult.Ok(supplier, category);
    }

    private static ProductResponse ToResponse(Product product, int stockQuantity)
    {
        if (product.Supplier is null)
        {
            throw new InvalidOperationException("Product supplier is not loaded.");
        }

        if (product.Category is null)
        {
            throw new InvalidOperationException("Product category is not loaded.");
        }

        return new ProductResponse(
            product.Uid,
            product.Name,
            product.Description,
            product.Supplier.Uid,
            product.Supplier.Name,
            product.PurchasePrice,
            product.SalePrice,
            stockQuantity,
            product.Category.Uid,
            product.Category.Name,
            product.IsActive,
            product.CreateAt,
            product.UpdateAt);
    }

    private static ProductResponse ToResponse(ProductReadDto product)
    {
        return new ProductResponse(
            product.Uid,
            product.Name,
            product.Description,
            product.SupplierUid,
            product.SupplierName,
            product.PurchasePrice,
            product.SalePrice,
            product.StockQuantity,
            product.CategoryUid,
            product.CategoryName,
            product.IsActive,
            product.CreateAt,
            product.UpdateAt);
    }

    private long? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(value, out var id) ? id : null;
    }

    private sealed record RelatedEntitiesResult(
        bool IsValid,
        string? ErrorMessage,
        Supplier? Supplier,
        Category? Category)
    {
        public static RelatedEntitiesResult Fail(string message) =>
            new(false, message, null, null);

        public static RelatedEntitiesResult Ok(Supplier supplier, Category category) =>
            new(true, null, supplier, category);
    }
}
