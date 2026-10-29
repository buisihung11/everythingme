# Research — Vue 3 for Senior React Developers

| id | type | content | source | url | published | accessed | speaker |
|---|---|---|---|---|---|---|---|
| r1 | fact | Refs hold a mutable value accessed via `.value` in script; top-level refs are unwrapped in templates; Vue tracks reactive reads and triggers dependent effects. | Vue docs: Reactivity Fundamentals | https://vuejs.org/guide/essentials/reactivity-fundamentals | n/a | 2026-10-29 | |
| r2 | fact | Computed getters should be side-effect free and are cached based on reactive dependencies. | Vue docs: Computed Properties | https://vuejs.org/guide/essentials/computed | n/a | 2026-10-29 | |
| r3 | fact | Watchers run side effects in reaction to state changes; `onCleanup` / `onWatcherCleanup` invalidates stale async work. | Vue docs: Watchers | https://vuejs.org/guide/essentials/watchers | n/a | 2026-10-29 | |
| r4 | fact | Pinia is the recommended state management library for Vue. | Vue docs: State Management | https://vuejs.org/guide/scaling-up/state-management | n/a | 2026-10-29 | |
| r5 | fact | Named slots and scoped slots let a parent supply content, with child data exposed through slot props. | Vue docs: Slots | https://vuejs.org/guide/components/slots | n/a | 2026-10-29 | |
| r6 | fact | Composables encapsulate and reuse stateful logic using the Composition API; state created inside the function is per call. | Vue docs: Composables | https://vuejs.org/guide/reusability/composables | n/a | 2026-10-29 | |
| r7 | fact | provide/inject passes data to descendants; keep mutations inside the provider and expose functions for updates; `readonly()` protects provided state. | Vue docs: Provide / Inject | https://vuejs.org/guide/components/provide-inject | n/a | 2026-10-29 | |
| r8 | fact | FSD organises code by layers (app, pages, widgets, features, entities, shared), slices and segments, with public APIs per slice. | Feature-Sliced Design: Overview | https://feature-sliced.design/docs/get-started/overview | n/a | 2026-10-29 | |
| r9 | fact | A module on one layer may only import from slices on layers strictly below it. | Feature-Sliced Design: Layers | https://feature-sliced.design/docs/reference/layers | n/a | 2026-10-29 | |

## Details only this topic has

1. `setup` runs once per component instance; a React function component runs on every render.
2. `.value` in script, automatic unwrapping in templates.
3. Scoped slots map to render props; `watch` provides `onCleanup` for stale requests.

## Interesting but not used

- Vue's compiler emits patch flags from templates to skip static parts during diffing.
- Destructuring a reactive object loses reactivity; `toRefs` keeps it.

## Open questions

- None for the video; deeper details live in the companion blog post.
