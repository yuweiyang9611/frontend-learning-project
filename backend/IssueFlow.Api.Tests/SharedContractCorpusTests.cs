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

            var runId = Guid.NewGuid().ToString("N");
            using var request = RequestFrom(sourceCase.GetProperty("request"), id, runId);
            using var response = await client.SendAsync(request);
            var expectation = sourceCase.GetProperty("expect");
            using var responseJson = await AssertContractResponseAsync(id, response, expectation);

            if (sourceCase.TryGetProperty("followUps", out var followUps))
            {
                var responseId = responseJson!.RootElement.GetProperty("id").GetRawText();
                foreach (var followUp in followUps.EnumerateArray())
                {
                    var followUpId = followUp.GetProperty("id").GetString()!;
                    using var followUpRequest = RequestFrom(
                        followUp.GetProperty("request"),
                        id,
                        runId,
                        responseId);
                    using var followUpResponse = await client.SendAsync(followUpRequest);
                    using var followUpJson = await AssertContractResponseAsync(
                        $"{id}:{followUpId}",
                        followUpResponse,
                        followUp.GetProperty("expect"));
                }
            }

            if (sourceCase.TryGetProperty("cleanup", out var cleanup))
            {
                var cleanupPath = cleanup.GetProperty("path").GetString()!
                    .Replace(
                        "{{response.id}}",
                        responseJson!.RootElement.GetProperty("id").GetRawText(),
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

        Assert.NotEmpty(executedIds);
        Assert.Equal(executedIds.Count, executedIds.Distinct(StringComparer.Ordinal).Count());
        Assert.Contains("R07", executedIds);
        Assert.Contains("R08", executedIds);
        Assert.Contains("W07", executedIds);
        Assert.Contains("W08", executedIds);
        Assert.Contains("W09", executedIds);
    }

    private static HttpRequestMessage RequestFrom(
        JsonElement requestDefinition,
        string id,
        string runId,
        string? responseId = null)
    {
        var path = ReplacePlaceholders(requestDefinition.GetProperty("path").GetString()!, id, runId);
        if (responseId is not null)
        {
            path = path.Replace("{{response.id}}", responseId, StringComparison.Ordinal);
        }

        var request = new HttpRequestMessage(
            new HttpMethod(requestDefinition.GetProperty("method").GetString()!),
            path);
        if (requestDefinition.TryGetProperty("rawBody", out var rawBody))
        {
            request.Content = JsonContent(ReplacePlaceholders(rawBody.GetString()!, id, runId));
        }
        else if (requestDefinition.TryGetProperty("body", out var body))
        {
            var bodyText = ReplacePlaceholders(body.GetRawText(), id, runId);
            if (responseId is not null)
            {
                bodyText = bodyText.Replace("{{response.id}}", responseId, StringComparison.Ordinal);
            }
            request.Content = JsonContent(bodyText);
        }
        return request;
    }

    private static async Task<JsonDocument?> AssertContractResponseAsync(
        string label,
        HttpResponseMessage response,
        JsonElement expectation)
    {
        var expectedStatus = expectation.GetProperty("status").GetInt32();
        Assert.True(
            (int)response.StatusCode == expectedStatus,
            $"{label} expected {expectedStatus} but received {(int)response.StatusCode}.");

        if (expectation.TryGetProperty("contentType", out var contentType))
        {
            Assert.Equal(contentType.GetString(), response.Content.Headers.ContentType?.MediaType);
        }

        var responseBytes = await response.Content.ReadAsByteArrayAsync();
        if (expectation.TryGetProperty("jsonKind", out var emptyKind) && emptyKind.GetString() == "empty")
        {
            Assert.Empty(responseBytes);
            return null;
        }

        var expectsJson = expectation.TryGetProperty("contentType", out _) ||
            expectation.TryGetProperty("jsonKind", out _) ||
            expectation.TryGetProperty("requiredJsonPaths", out _) ||
            expectation.TryGetProperty("jsonValues", out _);
        if (!expectsJson)
        {
            return null;
        }

        var responseJson = JsonDocument.Parse(responseBytes);
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
                    TryReadJsonPath(responseJson.RootElement, requiredPath.GetString()!, out _),
                    $"{label} response is missing {requiredPath.GetString()}.");
            }
        }

        if (expectation.TryGetProperty("jsonValues", out var jsonValues))
        {
            foreach (var expectedValue in jsonValues.EnumerateObject())
            {
                Assert.True(
                    TryReadJsonPath(responseJson.RootElement, expectedValue.Name, out var actualValue),
                    $"{label} response is missing {expectedValue.Name}.");
                Assert.Equal(expectedValue.Value.GetRawText(), actualValue.GetRawText());
            }
        }

        return responseJson;
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

    private static bool TryReadJsonPath(JsonElement root, string path, out JsonElement value)
    {
        var current = root;
        foreach (var segment in path.Split('.', StringSplitOptions.RemoveEmptyEntries))
        {
            if (current.ValueKind == JsonValueKind.Object && current.TryGetProperty(segment, out var property))
            {
                current = property;
                continue;
            }
            if (current.ValueKind == JsonValueKind.Array &&
                int.TryParse(segment, out var index) &&
                index >= 0 &&
                index < current.GetArrayLength())
            {
                current = current[index];
                continue;
            }
            value = default;
            return false;
        }
        value = current;
        return true;
    }
}
