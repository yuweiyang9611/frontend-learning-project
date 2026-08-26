using System.Security.Claims;
using IssueFlow.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace IssueFlow.Api.Features.Common;

public static class EndpointHelpers
{
    public static async Task<long?> GetCurrentMemberIdAsync(
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var identityId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (identityId is null)
        {
            return null;
        }

        return await db.Users
            .Where(user => user.Id == identityId)
            .Select(user => user.MemberId)
            .SingleOrDefaultAsync(cancellationToken);
    }
}
