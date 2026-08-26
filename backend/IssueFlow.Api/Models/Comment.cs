namespace IssueFlow.Api.Models;

public sealed class Comment
{
    public long Id { get; set; }
    public long IssueId { get; set; }
    public required Issue Issue { get; set; }
    public long AuthorId { get; set; }
    public required Member Author { get; set; }
    public required string Body { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
