export const VUE_STUDY_HOME = '/blog/technical/web-development/vue-study'

export type VueStudyLesson = {
  slug: string
  title: string
  summary: string
  status: 'published' | 'planned'
}

export const VUE_STUDY_LESSONS: VueStudyLesson[] = [
  {
    slug: 'vue-fundamentals',
    title: 'Mô hình gốc',
    summary: 'React chụp ảnh, Vue ghi sổ. Giải phẫu một SFC: não, mặt, áo.',
    status: 'published',
  },
  {
    slug: 'reactive-state',
    title: 'Hộp, gác cổng, bảng tính',
    summary: 'ref, reactive, computed và watch: chọn đúng công cụ cho state.',
    status: 'published',
  },
  {
    slug: 'template-and-lifecycle',
    title: 'Template và vòng đời',
    summary: 'Bốn ký hiệu template, v-if và v-show, mount và unmount.',
    status: 'published',
  },
  {
    slug: 'component-contracts',
    title: 'Hợp đồng: props, emits, v-model',
    summary: 'defineProps, defineEmits và defineModel: viết component cho người khác dùng.',
    status: 'published',
  },
  {
    slug: 'slots-and-attrs',
    title: 'Slot và fallthrough',
    summary: 'Default slot, named slot, scoped slot và attribute rơi xuống root.',
    status: 'published',
  },
  {
    slug: 'reactivity-deep-dive',
    title: 'Khi UI không cập nhật',
    summary: 'Proxy, track và trigger, shallowRef, markRaw và bẫy destructure.',
    status: 'published',
  },
  {
    slug: 'tick-and-scope',
    title: 'nextTick và effectScope',
    summary: 'Batching, đọc DOM sau khi cập nhật, và túi gom effect để không rò rỉ.',
    status: 'published',
  },
  {
    slug: 'composables',
    title: 'Composables',
    summary: 'Tách logic có state thành hàm use…, nhận ref hoặc getter, dọn bằng onScopeDispose.',
    status: 'published',
  },
  {
    slug: 'provide-inject',
    title: 'Provide và inject',
    summary: 'Chia sẻ theme xuống cây component bằng InjectionKey, không khoan props.',
    status: 'published',
  },
  {
    slug: 'pinia',
    title: 'Pinia',
    summary: 'Store dùng chung khi composable mỗi nơi một bản. Setup store và storeToRefs.',
    status: 'published',
  },
  {
    slug: 'server-state',
    title: 'Dữ liệu từ server',
    summary: 'Cache của request không phải client state. useUser(id) có loading, lỗi và abort.',
    status: 'published',
  },
  {
    slug: 'vue-router',
    title: 'Vue Router',
    summary: 'Params, lazy route và beforeEnter: guard thấy route, chưa thấy component.',
    status: 'published',
  },
  {
    slug: 'project-architecture',
    title: 'Kiến trúc thư mục',
    summary: 'Đặt cart vào pages, widgets, features, entities, shared. Không import ngược lên.',
    status: 'published',
  },
  {
    slug: 'testing',
    title: 'Đọc một test Vue',
    summary: 'Vitest và Vue Test Utils: mount, text, emitted, props. So với Testing Library.',
    status: 'published',
  },
  {
    slug: 'performance',
    title: 'Performance đúng chỗ',
    summary: ':key ổn định, KeepAlive, v-memo khi nêu được deps, shallowRef cho list lớn.',
    status: 'published',
  },
]

export function lessonHref(slug: string) {
  return `${VUE_STUDY_HOME}/${slug}`
}
