namespace IssueFlow.Api.Features.Attachments;

public static class AttachmentFilePolicy
{
    public const long MaxFileSize = 5 * 1024 * 1024;

    private static readonly IReadOnlyDictionary<string, string[]> AllowedExtensions =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["image/png"] = [".png"],
            ["image/jpeg"] = [".jpg", ".jpeg"],
            ["application/pdf"] = [".pdf"],
            ["text/plain"] = [".txt"]
        };

    public static bool TryGetSafeExtension(IFormFile file, out string extension)
    {
        extension = Path.GetExtension(Path.GetFileName(file.FileName)).ToLowerInvariant();
        return AllowedExtensions.TryGetValue(file.ContentType, out var extensions) &&
            extensions.Contains(extension, StringComparer.OrdinalIgnoreCase);
    }

    public static async Task<bool> HasValidSignatureAsync(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var buffer = new byte[Math.Min(file.Length, 512)];
        await using var stream = file.OpenReadStream();
        var read = await stream.ReadAsync(buffer.AsMemory(), cancellationToken);

        return file.ContentType.ToLowerInvariant() switch
        {
            "image/png" => StartsWith(buffer, read, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
            "image/jpeg" => StartsWith(buffer, read, [0xFF, 0xD8, 0xFF]),
            "application/pdf" => StartsWith(buffer, read, "%PDF-"u8),
            "text/plain" => read > 0 && !buffer.AsSpan(0, read).Contains((byte)0),
            _ => false
        };
    }

    private static bool StartsWith(byte[] content, int count, ReadOnlySpan<byte> signature) =>
        count >= signature.Length && content.AsSpan(0, signature.Length).SequenceEqual(signature);
}
