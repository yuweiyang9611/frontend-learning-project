namespace IssueFlow.Api.Models;

public sealed class Attachment
{
    public long Id { get; set; }
    public long IssueId { get; set; }
    public required Issue Issue { get; set; }
    public required string OriginalFileName { get; set; }
    public required string StoredFileName { get; set; }
    public required string ContentType { get; set; }
    public long Size { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
