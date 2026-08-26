namespace IssueFlow.Api.Models;

public sealed class Member
{
    public long Id { get; set; }
    public required string DisplayName { get; set; }
    public required string Email { get; set; }
    public string? AvatarUrl { get; set; }
    public required string Role { get; set; }
    public required string Initials { get; set; }
    public required string Color { get; set; }

    public ICollection<Issue> AssignedIssues { get; set; } = [];
    public ICollection<Issue> ReportedIssues { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];
}
