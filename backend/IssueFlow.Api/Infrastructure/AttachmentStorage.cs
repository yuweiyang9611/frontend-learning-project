using Microsoft.Extensions.Options;

namespace IssueFlow.Api.Infrastructure;

public sealed class AttachmentStorageOptions
{
    public const string SectionName = "AttachmentStorage";
    public string Path { get; set; } = "uploads";
}

public sealed class AttachmentStorage(
    IWebHostEnvironment environment,
    IOptions<AttachmentStorageOptions> options)
{
    private readonly string _rootPath = ResolveRootPath(environment.ContentRootPath, options.Value.Path);

    public string RootPath => _rootPath;

    public void EnsureCreated() => Directory.CreateDirectory(_rootPath);

    public string GetPath(string storedFileName)
    {
        if (string.IsNullOrWhiteSpace(storedFileName) ||
            storedFileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0 ||
            storedFileName != Path.GetFileName(storedFileName))
        {
            throw new InvalidOperationException("The stored attachment name is invalid.");
        }

        var candidate = Path.GetFullPath(Path.Combine(_rootPath, storedFileName));
        var rootWithSeparator = _rootPath.EndsWith(Path.DirectorySeparatorChar)
            ? _rootPath
            : _rootPath + Path.DirectorySeparatorChar;

        if (!candidate.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("The stored attachment path is outside the upload directory.");
        }

        return candidate;
    }

    private static string ResolveRootPath(string contentRootPath, string configuredPath)
    {
        var path = string.IsNullOrWhiteSpace(configuredPath) ? "uploads" : configuredPath;
        return Path.GetFullPath(Path.IsPathRooted(path) ? path : Path.Combine(contentRootPath, path));
    }
}
