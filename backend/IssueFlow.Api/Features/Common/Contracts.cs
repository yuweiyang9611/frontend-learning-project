using IssueFlow.Api.Models;

namespace IssueFlow.Api.Features.Common;

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int Total);

public sealed record MemberResponse(
    long Id,
    string DisplayName,
    string Email,
    string? AvatarUrl,
    string Role,
    string Initials,
    string Color)
{
    public static MemberResponse FromEntity(Member member) =>
        new(
            member.Id,
            member.DisplayName,
            member.Email,
            member.AvatarUrl,
            member.Role,
            member.Initials,
            member.Color);
}

public static class ApiResults
{
    public static IResult NotFound(string resourceName) =>
        Results.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: $"{resourceName} not found",
            detail: $"The requested {resourceName.ToLowerInvariant()} could not be found.");

    public static IResult Validation(
        IDictionary<string, string[]> errors,
        string detail = "Please correct the highlighted fields.") =>
        Results.ValidationProblem(
            errors,
            statusCode: StatusCodes.Status400BadRequest,
            title: "Validation error",
            detail: detail);

    public static IResult Conflict(
        string detail,
        IDictionary<string, string[]>? errors = null) =>
        Results.Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "Conflict",
            detail: detail,
            extensions: errors is null
                ? null
                : new Dictionary<string, object?> { ["errors"] = errors });
}
