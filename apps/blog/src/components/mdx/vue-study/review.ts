import {
  Archive,
  Ban,
  Bell,
  Brain,
  Bus,
  Cable,
  Calculator,
  Camera,
  Cloud,
  Droplets,
  Eye,
  FlaskConical,
  FolderTree,
  Handshake,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  NotebookPen,
  Package,
  Plug,
  PlugZap,
  Puzzle,
  Repeat,
  Route,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Siren,
  Spotlight,
  Unlink,
  Waves,
  type LucideIcon,
} from 'lucide-react'

export type MemoryItem = { icon: LucideIcon; image: string; concept: string; href: string }
export type Flashcard = { q: string; a: string }

const VUE_FUNDAMENTALS_MAP: MemoryItem[] = [
  {
    icon: Camera,
    image: 'Chụp ảnh vs ghi sổ',
    concept: 'React chạy lại hàm; Vue ghi ai đọc dữ liệu rồi chỉ báo đúng người đó',
    href: '#mo-hinh-goc',
  },
  {
    icon: Brain,
    image: 'Não, Mặt, Áo',
    concept: 'script setup, template, style của một SFC',
    href: '#sfc',
  },
]

const REACTIVE_STATE_MAP: MemoryItem[] = [
  { icon: Package, image: 'Cái hộp', concept: 'ref: mở bằng .value, template tự mở', href: '#ref-reactive' },
  { icon: ShieldCheck, image: 'Người gác cổng', concept: 'reactive: Proxy ghi sổ ai đọc, báo khi ai ghi', href: '#ref-reactive' },
  { icon: Calculator, image: 'Ô công thức', concept: 'computed: tự tính lại, có cache', href: '#bang-tinh' },
  { icon: Bell, image: 'Cái chuông', concept: 'watch: dữ liệu đổi thì làm một việc', href: '#chon-cong-cu' },
]

const TEMPLATE_LIFECYCLE_MAP: MemoryItem[] = [
  { icon: Cable, image: 'Sợi dây : và @', concept: 'v-bind nối vào, v-on nghe ra, v-model là cả hai', href: '#template' },
  { icon: Eye, image: 'Đập vs kéo rèm', concept: 'v-if hủy instance, v-show chỉ ẩn bằng CSS', href: '#template' },
  { icon: Repeat, image: 'Sinh, lên sóng, xuống sóng', concept: 'onMounted mở, onUnmounted dọn', href: '#vong-doi' },
]

const COMPONENT_CONTRACTS_MAP: MemoryItem[] = [
  { icon: Handshake, image: 'Thiết bị có ổ cắm', concept: 'props vào, emits ra, v-model hai chiều', href: '#hop-dong' },
  { icon: Plug, image: 'Ổ cắm vào', concept: 'defineProps: kiểu, mặc định, chỉ đọc', href: '#props' },
  { icon: Droplets, image: 'Nước xuống, khói lên', concept: 'props đi xuống, emit đi lên, không nổi bọt', href: '#emits' },
  { icon: Waves, image: 'Ống hai chiều', concept: 'defineModel = prop modelValue + update:modelValue', href: '#define-model' },
]

const SLOTS_ATTRS_MAP: MemoryItem[] = [
  { icon: Puzzle, image: 'Khuôn có lỗ', concept: 'slot: con chừa lỗ, cha lắp nội dung vào', href: '#slots' },
  { icon: Spotlight, image: 'Lỗ có đèn chiếu ngược', concept: 'scoped slot: con đưa dữ liệu, cha vẽ giao diện', href: '#scoped-slots' },
  { icon: PlugZap, image: 'Rơi xuống root', concept: 'attr không khai báo tự gắn lên phần tử gốc', href: '#attrs' },
]

const REACTIVITY_DEEP_DIVE_MAP: MemoryItem[] = [
  { icon: ShieldCheck, image: 'Gác cổng có năm cái bẫy', concept: 'Proxy chặn get, set, has, delete và ownKeys', href: '#proxy' },
  { icon: NotebookPen, image: 'Cuốn sổ ba tầng', concept: 'track ghi effect vào WeakMap → Map → Dep', href: '#track-trigger' },
  { icon: Layers, image: 'Gác cổng canh tới đâu', concept: 'ref canh sâu, shallow chỉ canh lớp ngoài', href: '#do-sau' },
  { icon: LogOut, image: 'Mang đồ ra khỏi cổng', concept: 'destructure mất liên kết; truyền hộp hoặc getter', href: '#destructure' },
]

const TICK_AND_SCOPE_MAP: MemoryItem[] = [
  { icon: Bus, image: 'Chuyến xe cuối tick', concept: 'nhiều thay đổi, một lần flush; nextTick là chờ xe chạy', href: '#lich-cap-nhat' },
  { icon: ShoppingBag, image: 'Cái túi gom effect', concept: 'effectScope gom watcher để dừng một lần', href: '#effect-scope' },
]

const COMPOSABLES_MAP: MemoryItem[] = [
  { icon: Puzzle, image: 'Hàm tự giữ state', concept: 'mỗi lần gọi useToggle() là một ref riêng', href: '#use-toggle' },
  { icon: Eye, image: 'toValue trong watch', concept: 'string, ref hoặc getter, chỉ được theo dõi khi đọc bên trong watch', href: '#to-value' },
  { icon: Ban, image: 'Gọi sai chỗ', concept: 'ngoài setup hoặc trong nhánh setup không chạy thì effect không vào túi', href: '#call-site' },
]

const PROVIDE_INJECT_MAP: MemoryItem[] = [
  { icon: Share2, image: 'Nước đi xuyên tầng', concept: 'provide ở tổ tiên, inject ở cháu, tầng giữa không khai báo prop', href: '#theme-tree' },
  { icon: KeyRound, image: 'Chìa khóa Symbol', concept: 'InjectionKey tránh đụng string, cha gần nhất thắng', href: '#injection-key' },
  { icon: Lock, image: 'Khóa chiều ghi', concept: 'readonly cho consumer. Object thường không làm con render lại', href: '#injection-key' },
]

const PINIA_MAP: MemoryItem[] = [
  { icon: ShoppingCart, image: 'Một giỏ, nhiều cửa', concept: 'useCartStore() luôn trả về cùng store, khác composable', href: '#when-store' },
  { icon: Layers, image: 'Setup store', concept: 'ref là state, computed là getter, function là action', href: '#cart-store' },
  { icon: Unlink, image: 'Bóc store', concept: 'destructure reactive mất liên kết. storeToRefs giữ ref', href: '#store-to-refs' },
]

const SERVER_STATE_MAP: MemoryItem[] = [
  { icon: Cloud, image: 'Request có ba ô', concept: 'loading, error, data sống cạnh useUser(id)', href: '#use-user' },
  { icon: Siren, image: 'Cache không phải store', concept: 'Pinia không biết lúc nào danh sách server đã cũ', href: '#wrong-home' },
]

const VUE_ROUTER_MAP: MemoryItem[] = [
  { icon: Route, image: 'Cùng instance, khác id', concept: 'watch bằng getter. Gán params không đổi URL', href: '#params' },
  { icon: ShieldCheck, image: 'Lính gác trước cửa', concept: 'beforeEnter thấy to/from, chưa thấy component', href: '#before-enter' },
]

const PROJECT_ARCHITECTURE_MAP: MemoryItem[] = [
  { icon: FolderTree, image: 'Cart nằm đúng tầng', concept: 'pages ghép, feature là hành động, entity là danh từ, shared không biết nghiệp vụ', href: '#cart-tree' },
  { icon: Ban, image: 'Mũi tên chỉ đi xuống', concept: 'cùng tầng thì cấm. Tầng thấp không import tầng cao', href: '#import-rule' },
]

const TESTING_MAP: MemoryItem[] = [
  { icon: FlaskConical, image: 'Đọc một test', concept: 'mount, text, emitted. Số trên màn hình chưa đổi nếu cha chưa setProps', href: '#read-test' },
  { icon: Eye, image: 'Đúng cửa assertion', concept: 'chữ thì text(), event thì emitted(), prop thì props()', href: '#assertion' },
]

const PERFORMANCE_MAP: MemoryItem[] = [
  { icon: Repeat, image: 'Chìa khóa của dòng', concept: ':key là id thì input đi theo món khi đảo list', href: '#pick-tool' },
  { icon: Archive, image: 'Tủ giữ instance', concept: 'KeepAlive cache khi tắt. v-if bọc ngoài thì tủ bị hủy', href: '#keep-alive' },
  { icon: Eye, image: 'v-memo kể deps', concept: 'thiếu name trong mảng thì DOM giữ tên cũ', href: '#v-memo' },
]

export const MEMORY_MAPS = {
  'vue-fundamentals': VUE_FUNDAMENTALS_MAP,
  'reactive-state': REACTIVE_STATE_MAP,
  'template-and-lifecycle': TEMPLATE_LIFECYCLE_MAP,
  'component-contracts': COMPONENT_CONTRACTS_MAP,
  'slots-and-attrs': SLOTS_ATTRS_MAP,
  'reactivity-deep-dive': REACTIVITY_DEEP_DIVE_MAP,
  'tick-and-scope': TICK_AND_SCOPE_MAP,
  composables: COMPOSABLES_MAP,
  'provide-inject': PROVIDE_INJECT_MAP,
  pinia: PINIA_MAP,
  'server-state': SERVER_STATE_MAP,
  'vue-router': VUE_ROUTER_MAP,
  'project-architecture': PROJECT_ARCHITECTURE_MAP,
  testing: TESTING_MAP,
  performance: PERFORMANCE_MAP,
} satisfies Record<string, MemoryItem[]>

const VUE_FUNDAMENTALS_CARDS: Flashcard[] = [
  {
    q: 'Vì sao Vue không có stale closure như React?',
    a: 'setup chạy một lần. Các hàm luôn đọc state qua ref.value hoặc qua Proxy, nên lần đọc nào cũng ra giá trị mới nhất. Không có snapshot cũ nào bị giữ lại.',
  },
  {
    q: 'Hình ảnh để nhớ mô hình gốc của Vue?',
    a: 'React chụp ảnh: mỗi lần state đổi là gọi lại hàm component. Vue ghi sổ: setup chạy một lần, rồi chỉ báo những effect đã đọc dữ liệu vừa đổi.',
  },
  {
    q: 'Não, Mặt, Áo của một SFC là gì?',
    a: 'script setup là não (chạy một lần), template là mặt (compiler đọc được), style là áo. Top-level của setup dùng được ngay trong template, không cần return.',
  },
  {
    q: 'Component con có render lại mỗi khi cha render không?',
    a: 'Không mặc định. Con chỉ render lại khi props của nó, hoặc dữ liệu chính nó đọc, thay đổi.',
  },
]

const REACTIVE_STATE_CARDS: Flashcard[] = [
  { q: 'Hình ảnh để nhớ ref?', a: 'Một cái hộp. Script mở hộp bằng .value, template tự mở. Lấy giá trị ra khỏi hộp là mất liên kết.' },
  { q: 'Hình ảnh để nhớ reactive?', a: 'Người gác cổng (Proxy): đọc thì ghi tên vào sổ (track), ghi thì báo cho người trong sổ (trigger). Destructure là ra khỏi cổng. Dùng toRefs để giữ liên kết.' },
  { q: 'computed khác hàm thường gọi trong template thế nào?', a: 'computed được cache và chỉ tính lại khi phụ thuộc đổi. Hàm thường chạy lại mỗi lần component render.' },
  { q: 'Khi nào dùng watch?', a: 'Khi cần side effect (gọi API, ghi localStorage, sửa DOM ngoài component) mỗi khi một nguồn dữ liệu đổi.' },
  { q: 'Nên dùng ref hay reactive làm mặc định?', a: 'Mặc định dùng ref. Tài liệu Vue cũng khuyên vậy. reactive chỉ khi gom nhiều trường liên quan và sẽ không destructure.' },
]

const TEMPLATE_LIFECYCLE_CARDS: Flashcard[] = [
  { q: ':count="3" khác count="3" thế nào?', a: 'Dấu : nối giá trị JavaScript vào, nên truyền number 3. Không có dấu : thì truyền string "3".' },
  { q: 'v-model thực chất là gì?', a: 'Hai thứ gộp lại: : cộng @. Trên input là :value và @input. Trên component là :modelValue và @update:modelValue.' },
  { q: 'v-if hay v-show cho một tab bật tắt liên tục?', a: 'v-show: chỉ kéo rèm (display: none), không xây lại DOM và không mất state.' },
  { q: 'onMounted tương đương gì bên React?', a: 'useEffect(fn, []). Phần cleanup của nó tương ứng onUnmounted.' },
]

const COMPONENT_CONTRACTS_CARDS: Flashcard[] = [
  {
    q: 'Hình ảnh để nhớ hợp đồng của một component?',
    a: 'Một thiết bị có ổ cắm: props là ổ vào, emits là đèn báo ra, v-model là ống hai chiều. Slot và attrs là bài sau.',
  },
  { q: 'disabled khai báo kiểu boolean. <Btn disabled /> và <Btn /> cho giá trị gì?', a: 'true và false. Prop boolean vắng mặt là false, không phải undefined. Viết attribute không có giá trị nghĩa là true.' },
  { q: 'Vue 3.5: const { title } = defineProps() có mất reactivity không?', a: 'Không. Compiler đổi title thành props.title. Nhưng khi đưa ra ngoài (watch, composable) phải bọc getter: watch(() => title, …).' },
  { q: 'emit có nổi bọt như DOM event không?', a: 'Không. Sự kiện của component chỉ tới cha trực tiếp. Muốn ông nghe được thì cha phải emit lại, hoặc dùng provide/inject hay store.' },
  { q: 'defineModel() thực chất là gì?', a: 'Một prop modelValue cộng một event update:modelValue, gói trong một ref. Gán model.value = x chính là emit giá trị mới lên cha.' },
  { q: 'Cha viết v-model:title="t". Con cần khai báo gì?', a: "defineModel('title'). Nó tạo prop title và event update:title. Một component có thể có nhiều v-model như vậy." },
]

const SLOTS_ATTRS_CARDS: Flashcard[] = [
  { q: 'Slot tương đương gì bên React?', a: 'Default slot ≈ children. Named slot ≈ prop nhận ReactNode (header={…}). Scoped slot ≈ render prop. Nội dung slot được biên dịch trong scope của cha.' },
  { q: 'Scoped slot đưa dữ liệu theo chiều nào?', a: 'Từ con lên template của cha: con viết <slot :item="item" />, cha nhận bằng #default="{ item }". Con quyết định dữ liệu, cha quyết định giao diện.' },
  { q: 'Fallthrough attribute là gì?', a: 'Attribute và listener truyền vào component mà không được khai báo là prop hay emit. Vue gắn chúng lên phần tử root; class và style được gộp chứ không ghi đè.' },
  { q: 'Khi nào dùng inheritAttrs: false?', a: 'Khi root không phải chỗ nên nhận attrs, ví dụ div bọc ngoài input. Tắt bằng defineOptions({ inheritAttrs: false }) rồi đặt v-bind="$attrs" lên input.' },
]

const REACTIVITY_DEEP_DIVE_CARDS: Flashcard[] = [
  { q: 'Proxy giúp Vue 3 làm được gì mà Vue 2 không làm được?', a: 'Proxy chặn mọi thao tác trên object, kể cả thêm key mới, xóa key và duyệt key. Vue 2 dùng Object.defineProperty nên chỉ canh được các key có sẵn lúc khởi tạo.' },
  { q: 'Cuốn sổ ghi tên của Vue có hình dạng thế nào?', a: 'WeakMap (object gốc) → Map (tên thuộc tính) → Dep (các effect đang đọc thuộc tính đó). trigger(target, key) tra đúng đường này rồi chạy lại các effect trong Dep.' },
  { q: 'Vì sao một computed có thể "quên" một phụ thuộc?', a: 'Mỗi lần chạy, effect thu thập lại phụ thuộc từ đầu. Nhánh if không chạy thì thuộc tính trong nhánh đó không được đọc, nên bị gỡ khỏi sổ. Đây là tính năng, không phải bug.' },
  { q: 'const p = reactive(raw), rồi raw.count++. UI có cập nhật không?', a: 'Không. Chỉ proxy mới có gác cổng. Sửa object gốc là đi cửa sau, không ai bị báo. Luôn làm việc với proxy.' },
  { q: 'shallowRef khác ref ở đâu?', a: 'shallowRef chỉ canh cửa .value. list.value.push(x) không trigger. Muốn cập nhật thì thay cả giá trị (list.value = [...]) hoặc gọi triggerRef(list).' },
  { q: 'Khi nào dùng markRaw?', a: 'Cho object không bao giờ cần reactive: instance của map, chart, editor hay class phức tạp. Vue sẽ không bọc Proxy cho nó, kể cả khi nó nằm trong một reactive.' },
  { q: 'watch(state.count, cb) sai ở đâu?', a: 'state.count là một con số, không phải nguồn reactive. Truyền getter: watch(() => state.count, cb). Muốn giữ liên kết thì truyền cái hộp hoặc một hàm, đừng truyền giá trị.' },
]

const TICK_AND_SCOPE_CARDS: Flashcard[] = [
  { q: 'count.value++ ba lần trong một handler. Component render mấy lần?', a: 'Một lần. Vue đưa job render vào hàng đợi (trùng thì bỏ qua), rồi flush một lần ở microtask kế tiếp.' },
  { q: 'Vì sao cần await nextTick()?', a: 'Sửa state xong, DOM chưa đổi ngay. nextTick trả về một promise resolve sau khi Vue flush xong hàng đợi, lúc đó DOM đã mới.' },
  { q: 'Watcher mặc định chạy trước hay sau khi DOM patch?', a: "Trước. flush: 'pre' là mặc định. Cần DOM mới thì flush: 'post' hoặc await nextTick()." },
  { q: 'effectScope dùng để làm gì?', a: 'Gom nhiều computed, watch, watchEffect để dừng một lần bằng scope.stop(). Component đã tự có scope riêng; bạn cần effectScope khi tạo effect ở ngoài component.' },
]

const COMPOSABLES_CARDS: Flashcard[] = [
  { q: 'useToggle() gọi ở hai component có chung state không?', a: 'Không. Mỗi lần gọi tạo ref riêng, giống custom hook có useState. Muốn một bản dùng chung thì dùng store hoặc provide/inject.' },
  { q: 'Vì sao composable nên return object chứa ref, không return reactive()?', a: 'const { on } = useToggle() vẫn giữ ref. Destructure một object reactive() thì mất liên kết, cùng bệnh với reactive ở Bài 2.' },
  { q: 'toValue() khác unref() ở đâu?', a: 'toValue thêm một việc: nếu đối số là hàm thì gọi hàm đó và lấy giá trị trả về. unref chỉ mở ref. Cả hai trả nguyên giá trị thường nếu không phải ref.' },
  { q: 'Gọi toValue(url) một lần lúc setup thì URL đổi có fetch lại không?', a: 'Không. Phải gọi toValue bên trong watch hoặc watchEffect để lần đọc được ghi sổ.' },
  { q: 'Composable được gọi ở đâu?', a: 'Đồng bộ trong script setup hoặc setup(). Gọi trong onClick thì không có active instance. Nhánh if không chạy ở lần setup duy nhất thì composable đó không bao giờ được gọi.' },
]

const PROVIDE_INJECT_CARDS: Flashcard[] = [
  { q: 'provide/inject tương đương gì bên React?', a: 'Context. Cha provide một key, cháu inject. Tầng giữa không khai báo prop. Khác context ở chỗ ref được provide sẽ không tự unwrap khi inject.' },
  { q: 'Hai cha cùng provide string "theme". Con nhận của ai?', a: 'Cha gần nhất. InjectionKey là Symbol, nên key của thư viện khác không đụng key của bạn.' },
  { q: 'Vì sao bọc readonly() khi provide một ref?', a: 'Consumer vẫn đọc và vẫn cập nhật khi provider đổi, nhưng gán .value bị chặn. Chỗ ghi nằm ở provider.' },
  { q: 'provide một object thường rồi mutate. Con có render lại không?', a: 'Không. Không có liên kết reactive nên không ai bị trigger. Provide ref hoặc reactive thì con mới cập nhật.' },
]

const PINIA_CARDS: Flashcard[] = [
  { q: 'Pinia giống thư viện nào bên React?', a: 'Zustand: gọi hook store ở nhiều component vẫn ra cùng một bản. Composable thì mỗi lần gọi một state, giống hook có useState bên trong.' },
  { q: 'Trong setup store, ref, computed và function thành gì?', a: 'ref là state, computed là getter, function là action. Phải return mọi state thì Pinia mới coi đó là state.' },
  { q: 'const { count } = store rồi increment(). Template đọc count thấy gì?', a: 'Số cũ. Store là reactive, destructure là mang số ra khỏi Proxy. Dùng store.count hoặc storeToRefs.' },
  { q: 'storeToRefs lấy những gì?', a: 'State và getter, thành ref. Action bị bỏ qua. Action destructure thẳng từ store vẫn gọi được vì đã bind vào store.' },
]

const SERVER_STATE_CARDS: Flashcard[] = [
  { q: 'loading, error, data của một user nên ở đâu?', a: 'Trong useUser(id), cạnh request. Đó là cache của lần fetch, không phải client state kiểu giỏ hàng.' },
  { q: 'Đổi id khi request cũ chưa về thì làm gì?', a: 'Abort request trước, trong onCleanup của watch. Bài 2 đã dùng watch và AbortController. Nếu không abort, response chậm về sau ghi đè user mới.' },
  { q: 'Vì sao không cất list từ API trong Pinia cho xong?', a: 'Store không biết cache đã cũ, và loading/error dễ bị request khác ghi đè. Invalidate là việc của cache, không phải của giỏ hàng.' },
  { q: 'Khi nào mới cần query library?', a: 'Khi nhiều màn cùng một request, cần dedupe, retry và invalidate. Bài tổng quan nhắc TanStack Query. Bài này chưa cài package nào.' },
]

const VUE_ROUTER_CARDS: Flashcard[] = [
  { q: 'Từ /users/1 sang /users/2, component có bị tạo lại không?', a: 'Không. Cùng route record thì Vue Router giữ instance. onMounted không chạy lại. Theo id bằng watch(() => route.params.id) hoặc onBeforeRouteUpdate.' },
  { q: 'watch(route.params.id, load) sai ở đâu?', a: 'route.params.id lúc đó là string, không phải nguồn reactive. Truyền getter: watch(() => route.params.id, load).' },
  { q: 'Gán route.params.id = "9" có đổi URL không?', a: 'Không. Params không phải chỗ để ghi. Đổi URL bằng router.push hoặc router.replace.' },
  { q: 'beforeEnter thấy gì?', a: 'to và from, cộng thứ bạn đọc được từ store. Component của route chưa được tạo, async component chưa resolve. Redirect thì chunk của trang không tải.' },
]

const PROJECT_ARCHITECTURE_CARDS: Flashcard[] = [
  { q: 'Feature-Sliced Design xếp theo cái gì?', a: 'Theo hướng phụ thuộc, không theo loại file. Một SFC, composable hay store nằm cùng việc nghiệp vụ nó làm. Bài tổng quan nói rõ điều này.' },
  { q: 'Giỏ chỉ một trang dùng thì để ở đâu?', a: 'Trong pages/cart. Tách widget hay feature khi có người dùng thứ hai, ví dụ header cũng cần khối giỏ.' },
  { q: 'features/add-to-cart được import ai?', a: 'entities và shared. Không import pages, widgets, hay feature khác cùng tầng. Phối hợp hai feature ở widget hoặc page.' },
  { q: 'Pinia cài ở đâu, store viết ở đâu?', a: 'createPinia nằm ở app. Định nghĩa store nằm ở model của feature hoặc entity đang sở hữu state đó.' },
]

const TESTING_CARDS: Flashcard[] = [
  { q: 'mount(Counter, { props }) rồi bấm tăng. Số trên màn hình có thành 3 không?', a: 'Chưa. Con emit update:modelValue với [3]. Test phải setProps({ modelValue: 3 }) nếu muốn text đổi. emitted() mới là chỗ thấy 3 ngay.' },
  { q: 'wrapper.get và wrapper.find khác nhau thế nào?', a: 'get ném lỗi khi không có đúng một node. find trả null nếu không thấy. Dùng get khi thiếu phần tử là lỗi của test.' },
  { q: 'Testing Library khác Vue Test Utils ở đâu?', a: 'Testing Library tìm theo vai trò người dùng (getByRole) và né chi tiết emitted. VTU nhìn thẳng props, text và emitted. Cả hai chạy bằng Vitest.' },
  { q: 'Vì sao bài này không thêm file spec vào repo?', a: 'apps/blog đã có Vitest, nhưng chưa có @vue/test-utils. Test nằm trong bài để đọc và copy, không cài package mới.' },
]

const PERFORMANCE_CARDS: Flashcard[] = [
  { q: ':key="index" khi đảo list thì input đi theo ai?', a: 'Theo vị trí. Vue vá node tại chỗ, nên chữ trong ô dính ở index cũ. :key="item.id" thì chữ đi theo món. React cũng vậy.' },
  { q: 'KeepAlive giữ state khi nào?', a: 'Khi component động bị chuyển đi: onDeactivated, rồi onActivated lúc quay lại. v-if đặt lên chính KeepAlive thì cả cache unmount.' },
  { q: 'v-memo="[selected]" mà name đổi. DOM có đổi tên không?', a: 'Không, cho tới khi selected đổi hoặc bạn thêm name vào mảng. Mảng rỗng thì giống v-once. Đừng dùng nếu bạn không kể hết deps.' },
  { q: 'shallowRef ở đây để làm gì?', a: 'List lớn bất biến: gán cả mảng mới, không Proxy sâu từng dòng. Bài 6 đã dạy cơ chế. v-memo không giảm chi phí đó.' },
]

export const FLASHCARDS = {
  'vue-fundamentals': VUE_FUNDAMENTALS_CARDS,
  'reactive-state': REACTIVE_STATE_CARDS,
  'template-and-lifecycle': TEMPLATE_LIFECYCLE_CARDS,
  'component-contracts': COMPONENT_CONTRACTS_CARDS,
  'slots-and-attrs': SLOTS_ATTRS_CARDS,
  'reactivity-deep-dive': REACTIVITY_DEEP_DIVE_CARDS,
  'tick-and-scope': TICK_AND_SCOPE_CARDS,
  composables: COMPOSABLES_CARDS,
  'provide-inject': PROVIDE_INJECT_CARDS,
  pinia: PINIA_CARDS,
  'server-state': SERVER_STATE_CARDS,
  'vue-router': VUE_ROUTER_CARDS,
  'project-architecture': PROJECT_ARCHITECTURE_CARDS,
  testing: TESTING_CARDS,
  performance: PERFORMANCE_CARDS,
} satisfies Record<string, Flashcard[]>

export type ReviewId = keyof typeof MEMORY_MAPS & keyof typeof FLASHCARDS
