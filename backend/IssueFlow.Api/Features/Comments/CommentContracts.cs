using IssueFlow.Api.Features.Common;

namespace IssueFlow.Api.Features.Comments;

public sealed record CreateCommentRequest(string? Body);

public sealed record CommentResponse(
    long Id,
    long IssueId,
    MemberResponse Author,
    string Body,
    DateTimeOffset CreatedAt);
