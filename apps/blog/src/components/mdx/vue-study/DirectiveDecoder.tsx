import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { CodeLines, Figure, cx } from './ui'

const DIRECTIVES = [
  {
    key: 'interp',
    label: '{{ }}',
    name: 'Text interpolation',
    vue: ['<p>Xin chào {{ user.name }}</p>', '<p>{{ items.length }} món</p>'],
    react: ['<p>Xin chào {user.name}</p>', '<p>{items.length} món</p>'],
    hook: 'Hai cặp ngoặc nhọn là một ô cửa sổ: nhìn ra một biểu thức JavaScript và in kết quả thành text.',
    note: 'Chỉ nhận biểu thức, không nhận câu lệnh: {{ a ? b : c }} được, {{ if (a) b }} thì không. Vue tự escape HTML.',
  },
  {
    key: 'bind',
    label: ':prop',
    name: 'v-bind',
    vue: ['<img :src="avatarUrl" :alt="user.name" />', '<Card :title="title" :count="3" />'],
    react: ['<img src={avatarUrl} alt={user.name} />', '<Card title={title} count={3} />'],
    hook: 'Dấu hai chấm giống một sợi dây: nối giá trị JavaScript vào attribute. Không có dấu hai chấm thì giá trị là string.',
    note: 'count="3" truyền string "3", còn :count="3" truyền number 3. Đây là bug hay gặp nhất khi mới chuyển sang Vue.',
  },
  {
    key: 'on',
    label: '@event',
    name: 'v-on',
    vue: ['<button @click="save">Lưu</button>', '<form @submit.prevent="send">…</form>'],
    react: ['<button onClick={save}>Lưu</button>', '<form onSubmit={e => { e.preventDefault(); send() }}>'],
    hook: '@ đọc là "at": tại sự kiện click thì gọi save. Modifier như .prevent hay .stop là đường tắt cho các dòng lặp đi lặp lại.',
    note: 'Viết @click="count++" cũng được: Vue tự bọc biểu thức đó thành một hàm.',
  },
  {
    key: 'if',
    label: 'v-if',
    name: 'Conditional rendering',
    vue: ['<Spinner v-if="loading" />', '<ErrorBox v-else-if="error" />', '<List v-else :items="items" />'],
    react: ['{loading ? <Spinner />', '  : error ? <ErrorBox />', '  : <List items={items} />}'],
    hook: 'v-if, v-else-if, v-else đọc như một chuỗi if/else. Hết lồng ternary.',
    note: 'v-else phải đứng ngay sau phần tử có v-if. Muốn bọc nhiều phần tử mà không thêm thẻ thật thì dùng <template v-if>.',
  },
  {
    key: 'for',
    label: 'v-for',
    name: 'List rendering',
    vue: ['<li v-for="todo in todos" :key="todo.id">', '  {{ todo.title }}', '</li>'],
    react: ['{todos.map(todo => (', '  <li key={todo.id}>{todo.title}</li>', '))}'],
    hook: 'Đọc như vòng for...in trong tiếng Anh: "với mỗi todo trong todos". :key vẫn là căn cước của từng dòng, giống key trong React.',
    note: 'Đừng đặt v-if và v-for trên cùng một phần tử: trong Vue 3, v-if được xét trước. Hãy lọc trong computed trước.',
  },
  {
    key: 'model',
    label: 'v-model',
    name: 'Two-way binding',
    vue: ['<input v-model="query" />', '', '<!-- tương đương -->', '<input :value="query"', '       @input="query = $event.target.value" />'],
    react: ['<input', '  value={query}', '  onChange={e => setQuery(e.target.value)}', '/>'],
    hook: 'v-model = : + @. Một sợi dây đi vào (value) và một sợi dây đi ra (event). Đây là đường tắt, không có phép thuật gì.',
    note: 'Trên component, v-model là modelValue cộng update:modelValue. Từ Vue 3.4, dùng defineModel() để viết phía con.',
  },
] as const

export function DirectiveDecoder() {
  const [key, setKey] = useState<(typeof DIRECTIVES)[number]['key']>('bind')
  const d = DIRECTIVES.find((x) => x.key === key)!

  return (
    <Figure
      kicker="Hình 6 · Template decoder"
      title="Template là JavaScript cộng vài phím tắt"
      caption="Bốn ký hiệu cần thuộc: {{ }} để in text, : để nối dữ liệu vào attribute, @ để nghe sự kiện, v-model là : và @ gộp lại."
    >
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Directive">
        {DIRECTIVES.map((x) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={x.key === key}
            onClick={() => setKey(x.key)}
            className={cx(
              'rounded-lg border px-2.5 py-1 font-mono text-sm font-semibold transition-colors',
              x.key === key
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:text-fd-foreground',
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm font-semibold text-fd-foreground">{d.name}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">Vue template</p>
          <CodeLines lines={d.vue.map((text) => ({ text }))} />
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold text-sky-700 dark:text-sky-400">React JSX tương đương</p>
          <CodeLines lines={d.react.map((text) => ({ text }))} />
        </div>
      </div>
      <p className="mt-3 flex gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm leading-6 text-fd-foreground">
        <Lightbulb className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <span><strong>Cách nhớ:</strong> {d.hook}</span>
      </p>
      <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">{d.note}</p>
    </Figure>
  )
}
