CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`issue_id` integer NOT NULL,
	`object_key` text,
	`original_file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_attachments_issue_created_at` ON `attachments` (`issue_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`issue_id` integer NOT NULL,
	`author_id` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_comments_issue_created_at` ON `comments` (`issue_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `issues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`issue_key` text NOT NULL,
	`title` text COLLATE NOCASE NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text NOT NULL CHECK (`status` IN ('open', 'in_progress', 'resolved', 'closed')),
	`priority` text NOT NULL CHECK (`priority` IN ('low', 'medium', 'high', 'critical')),
	`assignee_id` integer,
	`reporter_id` integer NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`due_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assignee_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reporter_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_issues_issue_key` ON `issues` (`issue_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_issues_title_nocase` ON `issues` (`title`);--> statement-breakpoint
CREATE INDEX `idx_issues_updated_at` ON `issues` (`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_issues_status_updated_at` ON `issues` (`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_issues_priority_updated_at` ON `issues` (`priority`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_issues_assignee_updated_at` ON `issues` (`assignee_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `local_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text COLLATE NOCASE NOT NULL,
	`display_name` text NOT NULL,
	`initials` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_local_sessions_expires_at` ON `local_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`avatar_url` text,
	`role` text NOT NULL,
	`initials` text NOT NULL,
	`color` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_members_email` ON `members` (`email`);
--> statement-breakpoint
PRAGMA optimize;
