import { useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { CodeLines, Figure, Tabs, Toggle, cx, useFlash } from './ui'

type ChildView = 'macro' | 'manual'

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1)

export function ModelExpander() {
  const [named, setNamed] = useState(false)
  const [capitalize, setCapitalize] = useState(false)
  const [value, setValue] = useState('vue study')
  const [log, setLog] = useState<string[]>([])
  const [view, setView] = useState<ChildView>('macro')
  const { flash, isOn } = useFlash(700)

  const prop = named ? 'title' : 'modelValue'
  const event = `update:${prop}`
  const mods = named ? 'titleModifiers' : 'modelModifiers'
  const local = named ? 'title' : 'model'

  const onInput = (raw: string) => {
    const next = capitalize ? cap(raw) : raw
    setValue(next)
    setLog((l) => [`emit('${event}', ${JSON.stringify(next)})`, ...l].slice(0, 4))
    flash(['up', 'child'])
    flash(['parent'], 150)
    flash(['down'], 300)
  }

  const parentLine = `<TitleInput v-model${named ? ':title' : ''}${capitalize ? '.capitalize' : ''}="title" />`
  const expanded = [
    '<TitleInput',
    `  :${prop}="title"`,
    ...(capitalize ? [`  :${mods}="{ capitalize: true }"`] : []),
    `  @${event}="(v) => (title = v)"`,
    '/>',
  ]
  const nameArg = named ? "'title'" : ''
  const macro = capitalize
    ? [
        `const [${local}, modifiers] = defineModel<string>(${nameArg}${named ? ', ' : ''}{`,
        '  set: (v) => (modifiers.capitalize ? cap(v) : v),',
        '})',
        '',
        `<input v-model="${local}" />`,
      ]
    : [`const ${local} = defineModel<string>(${nameArg})`, '', `<input v-model="${local}" />`]
  const manual = [
    `const props = defineProps<{`,
    `  ${prop}: string`,
    ...(capitalize ? [`  ${mods}?: { capitalize?: boolean }`] : []),
    '}>()',
    `const emit = defineEmits(['${event}'])`,
    'function onInput(e: Event) {',
    '  let v = (e.target as HTMLInputElement).value',
    ...(capitalize ? [`  if (props.${mods}?.capitalize) v = cap(v)`] : []),
    `  emit('${event}', v)`,
    '}',
    '',
    `<input :value="props.${prop}" @input="onInput" />`,
  ]

  return (
    <Figure
      kicker="Hình 4 · defineModel"
      title="v-model là một ống hai chiều: prop đi xuống, event đi lên"
      caption={
        <>
          Gõ vào ô input của con và nhìn hai chiều của ống. Mỗi ký tự gõ vào, con không tự
          sửa giá trị mà emit <code>update:…</code> lên. Cha gán vào ref của mình, và giá trị
          mới chảy xuống qua prop. Bật tên model và modifier để xem compiler đổi tên prop,
          event và object modifiers tương ứng. <code>defineModel</code> (Vue 3.4+) làm hết
          phần viết tay ở tab bên cạnh.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Toggle checked={named} onChange={setNamed} label="Đặt tên: v-model:title" />
        <Toggle checked={capitalize} onChange={setCapitalize} label="Modifier .capitalize" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0">
          <div className={cx('rounded-xl border-2 p-3 transition-colors duration-300', isOn('parent') ? 'border-emerald-500 bg-emerald-500/10' : 'border-fd-border bg-fd-background')}>
            <p className="text-xs font-bold text-fd-muted-foreground">Cha: App.vue</p>
            <p className="mt-1 break-all font-mono text-sm">
              const title = ref(<span className="font-bold text-emerald-700 dark:text-emerald-400">{JSON.stringify(value)}</span>)
            </p>
          </div>
          <div className="mx-auto flex max-w-xs justify-between px-4 py-2">
            <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[0.72rem] font-semibold transition-colors duration-300', isOn('down') ? 'bg-sky-500/20 text-sky-800 dark:text-sky-200' : 'text-sky-700 dark:text-sky-300')}>
              <ArrowDown className="size-3.5" aria-hidden /> :{prop}
            </span>
            <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[0.72rem] font-semibold transition-colors duration-300', isOn('up') ? 'bg-violet-500/20 text-violet-800 dark:text-violet-200' : 'text-violet-700 dark:text-violet-300')}>
              <ArrowUp className="size-3.5" aria-hidden /> @{event}
            </span>
          </div>
          <div className={cx('rounded-xl border-2 p-3 transition-colors duration-300', isOn('child') ? 'border-violet-500 bg-violet-500/10' : 'border-fd-border bg-fd-background')}>
            <p className="text-xs font-bold text-fd-muted-foreground">Con: TitleInput.vue</p>
            <label className="mt-2 block">
              <span className="sr-only">Ô input của component con</span>
              <input
                value={value}
                onChange={(e) => onInput(e.target.value)}
                className="w-full rounded-md border border-fd-border bg-fd-card px-2 py-1.5 text-sm text-fd-foreground outline-none focus:border-emerald-500"
              />
            </label>
            {capitalize ? (
              <p className="mt-1 text-[0.7rem] text-fd-muted-foreground">
                {mods} = {'{ capitalize: true }'}: thử xóa hết rồi gõ chữ thường.
              </p>
            ) : null}
          </div>
          <div className="mt-3 rounded-xl border border-fd-border bg-fd-background p-3">
            <p className="text-xs font-semibold text-fd-muted-foreground">Event con vừa emit</p>
            <div className="mt-1 min-h-10 font-mono text-[0.72rem] leading-5">
              {log.length ? (
                log.map((l, i) => (
                  <div key={`${log.length}-${i}`} className={cx('truncate', i === 0 ? 'text-violet-700 dark:text-violet-300' : 'text-fd-muted-foreground')}>
                    {l}
                  </div>
                ))
              ) : (
                <span className="text-fd-muted-foreground">Gõ vào ô input ở trên.</span>
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div>
            <p className="mb-1 text-xs font-bold text-fd-muted-foreground">Cha viết</p>
            <CodeLines lines={[{ text: parentLine }]} />
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-fd-muted-foreground">Compiler mở ra thành</p>
            <CodeLines
              lines={expanded.map((text) => ({ text }))}
              lineClass={(l) =>
                l.text.includes(`:${prop}=`) && isOn('down')
                  ? 'bg-sky-500/15'
                  : l.text.includes(`@${event}`) && isOn('up')
                    ? 'bg-violet-500/15'
                    : undefined
              }
            />
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-fd-muted-foreground">Con khai báo</p>
              <Tabs
                label="Cách viết component con"
                value={view}
                onChange={setView}
                items={[
                  { value: 'macro', label: 'defineModel' },
                  { value: 'manual', label: 'Viết tay (trước 3.4)' },
                ]}
              />
            </div>
            <CodeLines lines={(view === 'macro' ? macro : manual).map((text) => ({ text }))} />
          </div>
        </div>
      </div>
    </Figure>
  )
}
