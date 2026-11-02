import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { CodeLines, DemoButton, Figure, Stat, cx, useFlash, type CodeLine } from './ui'

const REACT_LINES: CodeLine[] = [
  { text: 'function Counter() {', id: 'fn' },
  { text: '  const [count, setCount] = useState(0)', id: 'fn' },
  { text: '  const doubled = count * 2', id: 'fn' },
  { text: '  const inc = () => setCount(count + 1)', id: 'fn' },
  { text: '  return <>', id: 'fn' },
  { text: '    <button onClick={inc}>{count}</button>', id: 'fn' },
  { text: '    <p>{doubled}</p>', id: 'fn' },
  { text: '    <Logo />', id: 'child' },
  { text: '  </>', id: 'fn' },
  { text: '}', id: 'fn' },
]

const VUE_LINES: CodeLine[] = [
  { text: '<script setup>', id: 'setup' },
  { text: 'const count = ref(0)', id: 'setup' },
  { text: 'const doubled = computed(', id: 'setup' },
  { text: '  () => count.value * 2)', id: 'setup' },
  { text: 'const inc = () => count.value++', id: 'setup' },
  { text: '</script>', id: 'setup' },
  { text: '' },
  { text: '<template>', id: 'tpl' },
  { text: '  <button @click="inc">{{ count }}</button>', id: 'reads' },
  { text: '  <p>{{ doubled }}</p>', id: 'reads' },
  { text: '  <Logo />', id: 'child' },
  { text: '</template>', id: 'tpl' },
]

export function RenderModelCompare() {
  const [count, setCount] = useState(0)
  const { flash, isOn } = useFlash(1100)

  const increment = () => {
    setCount((c) => c + 1)
    flash(['react-fn', 'react-child', 'react-stats'])
    flash(['vue-reads', 'vue-render'])
  }

  const runs = count + 1

  return (
    <Figure
      kicker="Hình 1 · Mô hình render"
      title="React chạy lại cả hàm. Vue chỉ chạy lại phần render có đọc dữ liệu vừa đổi."
      caption={
        <>
          Bấm <strong>+1</strong> vài lần rồi so hai bộ đếm. Bên React, cả hàm{' '}
          <code>Counter</code> và component con <code>Logo</code> đều chạy lại. Bên
          Vue, <code>script setup</code> chỉ chạy đúng một lần. Chỉ render của{' '}
          <code>Counter</code> chạy lại, còn <code>Logo</code> được bỏ qua vì nó
          không đọc <code>count</code> và props của nó không đổi. Trong React,
          dùng <code>React.memo</code> hoặc React Compiler cũng bỏ qua được{' '}
          <code>Logo</code>, nhưng đó là phần tối ưu bạn phải tự thêm vào.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DemoButton onClick={increment}>+1 (cả hai bên)</DemoButton>
        <DemoButton tone="ghost" onClick={() => setCount(0)} disabled={count === 0}>
          <RotateCcw className="size-3.5" aria-hidden /> Làm lại
        </DemoButton>
        <span className="font-mono text-sm text-fd-muted-foreground">
          count = {count}, doubled = {count * 2}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="min-w-0 space-y-3" aria-label="React">
          <p className="text-sm font-bold text-sky-700 dark:text-sky-400">
            React: snapshot, mỗi lần render là một lần gọi hàm
          </p>
          <CodeLines
            lines={REACT_LINES}
            lineClass={(line) =>
              cx(
                line.id === 'fn' && isOn('react-fn') && 'bg-sky-500/15',
                line.id === 'child' && isOn('react-child') && 'bg-sky-500/25',
              )
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Counter() đã chạy" value={`${runs}×`} tone="react" flash={isOn('react-stats')} />
            <Stat label="Logo() đã chạy" value={`${runs}×`} tone="react" flash={isOn('react-stats')} />
          </div>
        </section>

        <section className="min-w-0 space-y-3" aria-label="Vue">
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            Vue: setup một lần, sau đó theo dõi ai đọc dữ liệu
          </p>
          <CodeLines
            lines={VUE_LINES}
            lineClass={(line) =>
              cx(
                line.id === 'setup' && 'text-fd-muted-foreground',
                line.id === 'reads' && isOn('vue-reads') && 'bg-emerald-500/20',
                line.id === 'child' && count > 0 && 'line-through decoration-fd-muted-foreground/60 opacity-60',
              )
            }
          />
          <div className="grid grid-cols-3 gap-2">
            <Stat label="setup đã chạy" value="1×" tone="vue" />
            <Stat label="render Counter" value={`${runs}×`} tone="vue" flash={isOn('vue-render')} />
            <Stat label="render Logo" value="1×" tone="vue" />
          </div>
        </section>
      </div>
    </Figure>
  )
}
