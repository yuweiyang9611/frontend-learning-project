using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace IssueFlow.Api.Tests;

public sealed class IssueFlowApiFactory : WebApplicationFactory<Program>
{
    private readonly string _testDirectory = Path.Combine(
        Path.GetTempPath(),
        "IssueFlow.Api.Tests",
        Guid.NewGuid().ToString("N"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Directory.CreateDirectory(_testDirectory);
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = $"Data Source={Path.Combine(_testDirectory, "issueflow-tests.db")}",
                ["AttachmentStorage:Path"] = Path.Combine(_testDirectory, "uploads"),
                ["Frontend:Origins:0"] = "http://localhost:3000"
            });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (!disposing || !Directory.Exists(_testDirectory))
        {
            return;
        }

        try
        {
            Directory.Delete(_testDirectory, recursive: true);
        }
        catch (IOException)
        {
            // SQLite may release the final handle just after the test host is disposed.
        }
        catch (UnauthorizedAccessException)
        {
            // A failed cleanup must not hide the integration-test result.
        }
    }
}
