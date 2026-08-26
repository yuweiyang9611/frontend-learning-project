using System.Text.Json.Serialization;
using IssueFlow.Api.Features.Common;
using IssueFlow.Api.Models;

namespace IssueFlow.Api.Features.Issues;

public sealed record CreateIssueRequest(
    string? Title,
    string? Description,
    IssueStatus? Status,
    IssuePriority? Priority,
    long? AssigneeId,
    string[]? Tags,
    DateOnly? DueDate);

public sealed class UpdateIssueRequest
{
    private string? _title;
    private string? _description;
    private IssueStatus? _status;
    private IssuePriority? _priority;
    private long? _assigneeId;
    private string[]? _tags;
    private DateOnly? _dueDate;

    public string? Title
    {
        get => _title;
        init
        {
            _title = value;
            HasTitle = true;
        }
    }

    public string? Description
    {
        get => _description;
        init
        {
            _description = value;
            HasDescription = true;
        }
    }

    public IssueStatus? Status
    {
        get => _status;
        init
        {
            _status = value;
            HasStatus = true;
        }
    }

    public IssuePriority? Priority
    {
        get => _priority;
        init
        {
            _priority = value;
            HasPriority = true;
        }
    }

    public long? AssigneeId
    {
        get => _assigneeId;
        init
        {
            _assigneeId = value;
            HasAssigneeId = true;
        }
    }

    public string[]? Tags
    {
        get => _tags;
        init
        {
            _tags = value;
            HasTags = true;
        }
    }

    public DateOnly? DueDate
    {
        get => _dueDate;
        init
        {
            _dueDate = value;
            HasDueDate = true;
        }
    }

    [JsonIgnore] public bool HasTitle { get; private set; }
    [JsonIgnore] public bool HasDescription { get; private set; }
    [JsonIgnore] public bool HasStatus { get; private set; }
    [JsonIgnore] public bool HasPriority { get; private set; }
    [JsonIgnore] public bool HasAssigneeId { get; private set; }
    [JsonIgnore] public bool HasTags { get; private set; }
    [JsonIgnore] public bool HasDueDate { get; private set; }

    [JsonIgnore]
    public bool HasAnyValue =>
        HasTitle || HasDescription || HasStatus || HasPriority ||
        HasAssigneeId || HasTags || HasDueDate;
}

public sealed record IssueListItemResponse(
    long Id,
    string Key,
    string Title,
    string Description,
    IssueStatus Status,
    IssuePriority Priority,
    MemberResponse? Assignee,
    MemberResponse Reporter,
    IReadOnlyList<string> Tags,
    DateOnly? DueDate,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record IssueResponse(
    long Id,
    string Key,
    string Title,
    string Description,
    IssueStatus Status,
    IssuePriority Priority,
    MemberResponse? Assignee,
    MemberResponse Reporter,
    IReadOnlyList<string> Tags,
    DateOnly? DueDate,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
