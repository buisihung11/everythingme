import { useState } from 'react'
import { DemoButton, Figure, Tabs, cx } from './ui'

type Kind = 'plain' | 'ref' | 'getter'

const IDS = ['/posts/1', '/posts/2', '/posts/3']

const KIND_LABEL: Record<Kind, string> = {
  plain: "useFetch('/posts/1')",
  ref: 'useFetch(url)',
  getter: 'useFetch(() => `/posts/${id}`)',
}

export function ToValueProbe() {
  const [kind, setKind] = useState<Kind>('ref')
  const [idx, setIdx] = useState(0)
  const [armed, setArmed] = useState(false)
  const [setupUrl, setSetupUrl] = useState<string | null>(null)
  const [watched, setWatched] = useState<string | null>(null)
  const [runs, setRuns] = useState(0)

  const current = IDS[idx]

  const arm = (nextKind: Kind, at: number) => {
    const url = IDS[at]
    setKind(nextKind)
    setIdx(at)
    setArmed(true)
    setSetupUrl(url)
    setWatched(url)
    setRuns(1)
  }

  const changeKind = (next: Kind) => {
    setKind(next)
    setArmed(false)
    setSetupUrl(null)
    setWatched(null)
    setRuns(0)
  }

  const bump = () => {
    const next = (idx + 1) % IDS.length
    setIdx(next)
    if (!armed) return
    if (kind === 'plain') return
    setWatched(IDS[next])
    setRuns((n) => n + 1)
  }

  return (
    <Figure
      kicker="Hình 2 · MaybeRefOrGetter"
      title="toValue() bên trong watch thì mới theo dõi được nguồn"
      caption="toValue chuẩn hóa string, ref hoặc getter thành giá trị. Gọi một lần lúc setup thì chỉ lấy snapshot. Gọi trong getter của watch thì Vue ghi sổ phụ thuộc, URL đổi là fetch lại."
    >
      <Tabs
        label="Đối số của useFetch"
        value={kind}
        onChange={changeKind}
        items={[
          { value: 'plain', label: 'string' },
          { value: 'ref', label: 'ref' },
          { value: 'getter', label: 'getter' },
        ]}
      />
      <p className="mt-3 font-mono text-xs text-fd-muted-foreground">{KIND_LABEL[kind]}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Cell label="URL hiện tại" value={current} />
        <Cell label="toValue() lúc setup" value={setupUrl ?? '—'} />
        <Cell label="watch đang fetch" value={watched ?? '—'} hot={armed && watched === current} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DemoButton onClick={() => arm(kind, idx)}>Chạy setup</DemoButton>
        <DemoButton tone="ghost" onClick={bump}>
          Đổi id
        </DemoButton>
        <span className="text-sm text-fd-muted-foreground">watch chạy {runs} lần</span>
      </div>

      <p
        className={cx(
          'mt-3 text-sm leading-6',
          !armed
            ? 'text-fd-muted-foreground'
            : kind === 'plain'
              ? 'text-amber-800 dark:text-amber-300'
              : 'text-emerald-800 dark:text-emerald-300',
        )}
      >
        {!armed
          ? 'Chọn kiểu đối số, chạy setup, rồi đổi id.'
          : kind === 'plain'
            ? 'String không phải nguồn reactive. watch không có gì để theo, nên fetch giữ URL lúc setup.'
            : 'Getter của watch gọi toValue, nên ref hoặc getter được ghi sổ. Đổi id là watch chạy lại.'}
      </p>
    </Figure>
  )
}

function Cell({ label, value, hot = false }: { label: string; value: string; hot?: boolean }) {
  return (
    <div
      className={cx(
        'rounded-lg border px-3 py-2',
        hot ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-fd-border bg-fd-background',
      )}
    >
      <div className="text-[0.68rem] text-fd-muted-foreground">{label}</div>
      <div className="truncate font-mono text-sm font-bold">{value}</div>
    </div>
  )
}
