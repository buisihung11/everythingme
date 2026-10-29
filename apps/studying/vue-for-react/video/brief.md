# Brief — Vue 3 for Senior React Developers

| Field | Value |
|---|---|
| Goal (one sentence) | A senior React developer leaves with a working mental map of Vue 3: reactivity, component contracts, composition patterns and Feature-Sliced architecture. |
| Audience | Senior frontend engineers fluent in React (hooks, context, render props, compound components) who are joining or evaluating a Vue 3 codebase. |
| Call to action | Read the companion blog post "Vue 3 for Senior React Developers" and build the small task app it describes. |
| Length | 180 s |
| Aspect ratio | 16:9 (extra exports: none) |
| Language (VO + captions) | en |
| Look / style | Dark keynote, precise, code-forward (preset apple-keynote); React vs Vue split panels |
| Dimension | 2d |
| Must include | Real Vue 3 code snippets (ref, computed, watch, slots, provide/inject), the FSD layer stack, a closing study checklist |
| Avoid | Framework tribalism or "Vue is better" claims; logos used as decoration; benchmark numbers |

## Key messages (max 3)

1. React re-runs the component to find what changed; Vue tracks reactive reads and updates only what depends on them.
2. Every React composition pattern has a Vue counterpart: children → slots, render props → scoped slots, hooks → composables, context → provide/inject.
3. Architecture (Feature-Sliced Design) is framework-neutral: own state explicitly and import through public APIs.

## Story core

| Field | Value |
|---|---|
| Angle (one sentence: what this video says that others do not) | The syntax is the easy part; the real switch for a React expert is that Vue's setup runs once and the data, not the render, knows who depends on it. |
| Real person (who, where, what happened) | none: concept video; the viewer is a senior React developer joining a Vue team |
| Tension (what is in conflict or at risk) | React instincts (re-render snapshots, effect dependency arrays) silently produce wrong Vue code: lost reactivity on destructure, stale requests in watchers. |
| Common misconception | "The Composition API is just React hooks with different names." |
| Details only this topic has (3) | 1. `setup` runs once per instance, while a React function component runs every render. 2. Refs need `.value` in script but unwrap automatically in templates. 3. Scoped slots are Vue's render props, and `watch` gets an `onCleanup` callback for stale async work. |
| Point of view / tone | dry-expert: one senior engineer briefing another, precise and understated |
| Promise and payoff | Title promises "Vue for React developers"; paid by the React→Vue mapping in s05–s09 and the study checklist in s14. |
| Sources (link, date) | Vue docs and Feature-Sliced Design docs, accessed 2026-10-29 (see research.md) |
