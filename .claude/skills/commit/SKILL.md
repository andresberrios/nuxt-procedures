---
name: commit
description: Generate a commit message for staged changes. Analyzes the diff, recent commit history, and conversation context to produce a conventional-commit-style message with a detailed bullet-point body. Copies the message to the clipboard and shows it for review.
argument-hint: "[optional: extra context or instructions for the commit message]"
allowed-tools: Bash, Read
---

You are generating a Git commit message for the user to review, edit, and commit themselves.

The user's optional extra context is:

$ARGUMENTS

---

## Step 1 — Gather context

Run these three commands in parallel using the Bash tool:

1. `git diff --cached --stat` — summary of staged file changes
2. `git diff --cached -- . ':!pnpm-lock.yaml' ':!package-lock.json' ':!yarn.lock' | head -500` — the staged diff excluding lockfiles, truncated to keep context manageable
3. `git log --oneline --no-merges -10` — recent non-merge commit messages for style reference

If there are no staged changes (empty stat output), tell the user "No staged changes to commit." and stop.

**Note:** If any Bash output is too large and gets persisted to a file, use the Read tool to access it.

---

## Step 1b — Fill in gaps if the diff was truncated

Compare the stat output against what the truncated diff covered. If the diff was cut off before reaching files that look relevant to understanding the *intent* of the commit (e.g., source code files, config changes, migration files), run a targeted follow-up:

```bash
git diff --cached -- <specific-file-or-directory> | head -200
```

Skip this step if:
- The truncated diff already covered the important files
- The remaining files in the stat are clearly secondary (e.g., test snapshots, generated assets)
- The conversation history already provides enough context about the changes

This step matters most in fresh sessions where there is no conversation history to rely on.

---

## Step 2 — Consider conversation context

Review the conversation history from this session. If the conversation is related to the staged changes (e.g., you helped the user write the code, fix a bug, implement a feature, or refactor something that appears in the diff), use that context to write a more accurate and meaningful commit message — you'll understand the *intent* and *why* behind the changes, not just the *what*.

If there is no conversation history (fresh session) or the conversation is unrelated to the staged changes, rely on the diff, stat, and commit history alone.

---

## Step 3 — Generate the commit message

Using the gathered context, write a commit message following these rules:

**Requirements:**
- Use imperative mood ("Add", "Fix", "Update" not "Added", "Fixed", "Updated")
- Follow conventional commit format with a detailed body
- Subject line should be max 72 characters, descriptive and clear
- Do NOT manually wrap or break lines in the body — write each bullet point as a single long line and let the UI handle wrapping
- Include a detailed body using bullet points to explain changes
- Use bullet points (- ) to list what was changed, added, or fixed
- Use conventional commit prefixes:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `style:` for formatting changes
  - `refactor:` for code restructuring
  - `test:` for adding/updating tests
  - `chore:` for maintenance tasks
  - `perf:` for performance improvements
  - `ci:` for CI/CD changes

**Format:**
```
<type>(<scope>): <subject>

- First change or addition
- Second change or improvement
- Third change if applicable
- Why this change was needed (if relevant)
```

**No escaping in commit messages:** Never add backslashes to escape characters (dots, dashes, underscores, etc.) in file paths, package names, or any other text in the commit message. The message is plain text, not a regex or shell command — write it literally.

**Style matching:** Follow the established patterns from the recent commit history. If the repo uses a particular style or scope convention, match it.

**If $ARGUMENTS is non-empty**, incorporate the user's extra context into the message (e.g., clarifying intent, adding a scope, or emphasizing certain changes).

---

## Step 4 — Copy to clipboard and output

1. Copy the commit message to the system clipboard using `pbcopy` via the Bash tool. Pass the message via a heredoc to preserve formatting:

```bash
cat <<'EOF' | pbcopy
<the generated commit message>
EOF
```

2. Show the commit message in a fenced code block so the user can review it.

3. Tell the user: **Commit message copied to clipboard.** Paste it into the commit message box with Cmd+V.

Do NOT create the commit. The user will review, edit if needed, and commit manually.

Do NOT include any co-authorship attribution (e.g., `Co-Authored-By`) for AI models or agents in the commit message.