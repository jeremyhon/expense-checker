---
description: Create a new GitHub issue
allowed-tools: [Bash]
---

## Context

Current open issues:
!`gh issue list --limit 5`

## Your task

Create a new GitHub issue with the content: "$ARGUMENTS"

If the arguments contain a colon (:), treat it as "title:body" format.
Otherwise, use the entire argument as the title with a default body.

Use the GitHub CLI to create the issue and show the resulting URL.