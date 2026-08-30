import { spawnSync } from "node:child_process";
import process from "node:process";

const dayFlag = process.argv.indexOf("--day");
const directDay = process.argv.find((value) => /^\d{1,2}$/.test(value));
const rawDay =
  process.env.LEARNING_DAY ??
  directDay ??
  (dayFlag >= 0 ? process.argv[dayFlag + 1] : undefined);
const learningDay = rawDay === undefined ? null : Number(rawDay);

if (
  learningDay !== null &&
  (!Number.isInteger(learningDay) || learningDay < 1 || learningDay > 91)
) {
  console.error(
    "Choose a learning day from 1 to 91, for example: npm run learn:check -- --day 71",
  );
  process.exit(1);
}

const dotnetRequired = learningDay !== null && learningDay >= 71;
const npmInvocation = process.env.npm_execpath
  ? {
      command: process.execPath,
      args: [process.env.npm_execpath, "--version"],
      shell: false,
    }
  : process.platform === "win32"
    ? {
        command: process.env.ComSpec ?? "cmd.exe",
        args: ["/d", "/s", "/c", "npm --version"],
        shell: false,
      }
    : { command: "npm", args: ["--version"], shell: false };

const checks = [
  {
    name: "Node.js",
    command: "node",
    args: ["--version"],
    required: /^v(2[2-9]|[3-9]\d)\./,
  },
  {
    name: "npm",
    ...npmInvocation,
    required: /^(1[1-9]|[2-9]\d)\./,
  },
  { name: "Git", command: "git", args: ["--version"] },
  {
    name: ".NET SDK",
    command: "dotnet",
    args: ["--version"],
    required: /^10\./,
    optionalUntilDay71: true,
  },
];

let failed = false;
let warned = false;
for (const check of checks) {
  const result = spawnSync(check.command, check.args, {
    encoding: "utf8",
    shell: check.shell ?? false,
  });
  const output = (result.stdout || result.stderr || "").trim();
  const valid =
    result.status === 0 && (!check.required || check.required.test(output));
  const optional = check.optionalUntilDay71 === true && !dotnetRequired;
  const status = valid ? "PASS" : optional ? "WARN" : "FAIL";
  console.log(status, check.name.padEnd(10), output || "not found");
  failed ||= !valid && !optional;
  warned ||= !valid && optional;
}

if (failed) {
  const scope =
    learningDay === null ? "the current learning stage" : `Day ${learningDay}`;
  console.error(
    `\nInstall or repair the failed prerequisite required for ${scope}, open a new terminal, then rerun this check.`,
  );
  process.exitCode = 1;
} else if (warned) {
  console.log(
    "\nThe frontend prerequisites are ready. .NET SDK 10 is optional through Day 70 and becomes required on Day 71.",
  );
} else {
  console.log(
    `\nYour machine is ready${learningDay === null ? "" : ` for Day ${learningDay}`}.`,
  );
}
