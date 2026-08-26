using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace IssueFlow.Api.Tests;

public sealed class ApiContractTests(IssueFlowApiFactory factory)
    : IClassFixture<IssueFlowApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false,
        HandleCookies = true
    });

    [Fact]
    public async Task Health_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = await ReadJsonAsync(response);
        Assert.Equal("ok", json.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task IssueList_ReturnsSeededPagedSnakeCaseContract()
    {
        var response = await _client.GetAsync(
            "/api/issues?page=1&pageSize=5&status=in_progress&sortBy=priority&sortDirection=desc");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = await ReadJsonAsync(response);
        var root = json.RootElement;
        Assert.Equal(1, root.GetProperty("page").GetInt32());
        Assert.Equal(5, root.GetProperty("pageSize").GetInt32());
        Assert.True(root.GetProperty("total").GetInt32() > 5);
        var items = root.GetProperty("items");
        Assert.Equal(5, items.GetArrayLength());
        Assert.All(items.EnumerateArray(), item =>
        {
            Assert.Equal("in_progress", item.GetProperty("status").GetString());
            Assert.StartsWith("IF-", item.GetProperty("key").GetString());
            Assert.True(item.GetProperty("reporter").TryGetProperty("initials", out _));
            Assert.Equal(JsonValueKind.Array, item.GetProperty("tags").ValueKind);
        });
    }

    [Fact]
    public async Task InvalidIssueQuery_ReturnsValidationProblem()
    {
        var response = await _client.GetAsync("/api/issues?page=0&pageSize=101&status=waiting");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var json = await ReadJsonAsync(response);
        var errors = json.RootElement.GetProperty("errors");
        Assert.True(errors.TryGetProperty("page", out _));
        Assert.True(errors.TryGetProperty("pageSize", out _));
        Assert.True(errors.TryGetProperty("status", out _));
    }

    [Fact]
    public async Task UnknownIssue_ReturnsProblemDetails404()
    {
        var response = await _client.GetAsync("/api/issues/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var json = await ReadJsonAsync(response);
        Assert.Equal(404, json.RootElement.GetProperty("status").GetInt32());
        Assert.True(json.RootElement.TryGetProperty("traceId", out _));
    }

    [Fact]
    public async Task AnonymousCreate_ReturnsProblemDetails401()
    {
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = false
        });

        var response = await client.PostAsJsonAsync("/api/issues", ValidIssue("Anonymous issue"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task CorsPreflight_AllowsConfiguredFrontendWithCredentials()
    {
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/issues");
        request.Headers.Add("Origin", "http://localhost:3000");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("http://localhost:3000", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
        Assert.Equal("true", response.Headers.GetValues("Access-Control-Allow-Credentials").Single());
    }

    [Fact]
    public async Task AuthenticatedIssueCrud_SupportsPartialPatch()
    {
        await LoginAsync();
        var title = $"Integration issue {Guid.NewGuid():N}";

        var createResponse = await _client.PostAsJsonAsync("/api/issues", ValidIssue(title));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.NotNull(createResponse.Headers.Location);
        using var createdJson = await ReadJsonAsync(createResponse);
        var id = createdJson.RootElement.GetProperty("id").GetInt64();
        Assert.Equal(title, createdJson.RootElement.GetProperty("title").GetString());
        Assert.Equal("open", createdJson.RootElement.GetProperty("status").GetString());

        var patchResponse = await _client.PatchAsJsonAsync(
            $"/api/issues/{id}",
            new { status = "in_progress" });
        Assert.Equal(HttpStatusCode.OK, patchResponse.StatusCode);
        using var patchedJson = await ReadJsonAsync(patchResponse);
        Assert.Equal(title, patchedJson.RootElement.GetProperty("title").GetString());
        Assert.Equal("in_progress", patchedJson.RootElement.GetProperty("status").GetString());

        var deleteResponse = await _client.DeleteAsync($"/api/issues/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await _client.GetAsync($"/api/issues/{id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task InvalidAndDuplicateCreate_ReturnExpectedProblems()
    {
        await LoginAsync();

        var invalidResponse = await _client.PostAsJsonAsync("/api/issues", new
        {
            title = " ",
            description = "",
            status = "open",
            priority = "high",
            tags = Array.Empty<string>()
        });
        Assert.Equal(HttpStatusCode.BadRequest, invalidResponse.StatusCode);
        using var invalidJson = await ReadJsonAsync(invalidResponse);
        Assert.True(invalidJson.RootElement.GetProperty("errors").TryGetProperty("title", out _));

        var title = $"Unique issue {Guid.NewGuid():N}";
        var first = await _client.PostAsJsonAsync("/api/issues", ValidIssue(title));
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var duplicate = await _client.PostAsJsonAsync("/api/issues", ValidIssue(title.ToUpperInvariant()));
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        using var duplicateJson = await ReadJsonAsync(duplicate);
        Assert.True(duplicateJson.RootElement.GetProperty("errors").TryGetProperty("title", out _));
    }

    [Fact]
    public async Task InvalidJsonEnumAndQueryBinding_ReturnProblemDetails()
    {
        await LoginAsync();
        var invalidEnum = await _client.PostAsJsonAsync("/api/issues", new
        {
            title = "Invalid enum contract",
            description = "",
            status = "waiting",
            priority = "high",
            tags = Array.Empty<string>()
        });
        Assert.Equal(HttpStatusCode.BadRequest, invalidEnum.StatusCode);
        Assert.Equal("application/problem+json", invalidEnum.Content.Headers.ContentType?.MediaType);

        var invalidQuery = await _client.GetAsync("/api/issues?page=abc");
        Assert.Equal(HttpStatusCode.BadRequest, invalidQuery.StatusCode);
        Assert.Equal("application/problem+json", invalidQuery.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task MembersCommentsAndTextAttachment_FollowFrontendContract()
    {
        var membersResponse = await _client.GetAsync("/api/members");
        Assert.Equal(HttpStatusCode.OK, membersResponse.StatusCode);
        using var membersJson = await ReadJsonAsync(membersResponse);
        Assert.Equal(8, membersJson.RootElement.GetArrayLength());
        Assert.True(membersJson.RootElement[0].TryGetProperty("color", out _));

        await LoginAsync();
        var commentResponse = await _client.PostAsJsonAsync(
            "/api/issues/248/comments",
            new { body = "Contract test comment" });
        Assert.Equal(HttpStatusCode.Created, commentResponse.StatusCode);
        using var commentJson = await ReadJsonAsync(commentResponse);
        var commentId = commentJson.RootElement.GetProperty("id").GetInt64();
        Assert.Equal("Jordan Davis", commentJson.RootElement.GetProperty("author").GetProperty("displayName").GetString());

        var commentsResponse = await _client.GetAsync("/api/issues/248/comments");
        Assert.Equal(HttpStatusCode.OK, commentsResponse.StatusCode);

        using var content = new MultipartFormDataContent();
        var file = new ByteArrayContent(Encoding.UTF8.GetBytes("IssueFlow attachment test"));
        file.Headers.ContentType = new("text/plain");
        content.Add(file, "file", "evidence.txt");
        var uploadResponse = await _client.PostAsync("/api/issues/248/attachments", content);
        Assert.Equal(HttpStatusCode.Created, uploadResponse.StatusCode);
        using var attachmentJson = await ReadJsonAsync(uploadResponse);
        var downloadUrl = attachmentJson.RootElement.GetProperty("downloadUrl").GetString();
        Assert.NotNull(downloadUrl);

        var downloadResponse = await _client.GetAsync(downloadUrl);
        Assert.Equal(HttpStatusCode.OK, downloadResponse.StatusCode);
        Assert.Equal("attachment", downloadResponse.Content.Headers.ContentDisposition?.DispositionType);

        var deleteComment = await _client.DeleteAsync($"/api/issues/248/comments/{commentId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteComment.StatusCode);
    }

    [Fact]
    public async Task AttachmentUpload_RejectsSpoofedAndOversizedFiles()
    {
        await LoginAsync();

        using var spoofedContent = new MultipartFormDataContent();
        var spoofedFile = new ByteArrayContent(Encoding.UTF8.GetBytes("not a PDF"));
        spoofedFile.Headers.ContentType = new("application/pdf");
        spoofedContent.Add(spoofedFile, "file", "evidence.pdf");
        var spoofedResponse = await _client.PostAsync("/api/issues/248/attachments", spoofedContent);
        Assert.Equal(HttpStatusCode.BadRequest, spoofedResponse.StatusCode);

        using var oversizedContent = new MultipartFormDataContent();
        var oversizedFile = new ByteArrayContent(new byte[5 * 1024 * 1024 + 1]);
        oversizedFile.Headers.ContentType = new("text/plain");
        oversizedContent.Add(oversizedFile, "file", "evidence.txt");
        var oversizedResponse = await _client.PostAsync("/api/issues/248/attachments", oversizedContent);
        Assert.Equal(HttpStatusCode.BadRequest, oversizedResponse.StatusCode);
    }

    private async Task LoginAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "demo@issueflow.dev",
            password = "issueflow"
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private static object ValidIssue(string title) => new
    {
        title,
        description = "Created by the backend integration test.",
        status = "open",
        priority = "high",
        assigneeId = 2,
        tags = new[] { "testing", "api" },
        dueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10))
    };

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        var stream = await response.Content.ReadAsStreamAsync();
        return await JsonDocument.ParseAsync(stream);
    }
}
