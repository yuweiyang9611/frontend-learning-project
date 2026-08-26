namespace IssueFlow.Api.Features.Attachments;

public sealed record AttachmentResponse(
    long Id,
    long IssueId,
    string OriginalFileName,
    string ContentType,
    long Size,
    DateTimeOffset CreatedAt,
    string? DownloadUrl);
