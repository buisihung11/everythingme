import { EXTRA_QUIZZES } from './extra-quizzes'

export type QuizQuestion = {
  q: string
  code?: string[]
  options: string[]
  answer: number
  why: string
  review: { label: string; href: string }
}

const VUE_FUNDAMENTALS: QuizQuestion[] = [
  {
    q: 'Component dùng script setup. Người dùng bấm nút tăng count 3 lần. Phần script setup đã chạy tổng cộng bao nhiêu lần?',
    options: ['1 lần', '3 lần', '4 lần', 'Tùy số component con'],
    answer: 0,
    why: 'script setup chạy một lần khi instance được tạo. Thứ chạy lại sau mỗi lần bấm là render của component, không phải setup.',
    review: { label: 'Mô hình gốc', href: '#mo-hinh-goc' },
  },
  {
    q: 'Vì sao Vue không cần dependency array như useEffect hay useMemo?',
    options: [
      'Vue ghi sổ lúc đọc, nên tự biết phụ thuộc',
      'Compiler cấm gọi hàm trong template',
      'Mọi computed đều chạy lại mỗi lần render',
      'Bạn phải tự gọi track() trong setup',
    ],
    answer: 0,
    why: 'Khi một effect đọc dữ liệu reactive, Vue ghi tên effect đó vào sổ. Khi dữ liệu đổi, Vue tra sổ và chỉ chạy lại những effect đã đọc. Không có danh sách phụ thuộc để quên.',
    review: { label: 'Mô hình gốc', href: '#mo-hinh-goc' },
  },
  {
    q: 'Biến count khai báo ở top-level của script setup. Template viết {{ count }} được không?',
    options: [
      'Được: top-level của setup tự có mặt trong template',
      'Không: phải return { count } như Options API',
      'Không: phải export count',
      'Không: chỉ dùng được trong script',
    ],
    answer: 0,
    why: 'Mọi thứ khai báo ở top-level của script setup (biến, hàm, component đã import) đều dùng được ngay trong template, không cần return hay export.',
    review: { label: 'Não, Mặt, Áo', href: '#sfc' },
  },
  {
    q: 'Cha có count, con nhận :label="\'Hi\'" và không nhận count. Cha tăng count. Con có render lại không?',
    options: [
      'Không, nếu props của con không đổi',
      'Có, vì cha render thì mọi con render',
      'Có, vì script setup của con chạy lại',
      'Chỉ khi con bọc một thứ tương đương React.memo',
    ],
    answer: 0,
    why: 'Vue biết chính xác component nào đọc dữ liệu vừa đổi. Con không đọc count và props không đổi nên không render lại. Không cần memo mặc định.',
    review: { label: 'Mô hình gốc', href: '#mo-hinh-goc' },
  },
]

const REACTIVE_STATE: QuizQuestion[] = [
  {
    q: 'Đoạn code sau in ra gì?',
    code: ['const count = ref(0)', 'const n = count.value', 'count.value = 5', 'console.log(n)'],
    options: ['0', '5', 'undefined', 'Một object Ref'],
    answer: 0,
    why: 'count.value lấy con số ra khỏi hộp. n chỉ là bản sao với giá trị 0 tại thời điểm đọc, không theo dõi hộp nữa.',
    review: { label: 'ref là cái hộp', href: '#ref-reactive' },
  },
  {
    q: 'Sau khi state.qty++ chạy, template hiển thị gì?',
    code: [
      'const state = reactive({ qty: 1 })',
      'const { qty } = state',
      'state.qty++',
      '',
      '<template>{{ qty }}</template>',
    ],
    options: ['1', '2', 'Lỗi vì qty không phải ref', 'Chuỗi rỗng'],
    answer: 0,
    why: 'Destructure lấy con số 1 ra ngoài cổng Proxy, nên template đọc một biến thường và không bao giờ được báo. Dùng toRefs(state) để giữ liên kết.',
    review: { label: 'reactive là người gác cổng', href: '#ref-reactive' },
  },
  {
    q: 'Template đọc fullName (computed từ firstName và lastName) và note. Bạn sửa note. getter của fullName chạy bao nhiêu lần?',
    options: ['0 lần', '1 lần', '2 lần', 'Mỗi ký tự gõ vào một lần'],
    answer: 0,
    why: 'fullName không phụ thuộc note nên giá trị cache vẫn hợp lệ. Template render lại nhưng chỉ đọc lại cache. Nếu fullName là hàm thường gọi trong template, nó sẽ chạy lại mỗi lần render.',
    review: { label: 'Vue là một bảng tính', href: '#bang-tinh' },
  },
  {
    q: 'Đoạn code nào đặt sai chỗ?',
    code: [
      'const results = computed(async () => {',
      '  return await api.search(query.value)',
      '})',
    ],
    options: [
      'Nên chuyển sang watch(query, …) và ghi kết quả vào một ref',
      'Đúng rồi, computed hỗ trợ async',
      'Nên đổi computed thành reactive',
      'Chỉ cần thêm { lazy: true }',
    ],
    answer: 0,
    why: 'computed phải là hàm thuần và đồng bộ. Gọi API là side effect kích hoạt bởi query, nên đặt trong watch, rồi lưu kết quả vào một ref.',
    review: { label: 'Chọn đúng công cụ', href: '#chon-cong-cu' },
  },
  {
    q: 'Một watcher được khai báo mà không có option nào. Khi nào callback chạy lần đầu?',
    code: ['watch(userId, (id) => loadUser(id))'],
    options: [
      'Khi userId đổi lần đầu tiên sau khi khai báo',
      'Ngay lúc khai báo, rồi mỗi khi userId đổi',
      'Sau onMounted',
      'Mỗi lần component render',
    ],
    answer: 0,
    why: 'watch mặc định là lazy: nó chỉ chạy khi nguồn thay đổi. Muốn chạy ngay một lần với giá trị hiện tại thì thêm { immediate: true }, hoặc dùng watchEffect.',
    review: { label: 'Chọn đúng công cụ', href: '#chon-cong-cu' },
  },
]

const TEMPLATE_AND_LIFECYCLE: QuizQuestion[] = [
  {
    q: 'Pagination khai báo defineProps<{ total: number }>(). Cha viết dòng dưới. Bên trong con, props.total là gì?',
    code: ['<Pagination total="100" />'],
    options: [
      'Chuỗi "100", và Vue cảnh báo sai kiểu khi chạy dev',
      'Số 100',
      'undefined',
      'Lỗi biên dịch',
    ],
    answer: 0,
    why: 'Không có dấu hai chấm thì attribute luôn là string. Viết :total="100" để truyền biểu thức JavaScript, tức số 100.',
    review: { label: 'Template và phím tắt', href: '#template' },
  },
  {
    q: 'Dòng v-model dưới đây tương đương với cặp nào?',
    code: ['<input v-model="query" />'],
    options: [
      ':value="query" và @input="query = $event.target.value"',
      ':model="query" và @change="query = $event"',
      'v-bind="query"',
      ':value="query" và @update:modelValue="query = $event"',
    ],
    answer: 0,
    why: 'v-model = : cộng @. Trên input gốc, đó là :value và @input. Phương án cuối là dạng của v-model khi đặt trên component.',
    review: { label: 'Template và phím tắt', href: '#template' },
  },
  {
    q: 'Một panel chứa form, đang nhập dở. Bạn tắt rồi bật lại nó. Dữ liệu đang nhập còn không?',
    code: ['<FormPanel v-if="open" />'],
    options: [
      'Mất: v-if hủy component, bật lại là một instance mới',
      'Còn: v-if chỉ ẩn bằng CSS',
      'Còn, nếu form dùng v-model',
      'Mất, trừ khi bấm thật nhanh',
    ],
    answer: 0,
    why: 'v-if xây rồi đập: tắt là unmount, bật lại là mount một instance mới với state mới. Muốn giữ state thì dùng v-show, hoặc đưa state lên cha.',
    review: { label: 'v-if và v-show', href: '#template' },
  },
  {
    q: 'Lần mount đầu tiên, các bước chạy theo thứ tự nào?',
    options: [
      'setup → onBeforeMount → render → onMounted',
      'onBeforeMount → setup → render → onMounted',
      'setup → render → onBeforeMount → onMounted',
      'render → setup → onMounted',
    ],
    answer: 0,
    why: 'setup chạy trước tiên và đăng ký các hook. onBeforeMount chạy ngay trước khi tạo DOM, và onMounted chạy khi DOM đã nằm trên trang.',
    review: { label: 'Vòng đời', href: '#vong-doi' },
  },
  {
    q: 'Bạn mở một WebSocket trong onMounted. Đóng nó ở đâu?',
    options: ['onUnmounted', 'onUpdated', 'Trong một computed', 'Không cần, Vue tự đóng'],
    answer: 0,
    why: 'Thứ mở trong onMounted thì dọn ở onUnmounted. Cặp này tương đương useEffect(fn, []) và hàm cleanup của nó trong React.',
    review: { label: 'Vòng đời', href: '#vong-doi' },
  },
]

const COMPONENT_CONTRACTS: QuizQuestion[] = [
  {
    q: 'MyButton khai báo defineProps<{ disabled?: boolean }>(). Cha viết dòng dưới. Nút có bị disable không?',
    code: ['<MyButton disabled="false" />', '', '<!-- trong MyButton.vue -->', '<button :disabled="disabled">Lưu</button>'],
    options: [
      'Có: con nhận chuỗi "false", mà chuỗi khác rỗng là truthy',
      'Không: Vue tự đổi "false" thành false',
      'Không: attribute có giá trị "false" bị bỏ qua',
      'Lỗi biên dịch',
    ],
    answer: 0,
    why: 'Không có dấu : thì giá trị luôn là chuỗi. Vue cảnh báo sai kiểu nhưng vẫn truyền chuỗi "false", và chuỗi đó truthy. Viết :disabled="false", hoặc bỏ hẳn attribute.',
    review: { label: 'defineProps', href: '#props' },
  },
  {
    q: 'Vue 3.5. Cha đổi :size từ "sm" sang "lg". Template của con hiển thị gì?',
    code: ["const { size = 'md' } = defineProps<{ size?: string }>()", '', '<template>{{ size }}</template>'],
    options: [
      '"lg": compiler đổi size thành props.size nên vẫn reactive',
      '"sm": destructure làm mất reactivity',
      '"md": luôn là giá trị mặc định',
      'Lỗi: không được destructure defineProps',
    ],
    answer: 0,
    why: 'Từ Vue 3.5, destructure defineProps trong script setup được compiler biến đổi: mọi chỗ dùng size thành props.size. Giá trị mặc định viết thẳng trong destructure, không cần withDefaults.',
    review: { label: 'defineProps', href: '#props' },
  },
  {
    q: "Props khai báo bằng type: size?: 'sm' | 'md' | 'lg'. Cha truyền size=\"xl\". Lúc chạy chuyện gì xảy ra?",
    options: [
      'Không có cảnh báo runtime, chỉ vue-tsc và editor báo lỗi kiểu',
      'Vue cảnh báo "custom validator check failed"',
      'Vue ném lỗi và không render component',
      'size bị đổi về undefined',
    ],
    answer: 0,
    why: 'Khai báo bằng type được compiler chuyển thành { type: String }, không kèm validator cho từng literal. Muốn kiểm tra lúc chạy thì dùng khai báo runtime với validator.',
    review: { label: 'defineProps', href: '#props' },
  },
  {
    q: 'App viết <ProductList @add-to-cart="add" />. ProductCard bên trong gọi emit("addToCart", 1). ProductList không nghe sự kiện này. Hàm add có chạy không?',
    code: ['<!-- ProductList.vue -->', '<ul>', '  <ProductCard v-for="p in products" :product="p" />', '</ul>'],
    options: [
      'Không: sự kiện của component chỉ tới cha trực tiếp',
      'Có: sự kiện nổi bọt lên tới App',
      'Có, nếu ProductCard khai báo emits',
      'Chỉ khi thêm modifier .native',
    ],
    answer: 0,
    why: 'Sự kiện của component không nổi bọt. ProductList phải nghe @add-to-cart từ con rồi emit lại sự kiện của chính nó, hoặc bạn dùng provide/inject hay store.',
    review: { label: 'defineEmits', href: '#emits' },
  },
  {
    q: 'Con khai báo như dưới. Dòng nào gây lỗi TypeScript?',
    code: ['const emit = defineEmits<{', '  change: [id: number]', '  close: []', '}>()'],
    options: ["emit('change', '42')", "emit('change', 42)", "emit('close')", 'Không dòng nào'],
    answer: 0,
    why: 'Tuple [id: number] mô tả danh sách tham số của sự kiện. Truyền chuỗi cho id là sai kiểu. emit("close") không kèm payload là đúng với close: [].',
    review: { label: 'defineEmits', href: '#emits' },
  },
  {
    q: "Con viết const title = defineModel('title'). Cha cần viết gì để có two-way binding?",
    options: [
      'v-model:title="t"',
      'v-model="t"',
      ':title="t" là đủ',
      '@update:modelValue="t = $event"',
    ],
    answer: 0,
    why: "defineModel('title') tạo prop title và event update:title. v-model:title mở ra thành :title cộng @update:title. Chỉ truyền :title thì giá trị không quay về được cha.",
    review: { label: 'defineModel', href: '#define-model' },
  },
]

const SLOTS_AND_ATTRS: QuizQuestion[] = [
  {
    q: 'Cha viết <SubmitButton /> và không đặt gì bên trong. Nút hiển thị gì?',
    code: ['<!-- SubmitButton.vue -->', '<button type="submit">', '  <slot>Gửi</slot>', '</button>'],
    options: ['"Gửi"', 'Một nút rỗng', 'Lỗi vì thiếu slot', 'Chữ "slot"'],
    answer: 0,
    why: 'Nội dung đặt giữa <slot> và </slot> là fallback. Nó hiện ra khi cha không lắp gì vào lỗ đó.',
    review: { label: 'Slots', href: '#slots' },
  },
  {
    q: 'Nội dung slot dưới đây hiển thị gì?',
    code: ["<!-- Cha: const msg = 'của cha' -->", '<Child>{{ msg }}</Child>', '', "<!-- Child.vue: const msg = 'của con' -->", '<div><slot /></div>'],
    options: [
      '"của cha": nội dung slot được biên dịch trong scope của cha',
      '"của con": slot chạy bên trong con',
      'Cả hai, nối lại với nhau',
      'Lỗi vì trùng tên biến',
    ],
    answer: 0,
    why: 'Template của cha được biên dịch trong scope của cha, kể cả phần nằm trong thẻ của con. Muốn dùng dữ liệu của con thì con phải đưa lên qua scoped slot.',
    review: { label: 'Slots', href: '#slots' },
  },
  {
    q: 'Con render slot như dưới. Cha viết thế nào để hiển thị tên người dùng?',
    code: ['<!-- UserList.vue -->', '<li v-for="u in users" :key="u.id">', '  <slot name="row" :user="u" />', '</li>'],
    options: [
      '<template #row="{ user }">{{ user.name }}</template>',
      '<template #row="{ u }">{{ u.name }}</template>',
      '<template #row>{{ user.name }}</template>',
      '<template #default="{ user }">{{ user.name }}</template>',
    ],
    answer: 0,
    why: 'Tên trong slot props là tên attribute con đặt (:user), không phải tên biến trong v-for của con. Slot tên row nên cha phải dùng #row.',
    review: { label: 'Scoped slots', href: '#scoped-slots' },
  },
  {
    q: 'Root của BaseCard là <div class="card">, và BaseCard không khai báo prop nào. Cha viết dòng dưới. DOM ra sao?',
    code: ['<BaseCard class="shadow" id="main" />'],
    options: [
      '<div class="card shadow" id="main">',
      '<div class="shadow" id="main">',
      '<div class="card">',
      '<div class="card" data-attrs="shadow main">',
    ],
    answer: 0,
    why: 'class và id không được khai báo nên là fallthrough attrs, tự gắn lên root. Riêng class và style được gộp với giá trị sẵn có của root thay vì ghi đè.',
    review: { label: 'Fallthrough attributes', href: '#attrs' },
  },
  {
    q: 'BaseInput có root là <label> bọc một <input>. Muốn placeholder cha truyền vào nằm trên <input>, bạn làm gì?',
    options: [
      'defineOptions({ inheritAttrs: false }) và v-bind="$attrs" trên <input>',
      'Không cần làm gì, Vue tự tìm thẻ input',
      'Khai báo placeholder trong defineEmits',
      'Bọc template bằng <template> thay vì <label>',
    ],
    answer: 0,
    why: 'Mặc định attrs rơi xuống root, tức <label>. Tắt việc đó bằng inheritAttrs: false rồi chỉ định chỗ nhận bằng v-bind="$attrs". Cách khác là khai báo placeholder thành prop.',
    review: { label: 'Fallthrough attributes', href: '#attrs' },
  },
]

const REACTIVITY_DEEP_DIVE: QuizQuestion[] = [
  {
    q: 'Sau dòng raw.count++, template có cập nhật không?',
    code: ['const raw = { count: 0 }', 'const state = reactive(raw)', '', 'raw.count++', '// template: {{ state.count }}'],
    options: [
      'Không: sửa raw là đi vòng qua Proxy, nên không có trigger',
      'Có, vì state và raw là cùng một object',
      'Có, nhưng chậm một tick',
      'Lỗi: raw bị khóa sau khi bọc reactive',
    ],
    answer: 0,
    why: 'reactive trả về một Proxy bọc quanh raw. Sửa raw trực tiếp không đi qua bẫy set, nên không ai được báo. Dữ liệu đã đổi nhưng màn hình chỉ biết khi có thứ khác làm component render lại.',
    review: { label: 'Proxy và năm cái bẫy', href: '#proxy' },
  },
  {
    q: 'Lúc đầu state.showPrice là false. Sau đó bạn đổi price. watchEffect có chạy lại không?',
    code: [
      'watchEffect(() => {',
      '  label.value = state.showPrice',
      '    ? `${state.price}k`',
      "    : 'Ẩn giá'",
      '})',
      '',
      'state.price = 200',
    ],
    options: [
      'Không: lần chạy gần nhất không đọc price, nên sổ của price không có effect này',
      'Có, vì price xuất hiện trong thân hàm',
      'Có, nhưng chỉ khi flush là sync',
      'Lỗi vì đọc price trong điều kiện',
    ],
    answer: 0,
    why: 'Vue không đọc mã nguồn để đoán phụ thuộc. Nó ghi lại những gì thực sự được đọc trong lần chạy gần nhất. showPrice là false nên nhánh đọc price không chạy, và price không có tên effect này trong sổ.',
    review: { label: 'track và trigger', href: '#track-trigger' },
  },
  {
    q: 'Đoạn sau nằm trong script setup. Người dùng bấm nút làm state.count tăng. Dòng console.log có chạy lại không?',
    code: ['const state = reactive({ count: 0 })', 'console.log(state.count)', '', '<button @click="state.count++">+1</button>'],
    options: [
      'Không: lần đọc trong setup không thuộc effect nào, nên không có gì được ghi sổ',
      'Có, mỗi lần count đổi',
      'Có, nhưng chỉ lần đầu tiên',
      'Lỗi vì đọc reactive bên ngoài template',
    ],
    answer: 0,
    why: 'track chỉ ghi sổ khi đang có một effect chạy (render, computed, watch, watchEffect). setup chạy đúng một lần, và lần đọc đó không gắn với effect nào.',
    review: { label: 'track và trigger', href: '#track-trigger' },
  },
  {
    q: 'Bấm "Thêm" thì danh sách trên màn hình có thêm dòng không?',
    code: ['const rows = shallowRef([{ id: 1 }])', '', 'function add() {', '  rows.value.push({ id: 2 })', '}'],
    options: [
      'Không: shallowRef chỉ trigger khi gán lại .value',
      'Có, vì push luôn reactive',
      'Có, nhưng chậm một tick',
      'Lỗi: mảng trong shallowRef bị đóng băng',
    ],
    answer: 0,
    why: 'shallowRef chỉ canh cửa .value. push sửa bên trong mảng nên không ai được báo. Sửa bằng rows.value = [...rows.value, { id: 2 }], hoặc gọi triggerRef(rows) sau khi push.',
    review: { label: 'Gác cổng canh tới đâu', href: '#do-sau' },
  },
  {
    q: 'Bạn lưu instance của một thư viện bản đồ vào ref, rồi gặp lỗi lạ khi gọi method của nó. Cách sửa hợp lý nhất là gì?',
    code: ['const map = ref(new MapView(el))', 'map.value.flyTo(center) // TypeError…'],
    options: [
      'Dùng shallowRef, hoặc markRaw cho instance, để nó không bị bọc Proxy',
      'Đổi ref thành reactive',
      'Gọi toRefs(map)',
      'Bọc thêm readonly()',
    ],
    answer: 0,
    why: 'ref bọc object trong .value bằng reactive(), tức một Proxy sâu. Class dùng private field (#x) hoặc so sánh identity sẽ hỏng khi this là Proxy, và Vue tốn công theo dõi hàng nghìn thuộc tính không cần thiết.',
    review: { label: 'Gác cổng canh tới đâu', href: '#do-sau' },
  },
  {
    q: 'Cách nào watch đúng một thuộc tính của props?',
    options: [
      'watch(() => props.id, load)',
      'watch(props.id, load)',
      "watch('props.id', load)",
      'watch(toRaw(props).id, load)',
    ],
    answer: 0,
    why: 'props.id được tính ngay thành một giá trị, Vue không theo dõi được giá trị. Getter () => props.id được chạy trong effect, nên lần đọc props.id được ghi sổ.',
    review: { label: 'Bẫy destructure', href: '#destructure' },
  },
]

const TICK_AND_SCOPE: QuizQuestion[] = [
  {
    q: 'count đang là 0, template có <p ref="p">{{ count }}</p>. Đoạn sau in ra gì?',
    code: ['count.value = 5', 'console.log(p.value.textContent)', 'await nextTick()', 'console.log(p.value.textContent)'],
    options: ['"0" rồi "5"', '"5" rồi "5"', '"0" rồi "0"', '"5" rồi "0"'],
    answer: 0,
    why: 'Sửa state chỉ đưa job render vào hàng đợi. DOM được patch khi Vue flush ở microtask kế tiếp. await nextTick() chờ đúng lần flush đó, nên lần đọc thứ hai mới thấy "5".',
    review: { label: 'Chuyến xe cuối tick', href: '#lich-cap-nhat' },
  },
  {
    q: 'Handler sau làm component render bao nhiêu lần?',
    code: ['function reset() {', "  form.name = ''", "  form.email = ''", '  form.agree = false', '  errors.value = []', '}'],
    options: ['1 lần', '4 lần', '0 lần', '2 lần'],
    answer: 0,
    why: 'Mỗi trigger chỉ đưa cùng một job render vào hàng đợi, trùng thì bỏ qua. Vue flush một lần sau khi handler chạy xong. React 18 cũng tự gom các lần setState theo cách tương tự.',
    review: { label: 'Chuyến xe cuối tick', href: '#lich-cap-nhat' },
  },
  {
    q: 'Watcher dưới đây không truyền option flush. Trong callback, DOM đã phản ánh giá trị mới của count chưa?',
    code: ['watch(count, () => {', '  console.log(el.value.textContent)', '})'],
    options: [
      "Chưa: mặc định là flush: 'pre', chạy trước khi patch DOM",
      'Rồi: watcher luôn chạy sau khi DOM cập nhật',
      'Tùy trình duyệt',
      'Chỉ khi count là ref',
    ],
    answer: 0,
    why: "Watcher mặc định chạy trước khi component của nó cập nhật DOM. Cần đọc DOM mới thì dùng flush: 'post' (hoặc watchPostEffect), hoặc await nextTick() trong callback.",
    review: { label: 'Chuyến xe cuối tick', href: '#lich-cap-nhat' },
  },
  {
    q: 'Component bị unmount. Watcher nào vẫn còn chạy?',
    code: ['// trong script setup', 'watch(a, fnA)', '', 'setTimeout(() => {', '  watch(b, fnB)', '}, 100)'],
    options: ['Chỉ watcher của b', 'Cả hai', 'Không cái nào', 'Chỉ watcher của a'],
    answer: 0,
    why: 'Watcher tạo đồng bộ trong setup nằm trong scope của component nên dừng khi unmount. Watcher tạo trong setTimeout không thuộc scope nào. Bạn phải giữ hàm stop mà watch trả về và tự gọi nó.',
    review: { label: 'Cái túi gom effect', href: '#effect-scope' },
  },
]

export const QUIZZES = {
  'vue-fundamentals': VUE_FUNDAMENTALS,
  'reactive-state': REACTIVE_STATE,
  'template-and-lifecycle': TEMPLATE_AND_LIFECYCLE,
  'component-contracts': COMPONENT_CONTRACTS,
  'slots-and-attrs': SLOTS_AND_ATTRS,
  'reactivity-deep-dive': REACTIVITY_DEEP_DIVE,
  'tick-and-scope': TICK_AND_SCOPE,
  ...EXTRA_QUIZZES,
} satisfies Record<string, QuizQuestion[]>

export type QuizId = keyof typeof QUIZZES
