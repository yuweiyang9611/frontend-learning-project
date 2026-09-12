using Microsoft.EntityFrameworkCore.Infrastructure;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using IssueFlow.Api.Data;
using IssueFlow.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace IssueFlow.Api.Tests;

public sealed class WorkspaceTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(100)]
    [InlineData(101)]
    [InlineData(250)]
    public async Task OverviewCountsAllRows(int count)
    {
        using var factory = new IssueFlowApiFactory();
        using var client = factory.CreateClient();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Issues.ExecuteDeleteAsync();
            var reporter = await db.Members.FindAsync(1L);
            for (var i = 1; i <= count; i++)
                db.Issues.Add(new Issue { Title = $"Overview {i}", NormalizedTitle = $"OVERVIEW {i}", Description = "", Status = IssueStatus.Open, Priority = IssuePriority.Low, ReporterId = 1, Reporter = reporter!, TagsJson = "[]", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
            await db.SaveChangesAsync();
        }
        var result = await client.GetFromJsonAsync<JsonElement>("/api/workspace/overview");
        Assert.Equal(count, result.GetProperty("total").GetInt32());
        Assert.Equal(count, result.GetProperty("byStatus").GetProperty("open").GetInt32());
        Assert.Equal(Math.Min(6, count), result.GetProperty("recentIssues").GetArrayLength());
        Assert.Equal(0, result.GetProperty("focus").GetProperty("relatedCount").GetInt32());
    }

    [Fact]
    public async Task SettingsPersistAcrossSessionsAndAreIsolated()
    {
        using var factory = new IssueFlowApiFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true, AllowAutoRedirect = false });
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/me/settings")).StatusCode);
        (await client.PostAsJsonAsync("/api/auth/login", new { email = "demo@issueflow.dev", password = "issueflow" })).EnsureSuccessStatusCode();
        (await client.PatchAsJsonAsync("/api/me/profile", new { displayName = " New Name " })).EnsureSuccessStatusCode();
        (await client.PutAsJsonAsync("/api/me/preferences", new { assigned = false, mentions = false, digest = true })).EnsureSuccessStatusCode();
        await client.PostAsync("/api/auth/logout", null);
        (await client.PostAsJsonAsync("/api/auth/login", new { email = "demo@issueflow.dev", password = "issueflow" })).EnsureSuccessStatusCode();
        var settings = await client.GetFromJsonAsync<JsonElement>("/api/me/settings");
        Assert.Equal("New Name", settings.GetProperty("session").GetProperty("displayName").GetString());
        Assert.True(settings.GetProperty("notifications").GetProperty("digest").GetBoolean());
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Equal("New Name", (await db.Members.FindAsync(1L))!.DisplayName);
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var other = new ApplicationUser { Email = "alice@example.com", UserName = "alice@example.com", DisplayName = "Other", MemberId = 8 };
            Assert.True((await users.CreateAsync(other, "password")).Succeeded);
        }
        using var second = factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        (await second.PostAsJsonAsync("/api/auth/login", new { email = "alice@example.com", password = "password" })).EnsureSuccessStatusCode();
        var otherSettings = await second.GetFromJsonAsync<JsonElement>("/api/me/settings");
        Assert.False(otherSettings.GetProperty("notifications").GetProperty("digest").GetBoolean());
        Assert.Equal("Other", otherSettings.GetProperty("session").GetProperty("displayName").GetString());
    }

    [Fact]
    public async Task SettingsRejectInvalidOrCrossOriginChanges()
    {
        using var factory = new IssueFlowApiFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true, AllowAutoRedirect = false });
        await client.PostAsJsonAsync("/api/auth/login", new { email = "demo@issueflow.dev", password = "issueflow" });
        foreach (var name in new[] { "", "   ", new string('x', 101) })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PatchAsJsonAsync("/api/me/profile", new { displayName = name })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PatchAsJsonAsync("/api/me/profile", new { displayName = "OK", email = "alice@example.com" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync("/api/me/preferences", new { assigned = "yes", mentions = true, digest = false })).StatusCode);
        client.DefaultRequestHeaders.Add("Origin", "https://evil.example");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PatchAsJsonAsync("/api/me/profile", new { displayName = "OK" })).StatusCode);
    }
    [Fact]
    public async Task ExistingDatabaseUpgradePreservesIdentityAndProductData()
    {
        using var factory = new IssueFlowApiFactory();
        using var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.True(Path.IsPathRooted(db.Database.GetDbConnection().DataSource));
        var issues = await db.Issues.CountAsync();
        var comments = await db.Comments.CountAsync();
        var migrator = db.Database.GetService<Microsoft.EntityFrameworkCore.Migrations.IMigrator>();
        await migrator.MigrateAsync("20260826172358_InitialCreate");
        await migrator.MigrateAsync();
        Assert.Equal(issues, await db.Issues.CountAsync());
        Assert.Equal(comments, await db.Comments.CountAsync());
        var user = await db.Users.AsNoTracking().SingleAsync(u => u.Email == "demo@issueflow.dev");
        Assert.True(user.NotifyAssigned);
        Assert.True(user.NotifyMentions);
        Assert.False(user.NotifyDigest);
    }

}
