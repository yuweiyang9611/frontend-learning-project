namespace IssueFlow.Api.Features.Authentication;

public sealed record LoginRequest(string? Email, string? Password);

public sealed record SessionResponse(
    string Email,
    string DisplayName,
    string Initials,
    string Role);
