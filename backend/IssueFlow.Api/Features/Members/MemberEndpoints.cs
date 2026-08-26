using IssueFlow.Api.Data;
using IssueFlow.Api.Features.Common;
using Microsoft.EntityFrameworkCore;

namespace IssueFlow.Api.Features.Members;

public static class MemberEndpoints
{
    public static IEndpointRouteBuilder MapMemberEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/members").WithTags("Members");

        group.MapGet("/", async (AppDbContext db, CancellationToken cancellationToken) =>
        {
            var members = await db.Members
                .AsNoTracking()
                .OrderBy(member => member.DisplayName)
                .ToListAsync(cancellationToken);
            return Results.Ok(members.Select(MemberResponse.FromEntity));
        })
        .WithName("GetMembers")
        .Produces<IReadOnlyList<MemberResponse>>();

        group.MapGet("/{id:long}", async (long id, AppDbContext db, CancellationToken cancellationToken) =>
        {
            var member = await db.Members
                .AsNoTracking()
                .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
            return member is null
                ? ApiResults.NotFound("Member")
                : Results.Ok(MemberResponse.FromEntity(member));
        })
        .WithName("GetMember")
        .Produces<MemberResponse>()
        .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }
}
