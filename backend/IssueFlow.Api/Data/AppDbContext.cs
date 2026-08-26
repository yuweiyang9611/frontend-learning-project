using IssueFlow.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace IssueFlow.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Issue> Issues => Set<Issue>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Attachment> Attachments => Set<Attachment>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        var dateTimeOffsetConverter = new ValueConverter<DateTimeOffset, long>(
            value => value.ToUnixTimeMilliseconds(),
            value => DateTimeOffset.FromUnixTimeMilliseconds(value));

        builder.Entity<Member>(entity =>
        {
            entity.Property(member => member.DisplayName).HasMaxLength(100);
            entity.Property(member => member.Email).HasMaxLength(254);
            entity.Property(member => member.AvatarUrl).HasMaxLength(2048);
            entity.Property(member => member.Role).HasMaxLength(32);
            entity.Property(member => member.Initials).HasMaxLength(4);
            entity.Property(member => member.Color).HasMaxLength(16);
            entity.HasIndex(member => member.Email).IsUnique();
        });

        builder.Entity<Issue>(entity =>
        {
            entity.Property(issue => issue.Title).HasMaxLength(100);
            entity.Property(issue => issue.NormalizedTitle).HasMaxLength(100);
            entity.Property(issue => issue.Description).HasMaxLength(5000);
            entity.Property(issue => issue.TagsJson).HasColumnName("Tags").HasDefaultValue("[]");
            entity.Property(issue => issue.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(issue => issue.Priority).HasConversion<string>().HasMaxLength(16);
            entity.Property(issue => issue.CreatedAt).HasConversion(dateTimeOffsetConverter);
            entity.Property(issue => issue.UpdatedAt).HasConversion(dateTimeOffsetConverter);
            entity.HasIndex(issue => issue.NormalizedTitle).IsUnique();
            entity.HasIndex(issue => issue.UpdatedAt);
            entity.HasIndex(issue => new { issue.Status, issue.Priority });
            entity.HasIndex(issue => issue.AssigneeId);
            entity.HasOne(issue => issue.Assignee)
                .WithMany(member => member.AssignedIssues)
                .HasForeignKey(issue => issue.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(issue => issue.Reporter)
                .WithMany(member => member.ReportedIssues)
                .HasForeignKey(issue => issue.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Comment>(entity =>
        {
            entity.Property(comment => comment.Body).HasMaxLength(4000);
            entity.Property(comment => comment.CreatedAt).HasConversion(dateTimeOffsetConverter);
            entity.HasIndex(comment => new { comment.IssueId, comment.CreatedAt });
            entity.HasOne(comment => comment.Issue)
                .WithMany(issue => issue.Comments)
                .HasForeignKey(comment => comment.IssueId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(comment => comment.Author)
                .WithMany(member => member.Comments)
                .HasForeignKey(comment => comment.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Attachment>(entity =>
        {
            entity.Property(attachment => attachment.OriginalFileName).HasMaxLength(255);
            entity.Property(attachment => attachment.StoredFileName).HasMaxLength(80);
            entity.Property(attachment => attachment.ContentType).HasMaxLength(100);
            entity.Property(attachment => attachment.CreatedAt).HasConversion(dateTimeOffsetConverter);
            entity.HasIndex(attachment => new { attachment.IssueId, attachment.CreatedAt });
            entity.HasIndex(attachment => attachment.StoredFileName).IsUnique();
            entity.HasOne(attachment => attachment.Issue)
                .WithMany(issue => issue.Attachments)
                .HasForeignKey(attachment => attachment.IssueId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
