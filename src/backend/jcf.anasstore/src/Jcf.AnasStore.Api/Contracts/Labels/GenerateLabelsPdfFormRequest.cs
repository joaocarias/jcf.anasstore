namespace Jcf.AnasStore.Api.Contracts.Labels;

public sealed class GenerateLabelsPdfFormRequest
{
    public IFormFile File { get; set; } = null!;
    public string PaperModel { get; set; } = string.Empty;
}
