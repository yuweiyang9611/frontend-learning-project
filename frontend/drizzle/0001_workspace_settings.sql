CREATE TABLE `app_metadata` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`subject` text PRIMARY KEY NOT NULL,
	`member_id` integer NOT NULL,
	`display_name` text NOT NULL,
	`assigned` integer DEFAULT true NOT NULL,
	`mentions` integer DEFAULT true NOT NULL,
	`digest` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_settings_member` ON `user_settings` (`member_id`);--> statement-breakpoint
DROP INDEX IF EXISTS ux_issues_title_nocase;
--> statement-breakpoint
CREATE UNIQUE INDEX ux_issues_title_nocase ON issues (title COLLATE NOCASE);
--> statement-breakpoint
DROP INDEX IF EXISTS idx_issues_updated_at;
--> statement-breakpoint
CREATE INDEX idx_issues_updated_at ON issues (updated_at DESC, id DESC);
--> statement-breakpoint
DROP INDEX IF EXISTS ux_members_email;
--> statement-breakpoint
CREATE UNIQUE INDEX ux_members_email ON members (email COLLATE NOCASE);
