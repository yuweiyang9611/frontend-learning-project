function extractYamlRunCommands(content) {
  const lines = content.split(/\r?\n/);
  const commands = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\s*)run:\s*(.*?)\s*$/.exec(lines[index]);
    if (!match) continue;

    const runIndent = match[1].length;
    const scalar = match[2];
    if (scalar && !/^[>|][+-]?$/.test(scalar)) {
      commands.push(scalar);
      continue;
    }

    for (index += 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (line.trim() === "") continue;
      const indentation = /^\s*/.exec(line)[0].length;
      if (indentation <= runIndent) {
        index -= 1;
        break;
      }
      if (!line.trimStart().startsWith("#")) commands.push(line.trim());
    }
  }

  return commands;
}

function executesCommand(runCommands, requiredCommand) {
  return runCommands
    .flatMap((line) => line.split(/&&|\|\||;/))
    .map((segment) => segment.trim())
    .some(
      (segment) =>
        segment === requiredCommand ||
        segment.startsWith(`${requiredCommand} `),
    );
}

export function validateLearnerFileContent(target, content, check) {
  const failures = [];
  const isYaml = /\.ya?ml$/i.test(target);
  const searchableContent = isYaml
    ? content
        .split(/\r?\n/)
        .filter((line) => !line.trimStart().startsWith("#"))
        .join("\n")
    : content;
  if ([...content.trim()].length < check.minimumCharacters)
    failures.push("file is too short");
  if (/\b(?:TODO|TBD)\b|待填写/i.test(content))
    failures.push("file still contains a placeholder");
  for (const requiredText of check.requiredText) {
    const present =
      isYaml && /^[A-Za-z][A-Za-z0-9-]*$/.test(requiredText)
        ? new RegExp(`\\b${requiredText}\\b`).test(searchableContent)
        : searchableContent.includes(requiredText);
    if (!present) failures.push(`missing required text: ${requiredText}`);
  }
  if (isYaml) {
    const runCommands = extractYamlRunCommands(content);
    for (const requiredCommand of check.requiredCommands ?? []) {
      if (!executesCommand(runCommands, requiredCommand)) {
        failures.push(`missing required command: ${requiredCommand}`);
      }
    }
  }
  return failures;
}
