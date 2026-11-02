import { useEffect, useRef, useState } from 'react'
import { DemoButton, Figure, Toggle, cx } from './ui'

type Person = { id: string; name: string; role: string; ms: number; fail: boolean }

const PEOPLE: Person[] = [
  { id: 'ana', name: 'An Nguyễn', role: 'Design', ms: 700, fail: false },
  { id: 'bao', name: 'Bảo Trần', role: 'Frontend', ms: 1200, fail: false },
  { id: 'chi', name: 'Chi Lê', role: 'không có', ms: 500, fail: true },
]

type Phase = 'idle' | 'loading' | 'ready' | 'error'

export function UseUserFetch() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [user, setUser] = useState<Person | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [keepStale, setKeepStale] = useState(false)
  const req = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  const load = (person: Person) => {
    const mine = ++req.current
    setPhase('loading')
    setError(null)
    const timer = window.setTimeout(() => {
      const stale = mine !== req.current
      if (stale && !keepStale) {
        setLog((prev) => [`#${mine} ${person.id} abort`, ...prev].slice(0, 4))
        return
      }
      if (stale && keepStale) {
        setLog((prev) => [`#${mine} ${person.id} ghi đè`, ...prev].slice(0, 4))
      } else {
        setLog((prev) => [`#${mine} ${person.id} xong`, ...prev].slice(0, 4))
      }
      if (person.fail) {
        setPhase('error')
        setUser(null)
        setError('404')
        return
      }
      setPhase('ready')
      setUser(person)
      setError(null)
    }, person.ms)
    timers.current.push(timer)
  }

  return (
    <Figure
      kicker="Hình 1 · useUser(id)"
      title="Đổi id là abort request trước"
      caption="loading, error và data sống cạnh request, trong composable. Bấm Bảo (chậm) rồi An (nhanh): bản có abort bỏ kết quả của Bảo. Tắt abort thì request chậm về sau ghi đè người mới."
    >
      <div className="flex flex-wrap items-center gap-2">
        {PEOPLE.map((person) => (
          <DemoButton key={person.id} tone="ghost" onClick={() => load(person)}>
            {person.id} · {person.ms}ms
          </DemoButton>
        ))}
        <Toggle checked={keepStale} onChange={setKeepStale} label="quên abort" />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Cell label="loading" value={phase === 'loading' ? 'true' : 'false'} on={phase === 'loading'} />
        <Cell label="error" value={error ?? 'null'} on={phase === 'error'} bad />
        <Cell label="data" value={phase === 'ready' && user ? user.name : 'null'} on={phase === 'ready'} />
      </div>
      <p className="mt-2 text-sm text-fd-muted-foreground">
        {phase === 'ready' && user ? `${user.name} · ${user.role}` : 'Chưa có user trên màn hình.'}
      </p>
      <ul className="mt-2 space-y-1 font-mono text-xs text-fd-muted-foreground">
        {log.length === 0 ? <li>Nhật ký request trống.</li> : log.map((line) => <li key={line}>{line}</li>)}
      </ul>
    </Figure>
  )
}

function Cell({ label, value, on, bad = false }: { label: string; value: string; on: boolean; bad?: boolean }) {
  return (
    <div
      className={cx(
        'rounded-lg border px-3 py-2',
        on && !bad && 'border-emerald-500/40 bg-emerald-500/10',
        on && bad && 'border-rose-500/40 bg-rose-500/10',
        !on && 'border-fd-border bg-fd-background',
      )}
    >
      <div className="text-[0.68rem] text-fd-muted-foreground">{label}</div>
      <div className="truncate font-mono text-sm font-bold">{value}</div>
    </div>
  )
}
