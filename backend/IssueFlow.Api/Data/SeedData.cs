using System.Text.Json;
using IssueFlow.Api.Infrastructure;
using IssueFlow.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IssueFlow.Api.Data;

public static class SeedData
{
    public const string DemoEmail = "demo@issueflow.dev";
    public const string DemoPassword = "issueflow";

    private static readonly string[] Titles =
    [
        "Refresh session after returning from sleep",
        "Add bulk actions to the issue table",
        "Empty state copy does not match filters",
        "Improve keyboard focus inside dialogs",
        "Persist table density preference",
        "Show active filters in shared issue URLs",
        "Add confirmation before deleting comments",
        "Optimize board rendering for large projects",
        "Support markdown in issue descriptions",
        "Fix overlapping toast on small screens",
        "Add assignee workload to dashboard",
        "Document authentication error states",
        "Improve due date timezone handling",
        "Add drag preview to Kanban cards",
        "Expose API validation details in forms",
        "Create activity timeline for issue updates",
        "Add quick search keyboard shortcut",
        "Restore filters after browser navigation",
        "Audit contrast for priority indicators",
        "Add pagination metadata to the API client",
        "Handle offline mutation failures gracefully",
        "Improve upload progress feedback",
        "Add team directory role filters",
        "Reduce initial JavaScript bundle size"
    ];

    private static readonly string[] Descriptions =
    [
        "The current experience loses useful context. Update the flow so people can continue without repeating work, and include clear recovery guidance.",
        "Build the smallest accessible version first. Preserve keyboard behavior, meaningful labels, loading feedback, and a stable URL throughout the change.",
        "The API contract is already stable. Keep the request shape unchanged and surface validation errors next to the field that needs attention.",
        "Product teams need a predictable interaction on desktop and mobile. Verify the empty, loading, success, and error states before closing this issue."
    ];

    private static readonly string[][] Tags =
    [
        ["frontend", "accessibility"],
        ["workflow", "productivity"],
        ["api", "reliability"],
        ["design-system"],
        ["performance"],
        ["authentication", "security"],
        ["responsive", "mobile"],
        ["testing"]
    ];

    public static async Task InitializeAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var storage = scope.ServiceProvider.GetRequiredService<AttachmentStorage>();

        await db.Database.MigrateAsync(cancellationToken);
        storage.EnsureCreated();

        if (!await db.Members.AnyAsync(cancellationToken))
        {
            await SeedProductDataAsync(db, storage, cancellationToken);
        }

        await SeedIdentityAsync(userManager, roleManager);
    }

    private static async Task SeedProductDataAsync(
        AppDbContext db,
        AttachmentStorage storage,
        CancellationToken cancellationToken)
    {
        var members = new[]
        {
            Member(1, "Jordan Davis", "jordan@issueflow.dev", "Admin", "JD", "green"),
            Member(2, "Maya Chen", "maya@issueflow.dev", "Developer", "MC", "violet"),
            Member(3, "Theo Martin", "theo@issueflow.dev", "Developer", "TM", "blue"),
            Member(4, "Nora Singh", "nora@issueflow.dev", "Product", "NS", "orange"),
            Member(5, "Alex Rivera", "alex@issueflow.dev", "Designer", "AR", "teal"),
            Member(6, "Sam Okafor", "sam@issueflow.dev", "Developer", "SO", "rose"),
            Member(7, "Iris Park", "iris@issueflow.dev", "Product", "IP", "violet"),
            Member(8, "Leo Fischer", "leo@issueflow.dev", "Designer", "LF", "blue")
        };

        db.Members.AddRange(members);

        var statuses = new[]
        {
            IssueStatus.InProgress, IssueStatus.Open, IssueStatus.Open, IssueStatus.Resolved,
            IssueStatus.Closed, IssueStatus.Open, IssueStatus.InProgress, IssueStatus.Resolved
        };
        var priorities = new[]
        {
            IssuePriority.Critical, IssuePriority.High, IssuePriority.Medium, IssuePriority.High,
            IssuePriority.Low, IssuePriority.Medium, IssuePriority.High, IssuePriority.Low
        };
        var anchor = new DateTimeOffset(2026, 8, 27, 9, 0, 0, TimeSpan.Zero);
        var issues = new List<Issue>(72);

        for (var index = 0; index < 72; index++)
        {
            var title = Titles[index % Titles.Length] +
                (index >= Titles.Length ? $" · {index / Titles.Length + 1}" : "");
            var createdAt = anchor.AddDays(-(42 - index % 38)).AddHours(-(index % 5));
            var candidateUpdatedAt = anchor.AddDays(-(index / 4)).AddHours(-(index % 7));
            var issue = new Issue
            {
                Id = 248 - index,
                Title = title,
                NormalizedTitle = title.ToUpperInvariant(),
                Description = Descriptions[index % Descriptions.Length],
                Status = statuses[index % statuses.Length],
                Priority = priorities[index % priorities.Length],
                Assignee = index % 7 == 6 ? null : members[(index + 1) % members.Length],
                Reporter = members[index % members.Length],
                TagsJson = JsonSerializer.Serialize(Tags[index % Tags.Length]),
                DueDate = index % 4 == 0
                    ? null
                    : DateOnly.FromDateTime(anchor.UtcDateTime.AddDays(index % 24 + 2)),
                CreatedAt = createdAt,
                UpdatedAt = candidateUpdatedAt < createdAt ? createdAt.AddHours(1) : candidateUpdatedAt
            };
            issues.Add(issue);
        }

        db.Issues.AddRange(issues);
        db.Comments.AddRange(
            new Comment
            {
                Id = 1,
                Issue = issues[0],
                Author = members[3],
                Body = "I reproduced this after waking Chrome with the tab in the background. The refresh request is never retried.",
                CreatedAt = anchor.AddDays(-1).AddHours(-2)
            },
            new Comment
            {
                Id = 2,
                Issue = issues[0],
                Author = members[1],
                Body = "I have a fix in progress. It preserves the original destination and announces the session recovery state.",
                CreatedAt = anchor.AddHours(-3)
            },
            new Comment
            {
                Id = 3,
                Issue = issues[1],
                Author = members[0],
                Body = "Let's keep the first version to status and assignee changes so the interaction stays easy to understand.",
                CreatedAt = anchor.AddDays(-2).AddHours(-1)
            });

        const string seedFileName = "seed-session-network-trace.txt";
        var seedFilePath = storage.GetPath(seedFileName);
        const string seedFileBody = "IssueFlow seed attachment: session refresh network trace.\n";
        if (!File.Exists(seedFilePath))
        {
            await File.WriteAllTextAsync(seedFilePath, seedFileBody, cancellationToken);
        }

        db.Attachments.Add(new Attachment
        {
            Id = 1,
            Issue = issues[0],
            OriginalFileName = "session-network-trace.txt",
            StoredFileName = seedFileName,
            ContentType = "text/plain",
            Size = new FileInfo(seedFilePath).Length,
            CreatedAt = anchor.AddDays(-1)
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedIdentityAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        const string adminRole = "Admin";
        if (!await roleManager.RoleExistsAsync(adminRole))
        {
            var roleResult = await roleManager.CreateAsync(new IdentityRole(adminRole));
            EnsureSuccess(roleResult, "create the demo role");
        }

        var user = await userManager.FindByEmailAsync(DemoEmail);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = DemoEmail,
                Email = DemoEmail,
                EmailConfirmed = true,
                DisplayName = "Jordan Davis",
                MemberId = 1
            };
            var userResult = await userManager.CreateAsync(user, DemoPassword);
            EnsureSuccess(userResult, "create the demo user");
        }

        if (!await userManager.IsInRoleAsync(user, adminRole))
        {
            var roleResult = await userManager.AddToRoleAsync(user, adminRole);
            EnsureSuccess(roleResult, "assign the demo role");
        }
    }

    private static void EnsureSuccess(IdentityResult result, string action)
    {
        if (result.Succeeded)
        {
            return;
        }

        throw new InvalidOperationException(
            $"Failed to {action}: {string.Join("; ", result.Errors.Select(error => error.Description))}");
    }

    private static Member Member(long id, string name, string email, string role, string initials, string color) =>
        new()
        {
            Id = id,
            DisplayName = name,
            Email = email,
            AvatarUrl = null,
            Role = role,
            Initials = initials,
            Color = color
        };
}
