using System.Security.Claims;
using IssueFlow.Api.Data;
using IssueFlow.Api.Features.Common;
using IssueFlow.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IssueFlow.Api.Features.Comments;

public static class CommentEndpoints
{
    public static IEndpointRouteBuilder MapCommentEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/issues/{issueId:long}/comments").WithTags("Comments");

        group.MapGet("/", GetCommentsAsync)
            .WithName("GetComments")
            .Produces<IReadOnlyList<CommentResponse>>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", AddCommentAsync)
            .WithName("AddComment")
            .RequireAuthorization()
            .Produces<CommentResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{commentId:long}", DeleteCommentAsync)
            .WithName("DeleteComment")
            .RequireAuthorization()
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> GetCommentsAsync(
        long issueId,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        if (!await db.Issues.AnyAsync(issue => issue.Id == issueId, cancellationToken))
        {
            return ApiResults.NotFound("Issue");
        }

        var comments = await db.Comments
            .AsNoTracking()
            .Include(comment => comment.Author)
            .Where(comment => comment.IssueId == issueId)
            .OrderBy(comment => comment.CreatedAt)
            .ThenBy(comment => comment.Id)
            .ToListAsync(cancellationToken);

        return Results.Ok(comments.Select(ToResponse));
    }

    private static async Task<IResult> AddCommentAsync(
        long issueId,
        CreateCommentRequest request,
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Body))
        {
            return ApiResults.Validation(new Dictionary<string, string[]>
            {
                ["body"] = ["Comment cannot be empty."]
            });
        }

        if (request.Body.Trim().Length > 4000)
        {
            return ApiResults.Validation(new Dictionary<string, string[]>
            {
                ["body"] = ["Comment must be 4,000 characters or fewer."]
            });
        }

        var issue = await db.Issues.SingleOrDefaultAsync(item => item.Id == issueId, cancellationToken);
        if (issue is null)
        {
            return ApiResults.NotFound("Issue");
        }

        var authorId = await EndpointHelpers.GetCurrentMemberIdAsync(principal, db, cancellationToken);
        var author = authorId is null
            ? null
            : await db.Members.SingleOrDefaultAsync(member => member.Id == authorId, cancellationToken);
        if (author is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Member profile required",
                detail: "The signed-in account is not linked to an IssueFlow member.");
        }

        var comment = new Comment
        {
            Issue = issue,
            Author = author,
            Body = request.Body.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.Comments.Add(comment);
        issue.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created(
            $"/api/issues/{issueId}/comments/{comment.Id}",
            ToResponse(comment));
    }

    private static async Task<IResult> DeleteCommentAsync(
        long issueId,
        long commentId,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var comment = await db.Comments.SingleOrDefaultAsync(
            item => item.Id == commentId && item.IssueId == issueId,
            cancellationToken);
        if (comment is null)
        {
            return ApiResults.NotFound("Comment");
        }

        db.Comments.Remove(comment);
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static CommentResponse ToResponse(Comment comment) =>
        new(
            comment.Id,
            comment.IssueId,
            MemberResponse.FromEntity(comment.Author),
            comment.Body,
            comment.CreatedAt);
}
