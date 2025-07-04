---
description: Start working on a todo item from todo.md
allowed-tools: [Read, Edit, Bash]
---

First, here are the current todos:
@todo.md

Now I'll start working on: "$ARGUMENTS"

If no argument is provided, I'll pick the first unchecked todo item.
If an argument is provided, I'll find and start that specific todo.

To start a todo:
1. Change "- [ ]" to "- [x] 🚧" to indicate it's in progress
2. Run git add todo.md to stage the change
3. Show which todo was started