using System.Text.Json;
using IssueFlow.Api.Features.Common;
using IssueFlow.Api.Models;

namespace IssueFlow.Api.Features.Issues;

public static class IssueMapping
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static IssueListItemResponse ToListResponse(Issue issue) =>
        new(
            issue.Id,
            $"IF-{issue.Id}",
            issue.Title,
            issue.Description,
            issue.Status,
            issue.Priority,
            issue.Assignee is null ? null : MemberResponse.FromEntity(issue.Assignee),
            MemberResponse.FromEntity(issue.Reporter),
            ReadTags(issue.TagsJson),
            issue.DueDate,
            issue.CreatedAt,
            issue.UpdatedAt);

    public static IssueResponse ToResponse(Issue issue) =>
        new(
            issue.Id,
            $"IF-{issue.Id}",
            issue.Title,
            issue.Description,
            issue.Status,
            issue.Priority,
            issue.Assignee is null ? null : MemberResponse.FromEntity(issue.Assignee),
            MemberResponse.FromEntity(issue.Reporter),
            ReadTags(issue.TagsJson),
            issue.DueDate,
            issue.CreatedAt,
            issue.UpdatedAt);

    public static string WriteTags(IEnumerable<string>? tags) =>
        JsonSerializer.Serialize(NormalizeTags(tags), JsonOptions);

    public static IReadOnlyList<string> ReadTags(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<string[]>(json, JsonOptions) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    public static string[] NormalizeTags(IEnumerable<string>? tags) =>
        (tags ?? [])
            .Select(tag => tag.Trim().ToLowerInvariant())
            .Where(tag => tag.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
}
