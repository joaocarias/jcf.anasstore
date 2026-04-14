using Jcf.AnasStore.Api.Contracts.Labels;
using Jcf.AnasStore.Application.Abstractions.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jcf.AnasStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class LabelsController(ILabelService labelService) : ControllerBase
{
    /// <summary>
    /// Generates a PDF with labels for Pimaco A4249 paper.
    /// </summary>
    [HttpPost("generate-pdf")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(byte[]), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GeneratePdf([FromForm] GenerateLabelsPdfFormRequest request, CancellationToken cancellationToken)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { message = "Arquivo CSV é obrigatório." });

            if (request.File.ContentType != "text/csv" && request.File.ContentType != "application/vnd.ms-excel")
                return BadRequest(new { message = "Apenas arquivos CSV são permitidos." });

            if (string.IsNullOrWhiteSpace(request.PaperModel) || request.PaperModel != "A4249")
                return BadRequest(new { message = "Modelo de papel inválido. Use 'A4249'." });

            using var stream = request.File.OpenReadStream();
            var labels = labelService.ParseCsv(stream);

            if (labels.Count == 0)
                return BadRequest(new { message = "CSV vazio ou inválido." });

            var pdf = labelService.GenerateLabelsPdf(labels);

            return File(pdf, "application/pdf", "etiquetas.pdf");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Erro ao processar CSV: {ex.Message}" });
        }
    }
}
