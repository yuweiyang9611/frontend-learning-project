using System.Security.Claims;
using System.Text.Json;
using IssueFlow.Api.Data;
using IssueFlow.Api.Features.Authentication;
using IssueFlow.Api.Features.Common;
using IssueFlow.Api.Features.Issues;
using IssueFlow.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IssueFlow.Api.Features.Workspace;

public sealed record NotificationPreferences(bool Assigned, bool Mentions, bool Digest);
public static class WorkspaceEndpoints
{
    public static IEndpointRouteBuilder MapWorkspaceEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/workspace/overview", OverviewAsync).WithTags("Workspace");
        var me = endpoints.MapGroup("/api/me").RequireAuthorization().WithTags("Settings");
        me.AddEndpointFilter(async (context, next) => { context.HttpContext.Response.Headers.CacheControl = "no-store"; return await next(context); });
        me.MapGet("/settings", async (ClaimsPrincipal principal, UserManager<ApplicationUser> users) =>
        {
            var user = await users.GetUserAsync(principal);
            return user is null ? Results.Unauthorized() : Results.Ok(new { session = await AuthEndpoints.ToSessionAsync(user, users), notifications = Preferences(user) });
        });
        me.MapPatch("/profile", SaveProfileAsync);
        me.MapPut("/preferences", SavePreferencesAsync);
        return endpoints;
    }
    private static NotificationPreferences Preferences(ApplicationUser user) => new(user.NotifyAssigned, user.NotifyMentions, user.NotifyDigest);
    private static bool AllowedOrigin(HttpRequest request, IConfiguration config) =>
        !request.Headers.ContainsKey("Origin") || request.Headers.Origin == $"{request.Scheme}://{request.Host}" ||
        (config.GetSection("Frontend:Origins").Get<string[]>() ?? ["http://localhost:3000", "http://localhost:5173"]).Contains(request.Headers.Origin.ToString(), StringComparer.Ordinal);
    private static IResult Invalid(string field, string message) => ApiResults.Validation(new Dictionary<string, string[]> { [field] = [message] });
    private static async Task<IResult> SaveProfileAsync(JsonElement body, ClaimsPrincipal principal, UserManager<ApplicationUser> users, AppDbContext db, HttpRequest request, IConfiguration config)
    {
        if (!AllowedOrigin(request, config)) return Results.Problem(statusCode: 403, title: "Cross-site request rejected");
        if (body.ValueKind != JsonValueKind.Object || body.EnumerateObject().Any(p => p.Name != "displayName") ||
            !body.TryGetProperty("displayName", out var value) || value.ValueKind != JsonValueKind.String ||
            string.IsNullOrWhiteSpace(value.GetString()) || value.GetString()!.Trim().Length > 100)
            return Invalid("displayName", "Display name must contain 1–100 characters. Only displayName may be changed.");
        var user = await users.GetUserAsync(principal);
        if (user is null) return Results.Unauthorized();
        var name = value.GetString()!.Trim();
        await using var transaction = await db.Database.BeginTransactionAsync();
        user.DisplayName = name;
        if (user.MemberId is long memberId)
        {
            var member = await db.Members.SingleAsync(m => m.Id == memberId);
            member.DisplayName = name;
            member.Initials = string.Concat(name.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Take(2).Select(p => char.ToUpperInvariant(p[0])));
        }
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return Results.Ok(await AuthEndpoints.ToSessionAsync(user, users));
    }
    private static async Task<IResult> SavePreferencesAsync(JsonElement body, ClaimsPrincipal principal, UserManager<ApplicationUser> users, AppDbContext db, HttpRequest request, IConfiguration config)
    {
        if (!AllowedOrigin(request, config)) return Results.Problem(statusCode: 403, title: "Cross-site request rejected");
        if (body.ValueKind != JsonValueKind.Object || body.EnumerateObject().Count() != 3 ||
            !body.TryGetProperty("assigned", out var a) || !body.TryGetProperty("mentions", out var m) || !body.TryGetProperty("digest", out var d) ||
            !IsBoolean(a) || !IsBoolean(m) || !IsBoolean(d)) return Invalid("notifications", "Send assigned, mentions and digest as boolean values.");
        var user = await users.GetUserAsync(principal);
        if (user is null) return Results.Unauthorized();
        user.NotifyAssigned = a.GetBoolean(); user.NotifyMentions = m.GetBoolean(); user.NotifyDigest = d.GetBoolean();
        await db.SaveChangesAsync();
        return Results.Ok(Preferences(user));
    }
    private static bool IsBoolean(JsonElement value) => value.ValueKind is JsonValueKind.True or JsonValueKind.False;

    private static async Task<IResult> OverviewAsync(AppDbContext db, CancellationToken ct)
    {
        var asOf = DateTimeOffset.UtcNow;
        var issues = (await db.Issues.AsNoTracking().Include(i => i.Assignee).Include(i => i.Reporter).ToListAsync(ct))
            .OrderByDescending(i => i.UpdatedAt).ThenByDescending(i => i.Id).Select(IssueMapping.ToResponse).ToArray();
        var members = await db.Members.AsNoTracking().OrderBy(m => m.DisplayName).ToListAsync(ct);
        var focus = issues.FirstOrDefault(i => i.Priority == IssuePriority.Critical && i.Status != IssueStatus.Closed) ?? issues.FirstOrDefault();
        var related = focus is null ? [] : issues.Where(i => i.Tags.Any(t => focus.Tags.Contains(t))).ToArray();
        return Results.Ok(new
        {
            asOf,
            total = issues.Length,
            byStatus = new { open = issues.Count(i => i.Status == IssueStatus.Open), in_progress = issues.Count(i => i.Status == IssueStatus.InProgress), resolved = issues.Count(i => i.Status == IssueStatus.Resolved), closed = issues.Count(i => i.Status == IssueStatus.Closed) },
            updatedLast7Days = issues.Count(i => i.UpdatedAt <= asOf && i.UpdatedAt >= asOf.AddDays(-7)),
            activeAssignees = issues.Where(i => i.Status == IssueStatus.InProgress && i.Assignee is not null).Select(i => i.Assignee!.Id).Distinct().Count(),
            activeMembers = issues.SelectMany(i => i.Assignee is null ? new[] { i.Reporter.Id } : new[] { i.Reporter.Id, i.Assignee.Id }).Distinct().Count(),
            workloads = members.Select(m => new { memberId = m.Id, assigned = issues.Count(i => i.Assignee?.Id == m.Id), inProgress = issues.Count(i => i.Assignee?.Id == m.Id && i.Status == IssueStatus.InProgress) }),
            recentIssues = issues.Take(6),
            focus = new { issue = focus, relatedCount = related.Length, progress = related.Length == 0 ? 0 : (int)Math.Round(100.0 * related.Count(i => i.Status is IssueStatus.Resolved or IssueStatus.Closed) / related.Length, MidpointRounding.AwayFromZero), members = related.Where(i => i.Assignee is not null).Select(i => i.Assignee!).DistinctBy(m => m.Id) }
        });
    }
}
