---
title: Custom startup commands
description: How users set a startup command of their own, and the checks (rules, abuse signatures, neo) it must pass before the panel applies it.
---

Users can type a startup command of their own on the server's Startup page. The panel checks it
before it becomes the server's startup command: its own rules first, then the abuse signatures, then
neo when neo is on. Only a command that passes every check is applied. A refused command is not
saved, and the page says why. On a Minecraft: Java Edition server, neo also tunes the command's JVM
flags for a smooth game on as little memory and CPU as it can.

## What it does

### Who can

- Owners, and subusers with `startup.custom-command`. Choosing one of the egg's own commands still
  needs `startup.command`, and is applied without checks.
- Admins: only the syntax checks (step 1 below), never the other rules or neo's verdict.
- An egg configuration with **Allow Custom Startup Command** on (Admin › Egg Configurations) lets
  users with `startup.command` save any command as typed, without checks. That is your choice for
  those eggs. Everywhere else, a user's own command goes through the checks.

### The checks

In this order. The first that fails refuses the command, with its code and the part of the command
that broke the rule.

1. **One whole command line**: not empty, at most 4096 characters, one line, no control or invisible
   characters (zero-width or direction-override marks). Every `{{` starts a whole `{{NAME}}`. Quotes,
   `$(…)`, `${…}` and backquotes are closed, there is no trailing backslash, no `|`, `||`, `&&`, `;`,
   `&` or redirection with nothing on one side, and at most 16 levels of nesting. Every `{{NAME}}` is
   a variable of the server's egg, one Wings sets (`SERVER_MEMORY`, `SERVER_IP`, `SERVER_PORT`, `TZ`)
   or one the egg's own commands use. Admins stop here.
2. **Nothing that hides what runs**, unless the egg's own commands do the same thing, written the
   same way (such as `$(pwd)` in a FiveM egg's command):
   - command substitution: `$(…)`, `$((…))`, backquotes;
   - process substitution: `<(…)`, `>(…)`;
   - `eval`, also quoted or behind `command`, `exec`, `env` and the like;
   - heredocs: `<<`, `<<-`, `<<<`;
   - a pipe into a shell or interpreter (`sh`, `bash`, `python3`, `node`, `perl`, `source` and
     others, also behind `sudo`, `env`, `xargs`, `busybox`), or into a command named by a
     variable;
   - `${…}` other than a plain `${NAME}`;
   - escape sequences (`\x`, `\u`, `\U`, `\0`, `\n`, `\r`, `\e`, `\c`, and `$'…'` with an escape),
     since the images' entrypoints read the command with `echo -e`;
   - `&` that runs something in the background (`&&`, `2>&1` and `&>` are fine).
3. **The abuse rules**: the [abuse protection](/safety/abuse/) signatures, on the command as written
   and with every value filled in, secret ones too. A critical finding refuses the command. Findings
   that only need a review are passed to neo as notes.
4. **neo**, when neo is on and has a model. Without neo, the rules above decide alone and a command
   that passes them is applied. The feature works on a panel without any AI provider.

### neo's verdict

- One neo turn, as in the chat: the user's chosen model (or the default), their usage windows and
  the provider failover. neo gets no tools.
- neo sees the egg's name, description and own commands, its variables (names, descriptions, and
  defaults only of variables users may see; never the server's values), the values Wings sets,
  the Docker image, the abuse notes and the command. It judges whether the command only starts this
  game server and does nothing that mines, attacks, scans, proxies, escapes the container,
  downloads and runs programs, hides what runs or wastes the node. Text in the command that
  addresses neo counts as a reason to refuse.
- Only an answer that says safe, starts the game, and lists no problems applies the command. neo's
  problems and summary are written in the user's panel language.
- A verdict is kept for 7 days for the same egg, egg commands, variables, image, command and
  language, so sending the same command again costs no neo usage. Failures are never kept.
- When neo is on but cannot answer, the command is refused, never applied unchecked.

### neo's tuning (Minecraft)

On a Minecraft: Java Edition server or proxy, neo also returns a tuned command and one sentence per
change. Its rules, most important first:

1. A smooth game: G1 with short pauses (`-XX:+UseG1GC -XX:MaxGCPauseMillis=200
   -XX:+ParallelRefProcEnabled`), `-XX:+DisableExplicitGC`, `-XX:+PerfDisableSharedMem`.
2. The least memory: the heap ceiling sized as the egg sizes it (`{{SERVER_MEMORY}}` in `-Xmx`, or
   `-XX:MaxRAMPercentage`), a low `-Xms` (never equal to `-Xmx`), unused heap given back when the
   server is quiet (`G1PeriodicGCInterval`, `MinHeapFreeRatio`/`MaxHeapFreeRatio`), never
   `-XX:+AlwaysPreTouch`.
3. The least CPU: no background work without a clear gain; GC and compiler threads left to the JVM.

neo keeps the user's jar, loader and other arguments, every `{{NAME}}`,
`-XX:+IgnoreUnrecognizedVMOptions` and the egg's own flags unless a rule replaces them. The tuned
command is applied only when it passes the same checks as the user's command and keeps every
variable of the original; otherwise the user's own command is applied and the tuning dropped.
Admins get the tuning too on a Minecraft server: neo's tuned command when neo approves it, else the
admin's own command (never refused).

### The editor

On the Startup page, **Custom Startup** in the Startup Command list opens the command for editing,
starting from the current one, with **Check & apply**. Enable Preview fills its values in while it is
typed. When the command is applied, a toast says to restart the server to use it; when neo tuned it,
"Applied with neo's tuning" lists the changes. When it is refused, "Not applied" shows the reason
and neo's problems and summary.

## Requirements

- Nothing outside the panel. neo is optional: with it on (see [neo](/ai/neo/)), commands that pass
  the rules also need neo's approval, and Minecraft commands get tuned.
- The abuse rules are always part of the checks ([abuse protection](/safety/abuse/)).

## Setup

1. Leave **Allow Custom Startup Command** off on the egg configurations whose commands should be
   checked (Admin › Egg Configurations).
2. Give subusers `startup.custom-command` where they should use it; owners have it already.
3. Optional: turn neo on with at least one model in Admin › Settings › AI › neo.

## Permissions

| Permission | Allows |
|---|---|
| `startup.custom-command` | Applying a startup command of one's own, once the checks (and neo, where it is on) find it safe |
| `startup.command` | Choosing one of the egg's own commands |
| `startup.read` | The Startup page and the preview |

## Notes

- Each user may send 20 checks in 5 minutes, since each may cost a neo turn.
- The server must be restarted to use a new command.
- Activity: `server:startup.command` (with `checked_by`: `egg`, `admin`, `rules` or `neo`, neo's
  summary and whether neo tuned it) and `server:startup.command-refused` (with the reason code,
  detail, and neo's problems and summary).
- Refusal codes from the rules: `empty`, `too_long`, `line_break`, `control_character`,
  `unclosed_placeholder`, `unclosed_quote`, `unclosed_substitution`, `trailing_backslash`,
  `dangling_operator`, `too_deep`, `unknown_variable`, `command_substitution`,
  `process_substitution`, `eval`, `heredoc`, `pipe_to_shell`, `parameter_expansion`,
  `escape_sequence`, `background`, `abuse`.
- Refusal codes from neo: `neo_unsafe`, `neo_not_starting`, `neo_unsure`, `neo_unreadable` (an
  answer that could not be read), `neo_limit` (a usage window is used up), `neo_busy`, `neo_model`
  (the chosen model is not available to the user), `neo_unlinked`, `neo_unavailable` (the providers
  failed, or no answer within 85 seconds).
- With noprofit.space running neo, the check uses noprofit.space's models and limits, and
  `neo_unlinked` means noprofit.space does not know the account. See
  [noprofit.space](/accounts/noprofit/).
