using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IssueFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class UserNotificationPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "NotifyAssigned",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyDigest",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyMentions",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotifyAssigned",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "NotifyDigest",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "NotifyMentions",
                table: "AspNetUsers");
        }
    }
}
