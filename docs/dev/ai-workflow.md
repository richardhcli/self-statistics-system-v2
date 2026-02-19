To make this seamless, separate the drafting from the publishing.

# AI-Assisted Development Workflow

This document outlines the standard operating procedure for development. The goal is to maintain a clean separation between machine-facing context (AI), human-readable documentation, and the actual source code.

## 1. Directory Architecture

Our repository uses a dedicated folder for AI instructions and memory: 
* **.ai/blueprints/**: Static AI instructions (system prompts, tech stack rules like "Use React, Zustand, and Firebase"). **Do not modify** unless changing project-wide architectural rules.
* **.ai/plans/**: Highly volatile scratchpads for the current sprint or feature.
* **.ai/daily-logs/**: Granular, technical, daily AI-generated changelogs / history.
* **docs/dev/**: Human-readable internal documentation (architecture, setup).
* **docs/user/**: External-facing user manuals.
* **CHANGELOG.md**: The official, versioned release history (located at the project root).

## 2. The Daily Development Loop

When picking up a new task or starting a coding session, follow this sequence:

1. **Update the Plan**: Before generating code, brief the AI by updating `.ai/plans/<YYYY-MM-DD>-<Task>.md`. Outline the specific goal for the session.
2. **Execute**: Allow the AI to write, refactor, or test code within the `src/` directory based on the active plan and static blueprints.
3. **Generate the Daily Log**: At the end of the session, instruct the AI to summarize its changes. The AI must append a markdown file `.ai/daily-logs/<YYYY-MM-DD>.md`

## 3. Managing Context Windows

To prevent the AI from hallucinating or losing focus, strictly manage what files it reads:

* **Always Included**: `.ai/blueprints/system_prompt.md` 
* **Task-Specific**: Only feed the AI the specific files it needs to edit, plus `.ai/plans/current_task.md`.
* **Do Not Include**: The entire `docs/` folder or the root `CHANGELOG.md` during regular coding tasks.

## 4. Release and Versioning Protocol
official release notes are hihgly distinct. When it is time to cut a new version:

1. **Aggregate**: Prompt the AI to read the unpolished daily logs in `.ai/history/` since the last release date.
* Release Time: When you are ready to bump the version (e.g., v1.2.0), prompt the AI: "Read the daily logs in .ai/history/ for the past two weeks. Aggregate the completed features and bug fixes, and format them into a new entry for the root CHANGELOG.md following the 'Keep a Changelog' standard."
2. **Format**: Instruct the AI to synthesize these logs into the standard [Keep a Changelog](https://keepachangelog.com/) format.
3. **Publish**: Append this formatted summary to the root `/CHANGELOG.md` under the new version number, categorizing changes strictly by `Added`, `Changed`, `Fixed`, etc.
4. **Update Docs**: If the release introduced new features or altered the architecture, prompt the AI to update the relevant files in `docs/dev/` or `docs/user/`.
