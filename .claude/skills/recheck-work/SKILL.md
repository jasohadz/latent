---
name: recheck-work
description: Use this right before delivering any non-trivial output — code, config, written content, generated files, multi-step task results — as a final self-check pass. Trigger whenever the user asks to "double check", "recheck", "verify", "make sure this is right", "did you actually test this", or after finishing any task with more than one moving part (multiple files, multiple requirements, a spec with several constraints). Also trigger proactively before presenting files or claiming a task is complete, especially for code that will be run or a design-system component that others will consume.
---

# Recheck Work

A closing pass to catch the gap between "looks done" and "is done." Run this after finishing a task, before telling the user it's complete.

## The check

1. **Reread the original ask, not your plan.** Requirements drift during execution. List each explicit requirement from the user's message(s) and confirm each is actually met — not approximately, not "close enough."
2. **Run it, don't eyeball it.** If it's code: actually execute it (or the relevant slice of it) rather than reading it and assuming it works. Syntax that looks right and code that runs are different claims.
3. **Check the seams, not just the pieces.** Individual files/functions can each be correct while the integration between them is wrong (mismatched names, wrong import paths, a schema change in one file not propagated to another). Explicitly trace at least one path through the whole thing.
4. **Look for silent partial completion.** Did every item in a list/loop/batch actually get processed, or did some get skipped, truncated, or stubbed with a placeholder? Grep for TODO, placeholder, or obviously fake data before calling something final.
5. **State what you didn't verify.** If something can't be tested in this environment (e.g. requires a live API key, a browser, external service), say so explicitly rather than implying it was checked.

## Reporting back

Don't just say "double checked, looks good." Briefly name what you checked and what you found — even if the answer is "confirmed X, Y, Z all match the spec." If you find a problem, fix it before reporting completion rather than reporting the problem as a caveat.

## What this skill is not

Not a request for excessive hedging or re-litigating settled decisions. One focused pass, then report clearly. Don't loop this indefinitely without new information.
