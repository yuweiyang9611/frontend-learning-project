using Microsoft.AspNetCore.Identity;

namespace IssueFlow.Api.Models;

public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = "";
    public bool NotifyAssigned { get; set; } = true;
    public bool NotifyMentions { get; set; } = true;
    public bool NotifyDigest { get; set; }
    public long? MemberId { get; set; }
}
