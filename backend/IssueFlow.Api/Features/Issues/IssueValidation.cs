using IssueFlow.Api.Models;

namespace IssueFlow.Api.Features.Issues;

public static class IssueValidation
{
    public static Dictionary<string, string[]> Validate(
        string? title,
        string? description,
        IssueStatus? status,
        IssuePriority? priority,
        long? assigneeId,
        IEnumerable<string>? tags,
        DateOnly? dueDate,
        bool validateDueDate = true)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
        var normalizedTags = IssueMapping.NormalizeTags(tags);

        if (string.IsNullOrWhiteSpace(title))
        {
            errors["title"] = ["Title is required."];
        }
        else if (title.Trim().Length > 100)
        {
            errors["title"] = ["Title must be 100 characters or fewer."];
        }

        if ((description ?? "").Length > 5000)
        {
            errors["description"] = ["Description must be 5,000 characters or fewer."];
        }

        if (status is null || !Enum.IsDefined(status.Value))
        {
            errors["status"] = ["Choose a valid issue status."];
        }

        if (priority is null || !Enum.IsDefined(priority.Value))
        {
            errors["priority"] = ["Choose a valid issue priority."];
        }

        if (assigneeId is <= 0)
        {
            errors["assigneeId"] = ["Assignee must be a valid member."];
        }

        if (validateDueDate && dueDate is not null && dueDate < DateOnly.FromDateTime(DateTime.UtcNow))
        {
            errors["dueDate"] = ["Due date cannot be in the past."];
        }

        if (normalizedTags.Length > 10 || normalizedTags.Any(tag => tag.Length > 30))
        {
            errors["tags"] = ["Use at most 10 tags, each 30 characters or fewer."];
        }

        return errors;
    }
}
