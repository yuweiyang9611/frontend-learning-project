using Microsoft.AspNetCore.Identity;

namespace IssueFlow.Api.Models;

public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = "";
    public long? MemberId { get; set; }
}
