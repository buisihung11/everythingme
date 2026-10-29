# Vue 3 for Senior React Developers — video script

**Format:** English, 16:9, approximately three minutes; on-screen captions. A concise introduction to accompany the detailed study blog.

| Scene | Visual | Narration |
| --- | --- | --- |
| 1 | React component rerender contrasted with a Vue component and reactive dependencies | You already know React. The biggest shift in Vue is how state changes propagate. |
| 2 | `ref(0)` changes; dependency lines lead to the template | React renders with a state snapshot. Vue tracks reactive reads and updates the effects that depend on them. |
| 3 | `count.value++` in script; `{{ count }}` in template | A ref holds a mutable value. In script, access dot value; top-level refs unwrap in templates. |
| 4 | `computed` derives a filtered list; `watch` triggers a network request | Use computed for pure derived state. Use watch for side effects, and clean up stale requests. |
| 5 | Parent sends props; child emits an event; a slot shows composed content | Props, events, and slots define component contracts. Composables share behavior; Pinia can manage shared client state. |
| 6 | A card receives heading and actions through named slots | Named slots are like children and element props in React. The parent chooses content; the child owns layout. |
| 7 | A list exposes an item through a scoped slot; parent renders TaskCard | Scoped slots resemble render props. The list handles iteration while its consumer chooses how each item appears. |
| 8 | useTaskFilter feeds a list and a board; each instance has its own state | Composables reuse reactive behavior without markup. Separate calls create independent state when that state lives inside the function. |
| 9 | SelectionGroup provides a readonly value and an action to SelectionOption | Compound components can use provide and inject. Keep state ownership explicit and expose actions for updates. |
| 10 | TaskWorkspace combines TaskCard with CompleteTaskButton through an actions slot | Compose entity display and feature actions in a higher layer. The task card should not depend on the completion feature. |
| 11 | Layers and paths: pages/tasks, features/complete-task, entities/task, shared/ui | Feature-Sliced Design applies to Vue too. Organize by responsibility and expose public APIs rather than importing internal files. |
| 12 | Allowed import: feature to entity; forbidden import: feature to sibling feature | Across slices, dependencies point to lower layers. A page or widget coordinates sibling features. |
| 13 | Start with app, pages, shared; extract reused behavior gradually | Start small. Extract features when behavior is reused, and keep one-page behavior local until a useful boundary emerges. |
| 14 | Study checklist: reactivity, component contracts, router, testing | Build a small task app, then add routing, tests, and performance profiling. The accompanying blog explains each step. |

**Sources:** https://vuejs.org/guide/essentials/reactivity-fundamentals, https://vuejs.org/guide/essentials/computed, https://vuejs.org/guide/essentials/watchers, https://vuejs.org/guide/scaling-up/state-management.

**Additional sources:** https://vuejs.org/guide/components/slots, https://vuejs.org/guide/reusability/composables, https://vuejs.org/guide/components/provide-inject, https://feature-sliced.design/docs/get-started/overview, https://feature-sliced.design/docs/reference/layers.

**Status:** Produced on 2026-10-29 with the one-studio skill (project in `video/`, every gate approved). The final 1080p cut (2:04, OmniVoice voice `cedar`) is embedded in the blog post `vue-for-react-developers.mdx` from `apps/blog/public/videos/vue-for-react-developers/`.
