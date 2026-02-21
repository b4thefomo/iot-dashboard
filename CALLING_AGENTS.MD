# How to Call Agents

This file documents the specific CLI commands used to invoke other AI agents for code review and consultation.

Note, in all cases you must ask for opinions and code reviews. Clearly instruct the other agents that they are NOT to do the actual implementation work - that you're job!

## 1. Claude Code (Anthropic)
**Command:** `claude`
**Invocation:**
```bash
claude -p "Your prompt here"
```
**Flags:**
*   `-p` / `--print`: Non-interactive mode. Prints response to stdout and exits.

## 2. Codex (OpenAI)
**Command:** `codex`
**Invocation:**
```bash
codex exec "Your prompt here"
```
**Flags:**
*   `exec`: Run Codex non-interactively.
*   `--dangerously-bypass-approvals-and-sandbox`: Skip confirmation prompts (use with caution, but necessary for non-interactive CLI chaining in this context).
