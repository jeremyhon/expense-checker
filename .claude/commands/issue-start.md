---
description: Start working on a GitHub issue
allowed-tools: [Bash]
---

## Context

Available open issues:
!`gh issue list --state open --limit 10`

Current git branch:
!`git branch --show-current`

Current git status:
!`git status --porcelain`

## Your task

Start working on GitHub issue: "$ARGUMENTS"

Find the issue by number or partial title match, then:
1. Show the issue details
2. Assign the issue to yourself (if not already assigned)
3. Create a new branch for the issue (format: issue-{number}-{title-slug})
4. Switch to that branch
5. Provide guidance on next steps

If no argument is provided, ask the user to specify which issue to work on from the list above.