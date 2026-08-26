namespace IssueFlow.Api.Models;

public sealed class Issue
{
    public long Id { get; set; }
    public required string Title { get; set; }
    public required string NormalizedTitle { get; set; }
    public string Description { get; set; } = "";
    public IssueStatus Status { get; set; }
    public IssuePriority Priority { get; set; }

    public long? AssigneeId { get; set; }
    public Member? Assignee { get; set; }

    public long ReporterId { get; set; }
    public required Member Reporter { get; set; }

    public string TagsJson { get; set; } = "[]";
    public DateOnly? DueDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<Comment> Comments { get; set; } = [];
    public ICollection<Attachment> Attachments { get; set; } = [];
}
