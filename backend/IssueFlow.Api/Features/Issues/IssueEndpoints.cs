using System.Security.Claims;
using IssueFlow.Api.Data;
using IssueFlow.Api.Features.Common;
using IssueFlow.Api.Infrastructure;
using IssueFlow.Api.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace IssueFlow.Api.Features.Issues;

public static class IssueEndpoints
{
    public static IEndpointRouteBuilder MapIssueEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/issues").WithTags("Issues");

        group.MapGet("/", GetIssuesAsync)
            .WithName("GetIssues")
            .Produces<PagedResult<IssueListItemResponse>>()
            .ProducesValidationProblem();

        group.MapGet("/{id:long}", GetIssueAsync)
            .WithName("GetIssue")
            .Produces<IssueResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateIssueAsync)
            .WithName("CreateIssue")
            .RequireAuthorization()
            .Produces<IssueResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapPatch("/{id:long}", UpdateIssueAsync)
            .WithName("UpdateIssue")
            .RequireAuthorization()
            .Produces<IssueResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapDelete("/{id:long}", DeleteIssueAsync)
            .WithName("DeleteIssue")
            .RequireAuthorization()
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> GetIssuesAsync(
        AppDbContext db,
        int page = 1,
        int pageSize = 20,
        string? search = null,
        string? status = null,
        string? priority = null,
        long? assigneeId = null,
        string sortBy = "updatedAt",
        string sortDirection = "desc",
        CancellationToken cancellationToken = default)
    {
        var errors = ValidateQuery(page, pageSize, search, status, priority, assigneeId, sortBy, sortDirection);
        if (errors.Count > 0)
        {
            return ApiResults.Validation(errors, "One or more query parameters are invalid.");
        }

        var query = db.Issues
            .AsNoTracking()
            .Include(issue => issue.Assignee)
            .Include(issue => issue.Reporter)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim().ToUpperInvariant();
            query = query.Where(issue =>
                issue.NormalizedTitle.Contains(needle) || issue.Description.ToUpper().Contains(needle));
        }

        if (TryParseStatus(status, out var parsedStatus))
        {
            query = query.Where(issue => issue.Status == parsedStatus);
        }

        if (TryParsePriority(priority, out var parsedPriority))
        {
            query = query.Where(issue => issue.Priority == parsedPriority);
        }

        if (assigneeId is not null)
        {
            query = query.Where(issue => issue.AssigneeId == assigneeId);
        }

        var total = await query.CountAsync(cancellationToken);
        var ordered = ApplyOrdering(query, sortBy, sortDirection);
        var issues = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Results.Ok(new PagedResult<IssueListItemResponse>(
            issues.Select(IssueMapping.ToListResponse).ToArray(),
            page,
            pageSize,
            total));
    }

    private static async Task<IResult> GetIssueAsync(
        long id,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var issue = await db.Issues
            .AsNoTracking()
            .Include(item => item.Assignee)
            .Include(item => item.Reporter)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        return issue is null
            ? ApiResults.NotFound("Issue")
            : Results.Ok(IssueMapping.ToResponse(issue));
    }

    private static async Task<IResult> CreateIssueAsync(
        CreateIssueRequest request,
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var errors = IssueValidation.Validate(
            request.Title,
            request.Description,
            request.Status,
            request.Priority,
            request.AssigneeId,
            request.Tags,
            request.DueDate);

        var assignee = await ValidateAndGetAssigneeAsync(request.AssigneeId, errors, db, cancellationToken);
        if (errors.Count > 0)
        {
            return ApiResults.Validation(errors);
        }

        var reporterId = await EndpointHelpers.GetCurrentMemberIdAsync(principal, db, cancellationToken);
        var reporter = reporterId is null
            ? null
            : await db.Members.SingleOrDefaultAsync(member => member.Id == reporterId, cancellationToken);
        if (reporter is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Member profile required",
                detail: "The signed-in account is not linked to an IssueFlow member.");
        }

        var title = request.Title!.Trim();
        var normalizedTitle = title.ToUpperInvariant();
        if (await db.Issues.AnyAsync(issue => issue.NormalizedTitle == normalizedTitle, cancellationToken))
        {
            return DuplicateTitle();
        }

        var now = DateTimeOffset.UtcNow;
        var issue = new Issue
        {
            Title = title,
            NormalizedTitle = normalizedTitle,
            Description = (request.Description ?? "").Trim(),
            Status = request.Status!.Value,
            Priority = request.Priority!.Value,
            Assignee = assignee,
            Reporter = reporter,
            TagsJson = IssueMapping.WriteTags(request.Tags),
            DueDate = request.DueDate,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Issues.Add(issue);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqliteException { SqliteErrorCode: 19 })
        {
            return DuplicateTitle();
        }

        return Results.Created($"/api/issues/{issue.Id}", IssueMapping.ToResponse(issue));
    }

    private static async Task<IResult> UpdateIssueAsync(
        long id,
        UpdateIssueRequest request,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var issue = await db.Issues
            .Include(item => item.Assignee)
            .Include(item => item.Reporter)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (issue is null)
        {
            return ApiResults.NotFound("Issue");
        }

        if (!request.HasAnyValue)
        {
            return ApiResults.Validation(new Dictionary<string, string[]>
            {
                ["request"] = ["Provide at least one field to update."]
            });
        }

        var title = request.HasTitle ? request.Title : issue.Title;
        var description = request.HasDescription ? request.Description : issue.Description;
        var status = request.HasStatus ? request.Status : issue.Status;
        var priority = request.HasPriority ? request.Priority : issue.Priority;
        var assigneeId = request.HasAssigneeId ? request.AssigneeId : issue.AssigneeId;
        var tags = request.HasTags ? request.Tags : IssueMapping.ReadTags(issue.TagsJson);
        var dueDate = request.HasDueDate ? request.DueDate : issue.DueDate;

        var errors = IssueValidation.Validate(
            title,
            description,
            status,
            priority,
            assigneeId,
            tags,
            dueDate,
            validateDueDate: request.HasDueDate);
        var assignee = await ValidateAndGetAssigneeAsync(assigneeId, errors, db, cancellationToken);
        if (errors.Count > 0)
        {
            return ApiResults.Validation(errors);
        }

        var trimmedTitle = title!.Trim();
        var normalizedTitle = trimmedTitle.ToUpperInvariant();
        if (await db.Issues.AnyAsync(
            candidate => candidate.Id != id && candidate.NormalizedTitle == normalizedTitle,
            cancellationToken))
        {
            return DuplicateTitle();
        }

        issue.Title = trimmedTitle;
        issue.NormalizedTitle = normalizedTitle;
        issue.Description = (description ?? "").Trim();
        issue.Status = status!.Value;
        issue.Priority = priority!.Value;
        issue.Assignee = assignee;
        issue.AssigneeId = assigneeId;
        issue.TagsJson = IssueMapping.WriteTags(tags);
        issue.DueDate = dueDate;
        issue.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqliteException { SqliteErrorCode: 19 })
        {
            return DuplicateTitle();
        }

        return Results.Ok(IssueMapping.ToResponse(issue));
    }

    private static async Task<IResult> DeleteIssueAsync(
        long id,
        AppDbContext db,
        AttachmentStorage storage,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        var issue = await db.Issues
            .Include(item => item.Attachments)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (issue is null)
        {
            return ApiResults.NotFound("Issue");
        }

        var storedFiles = issue.Attachments.Select(attachment => attachment.StoredFileName).ToArray();
        db.Issues.Remove(issue);
        await db.SaveChangesAsync(cancellationToken);

        var logger = loggerFactory.CreateLogger("IssueFlow.Attachments");
        foreach (var storedFile in storedFiles)
        {
            try
            {
                var path = storage.GetPath(storedFile);
                if (File.Exists(path))
                {
                    File.Delete(path);
                }
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "Could not delete attachment file {StoredFileName}", storedFile);
            }
        }

        return Results.NoContent();
    }

    private static async Task<Member?> ValidateAndGetAssigneeAsync(
        long? assigneeId,
        IDictionary<string, string[]> errors,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        if (assigneeId is null || assigneeId <= 0)
        {
            return null;
        }

        var member = await db.Members.SingleOrDefaultAsync(item => item.Id == assigneeId, cancellationToken);
        if (member is null)
        {
            errors["assigneeId"] = ["The selected assignee does not exist."];
        }

        return member;
    }

    private static Dictionary<string, string[]> ValidateQuery(
        int page,
        int pageSize,
        string? search,
        string? status,
        string? priority,
        long? assigneeId,
        string sortBy,
        string sortDirection)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
        if (page < 1) errors["page"] = ["Page must be at least 1."];
        if (pageSize is < 1 or > 100) errors["pageSize"] = ["Page size must be between 1 and 100."];
        if ((search?.Length ?? 0) > 200) errors["search"] = ["Search must be 200 characters or fewer."];
        if (status is not null && !TryParseStatus(status, out _)) errors["status"] = ["Choose a valid issue status."];
        if (priority is not null && !TryParsePriority(priority, out _)) errors["priority"] = ["Choose a valid issue priority."];
        if (assigneeId is <= 0) errors["assigneeId"] = ["Assignee must be a valid member."];
        if (sortBy is not ("createdAt" or "updatedAt" or "title" or "priority" or "status"))
            errors["sortBy"] = ["Sort by createdAt, updatedAt, title, priority, or status."];
        if (sortDirection is not ("asc" or "desc"))
            errors["sortDirection"] = ["Sort direction must be asc or desc."];
        return errors;
    }

    private static IOrderedQueryable<Issue> ApplyOrdering(
        IQueryable<Issue> query,
        string sortBy,
        string sortDirection)
    {
        var descending = sortDirection == "desc";
        IOrderedQueryable<Issue> ordered = sortBy switch
        {
            "createdAt" => descending ? query.OrderByDescending(issue => issue.CreatedAt) : query.OrderBy(issue => issue.CreatedAt),
            "title" => descending ? query.OrderByDescending(issue => issue.Title) : query.OrderBy(issue => issue.Title),
            "priority" => descending
                ? query.OrderByDescending(issue =>
                    issue.Priority == IssuePriority.Critical ? 3 :
                    issue.Priority == IssuePriority.High ? 2 :
                    issue.Priority == IssuePriority.Medium ? 1 : 0)
                : query.OrderBy(issue =>
                    issue.Priority == IssuePriority.Critical ? 3 :
                    issue.Priority == IssuePriority.High ? 2 :
                    issue.Priority == IssuePriority.Medium ? 1 : 0),
            "status" => descending
                ? query.OrderByDescending(issue =>
                    issue.Status == IssueStatus.Closed ? 3 :
                    issue.Status == IssueStatus.Resolved ? 2 :
                    issue.Status == IssueStatus.InProgress ? 1 : 0)
                : query.OrderBy(issue =>
                    issue.Status == IssueStatus.Closed ? 3 :
                    issue.Status == IssueStatus.Resolved ? 2 :
                    issue.Status == IssueStatus.InProgress ? 1 : 0),
            _ => descending ? query.OrderByDescending(issue => issue.UpdatedAt) : query.OrderBy(issue => issue.UpdatedAt)
        };

        return descending ? ordered.ThenByDescending(issue => issue.Id) : ordered.ThenBy(issue => issue.Id);
    }

    private static bool TryParseStatus(string? value, out IssueStatus status)
    {
        status = value?.Trim().ToLowerInvariant() switch
        {
            "open" => IssueStatus.Open,
            "in_progress" => IssueStatus.InProgress,
            "resolved" => IssueStatus.Resolved,
            "closed" => IssueStatus.Closed,
            _ => (IssueStatus)(-1)
        };
        return Enum.IsDefined(status);
    }

    private static bool TryParsePriority(string? value, out IssuePriority priority)
    {
        priority = value?.Trim().ToLowerInvariant() switch
        {
            "low" => IssuePriority.Low,
            "medium" => IssuePriority.Medium,
            "high" => IssuePriority.High,
            "critical" => IssuePriority.Critical,
            _ => (IssuePriority)(-1)
        };
        return Enum.IsDefined(priority);
    }

    private static IResult DuplicateTitle() =>
        ApiResults.Conflict(
            "An issue with this title already exists.",
            new Dictionary<string, string[]>
            {
                ["title"] = ["An issue with this title already exists."]
            });
}
