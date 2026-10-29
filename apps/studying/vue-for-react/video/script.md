# Script — Vue 3 for Senior React Developers

## s01 · The shift

> visual: split screen; left a React component flashes as it re-renders top to bottom, right a Vue component stays still while one dependency line lights up
> camera: slow push-in to the centre divider

- You already know React.
- The biggest shift in Vue is how state changes propagate.

## s02 · Snapshot versus tracking

> visual: left, a stack of render snapshots; right, ref(0) with dependency lines running to the template and a computed value
> source: r1

- React renders with a state snapshot.
- Vue tracks reactive reads and updates the effects that depend on them.

## s03 · Refs

> visual: code card, count.value++ in script highlighted; template card shows {{ count }} updating
> source: r1

- A ref holds a mutable value.
- In script, access dot value; top-level refs unwrap in templates.

## s04 · Computed and watch

> visual: computed filters a task list on one side; watch fires a fetch on the other, an older request is crossed out
> source: r2,r3

- Use computed for pure derived state.
- Use watch for side effects, and clean up stale requests.

## s05 · Component contracts

> visual: parent box sends props down, child emits an event up, a slot frame shows composed content; small Pinia store badge
> source: r4,r5,r6

- Props, events, and slots define component contracts.
- Composables share behavior; Pinia can manage shared client state.

## s06 · Named slots

> visual: PanelCard with heading, body and actions regions filling in from the parent; React children and element props shown faintly beside it
> source: r5

- Named slots are like children and element props in React.
- The parent chooses content; the child owns layout.

## s07 · Scoped slots

> visual: ItemList iterates rows and hands each item up through a scoped slot; the parent renders TaskCard; renderItem shown as the React twin
> source: r5

- Scoped slots resemble render props.
- The list handles iteration while its consumer chooses how each item appears.

## s08 · Composables

> visual: useTaskFilter box feeds a list view and a board view, each with its own query state
> source: r6

- Composables reuse reactive behavior without markup.
- Separate calls create independent state when that state lives inside the function.

## s09 · Provide and inject

> visual: SelectionGroup provides a readonly value and a select action; two SelectionOption buttons receive it through the tree
> source: r7

- Compound components can use provide and inject.
- Keep state ownership explicit and expose actions for updates.

## s10 · Compose in a higher layer

> visual: TaskWorkspace slots CompleteTaskButton into TaskCard's actions slot; TaskCard has no arrow to the feature

- Compose entity display and feature actions in a higher layer.
- The task card should not depend on the completion feature.

## s11 · Feature-Sliced Design

> visual: layer stack app, pages, widgets, features, entities, shared; paths pages/tasks, features/complete-task, entities/task, shared/ui appear
> source: r8

- Feature-Sliced Design applies to Vue too.
- Organize by responsibility and expose public APIs rather than importing internal files.

## s12 · Import rules

> visual: arrow feature to entity turns green; arrow feature to sibling feature turns red; a page above coordinates both
> source: r9

- Across slices, dependencies point to lower layers.
- A page or widget coordinates sibling features.

## s13 · Start small

> visual: project tree starts with app, pages, shared; features and entities grow in one at a time
> silence: 1s

- Start small.
- Extract features when behavior is reused, and keep one-page behavior local until a useful boundary emerges.

## s14 · Study plan

> visual: checklist ticks: reactivity, component contracts, router, testing, profiling; blog title card
> silence: 1.5s

- Build a small task app, then add routing, tests, and performance profiling.
- The accompanying blog explains each step.
