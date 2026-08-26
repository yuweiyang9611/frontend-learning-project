using System.Text.Json;
using System.Text.Json.Serialization;
using IssueFlow.Api.Data;
using IssueFlow.Api.Features.Attachments;
using IssueFlow.Api.Features.Authentication;
using IssueFlow.Api.Features.Comments;
using IssueFlow.Api.Features.Issues;
using IssueFlow.Api.Features.Members;
using IssueFlow.Api.Infrastructure;
using IssueFlow.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

const string FrontendPolicy = "Frontend";
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Connection string 'Default' is required.");
var frontendOrigins = builder.Configuration.GetSection("Frontend:Origins").Get<string[]>()
    ?? ["http://localhost:3000", "http://localhost:5173"];

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Instance ??= context.HttpContext.Request.Path;
        context.ProblemDetails.Extensions.TryAdd("traceId", context.HttpContext.TraceIdentifier);
    };
});
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower, allowIntegerValues: false));
});

builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.SignIn.RequireConfirmedAccount = false;
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = ".IssueFlow.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.SlidingExpiration = true;
    options.ExpireTimeSpan = TimeSpan.FromDays(14);
    options.Events.OnRedirectToLogin = context => WriteAuthProblemAsync(
        context,
        StatusCodes.Status401Unauthorized,
        "Authentication required",
        "Sign in to perform this operation.");
    options.Events.OnRedirectToAccessDenied = context => WriteAuthProblemAsync(
        context,
        StatusCodes.Status403Forbidden,
        "Access denied",
        "You do not have permission to perform this operation.");
});
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendPolicy, policy =>
        policy
            .WithOrigins(frontendOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.Configure<AttachmentStorageOptions>(
    builder.Configuration.GetSection(AttachmentStorageOptions.SectionName));
builder.Services.AddSingleton<AttachmentStorage>();
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = AttachmentFilePolicy.MaxFileSize + 1024 * 1024;
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages(async statusCodeContext =>
{
    var response = statusCodeContext.HttpContext.Response;
    if (response.HasStarted || response.ContentLength is > 0 || !string.IsNullOrEmpty(response.ContentType))
    {
        return;
    }

    await Results.Problem(
            statusCode: response.StatusCode,
            title: ReasonPhrases.GetReasonPhrase(response.StatusCode),
            detail: "The request could not be processed.")
        .ExecuteAsync(statusCodeContext.HttpContext);
});
if (!app.Environment.IsEnvironment("Testing"))
{
    app.UseHttpsRedirection();
}
app.UseCors(FrontendPolicy);
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }))
    .WithName("Health")
    .WithTags("System")
    .Produces(StatusCodes.Status200OK);

app.MapAuthEndpoints();
app.MapIssueEndpoints();
app.MapMemberEndpoints();
app.MapCommentEndpoints();
app.MapAttachmentEndpoints();

await SeedData.InitializeAsync(app.Services);

app.Run();

static Task WriteAuthProblemAsync(
    RedirectContext<CookieAuthenticationOptions> context,
    int statusCode,
    string title,
    string detail) =>
    Results.Problem(statusCode: statusCode, title: title, detail: detail)
        .ExecuteAsync(context.HttpContext);

public partial class Program;
