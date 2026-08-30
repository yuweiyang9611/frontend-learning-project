using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace IssueFlow.Api.Tests;

public sealed class SharedContractCorpusTests(IssueFlowApiFactory factory)
    : IClassFixture<IssueFlowApiFactory>
{
    [Fact]
    public async Task AllSharedHttpCasesMatchTheDotNetAdapter()
    {
        var corpusPath = Path.Combine(
            AppContext.BaseDirectory,
            "ContractCases",
            "http-cases.json");
        using var corpus = JsonDocument.Parse(await File.ReadAllTextAsync(corpusPath));
        var root = corpus.RootElement;
        var login = root.GetProperty("login");
        var executedIds = new List<string>();

        foreach (var sourceCase in root.GetProperty("cases").EnumerateArray())
        {
            var id = sourceCase.GetProperty("id").GetString()
                ?? throw new InvalidOperationException("Every case must have an ID.");
            executedIds.Add(id);

            using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                HandleCookies = true
            });

            if (sourceCase.GetProperty("auth").GetBoolean())
            {
                using var loginRequest = JsonRequest(
                    HttpMethod.Post,
                    login.GetProperty("path").GetString()!,
                    login.GetProperty("body").GetRawText());
                using var loginResponse = await client.SendAsync(loginRequest);
                Assert.Equal(
                    login.GetProperty("expect").GetProperty("status").GetInt32(),
                    (int)loginResponse.StatusCode);
            }

            var requestDefinition = sourceCase.GetProperty("request");
            var method = new HttpMethod(requestDefinition.GetProperty("method").GetString()!);
            var path = requestDefinition.GetProperty("path").GetString()!;
            var runId = Guid.NewGuid().ToString("N");
            using var request = new HttpRequestMessage(method, path);

            if (requestDefinition.TryGetProperty("rawBody", out var rawBody))
            {
                request.Content = JsonContent(ReplacePlaceholders(rawBody.GetString()!, id, runId));
            }
            else if (requestDefinition.TryGetProperty("body", out var body))
            {
                request.Content = JsonContent(ReplacePlaceholders(body.GetRawText(), id, runId));
            }

            using var response = await client.SendAsync(request);
            var expectation = sourceCase.GetProperty("expect");
            var expectedStatus = expectation.GetProperty("status").GetInt32();
            Assert.True(
                (int)response.StatusCode == expectedStatus,
                $"{id} expected {expectedStatus} but received {(int)response.StatusCode}.");

            var expectedContentType = expectation.GetProperty("contentType").GetString();
            Assert.Equal(expectedContentType, response.Content.Headers.ContentType?.MediaType);

            using var responseJson = JsonDocument.Parse(await response.Content.ReadAsStreamAsync());
            if (expectation.TryGetProperty("jsonKind", out var jsonKind))
            {
                var expectedKind = jsonKind.GetString() == "array"
                    ? JsonValueKind.Array
                    : JsonValueKind.Object;
                Assert.Equal(expectedKind, responseJson.RootElement.ValueKind);
            }

            if (expectation.TryGetProperty("requiredJsonPaths", out var requiredPaths))
            {
                foreach (var requiredPath in requiredPaths.EnumerateArray())
                {
                    Assert.True(
                        HasJsonPath(responseJson.RootElement, requiredPath.GetString()!),
                        $"{id} response is missing {requiredPath.GetString()}.");
                }
            }

            if (sourceCase.TryGetProperty("cleanup", out var cleanup))
            {
                var cleanupPath = cleanup.GetProperty("path").GetString()!
                    .Replace(
                        "{{response.id}}",
                        responseJson.RootElement.GetProperty("id").GetRawText(),
                        StringComparison.Ordinal);
                using var cleanupRequest = new HttpRequestMessage(
                    new HttpMethod(cleanup.GetProperty("method").GetString()!),
                    cleanupPath);
                using var cleanupResponse = await client.SendAsync(cleanupRequest);
                Assert.Equal(
                    cleanup.GetProperty("expect").GetProperty("status").GetInt32(),
                    (int)cleanupResponse.StatusCode);
                Assert.Empty(await cleanupResponse.Content.ReadAsByteArrayAsync());
            }

            var logout = root.GetProperty("logout");
            using var logoutRequest = new HttpRequestMessage(
                new HttpMethod(logout.GetProperty("method").GetString()!),
                logout.GetProperty("path").GetString()!);
            using var logoutResponse = await client.SendAsync(logoutRequest);
            Assert.Equal(
                logout.GetProperty("expect").GetProperty("status").GetInt32(),
                (int)logoutResponse.StatusCode);
        }

        Assert.Equal(
            ["R01", "R02", "R03", "R04", "R05", "R06",
             "W01", "W02", "W03", "W04", "W05", "W06",
             "S01", "S02", "S03", "S04", "S05", "S06"],
            executedIds);
    }

    private static HttpRequestMessage JsonRequest(HttpMethod method, string path, string json)
    {
        var request = new HttpRequestMessage(method, path)
        {
            Content = JsonContent(json)
        };
        return request;
    }

    private static StringContent JsonContent(string json) =>
        new(json, Encoding.UTF8, "application/json");

    private static string ReplacePlaceholders(string json, string id, string runId) =>
        json.Replace("{{uniqueTitle}}", $"Contract {id} {runId}", StringComparison.Ordinal);

    private static bool HasJsonPath(JsonElement root, string path)
    {
        var current = root;
        foreach (var segment in path.Split('.', StringSplitOptions.RemoveEmptyEntries))
        {
            if (current.ValueKind != JsonValueKind.Object ||
                !current.TryGetProperty(segment, out current))
            {
                return false;
            }
        }
        return true;
    }
}
