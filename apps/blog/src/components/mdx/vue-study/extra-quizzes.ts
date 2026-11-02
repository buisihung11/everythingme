import type { QuizQuestion } from './quizzes'

const composables: QuizQuestion[] = [
  {
    q: 'PanelA và PanelB mỗi nơi gọi useToggle() một lần. Bật PanelA. PanelB thế nào?',
    options: [
      'Vẫn off. Mỗi lần gọi là một ref riêng',
      'Bật theo, vì composable là singleton',
      'Bật theo, nếu hai panel cùng file',
      'Lỗi: không được gọi useToggle hai lần',
    ],
    answer: 0,
    why: 'Composable giống custom hook có state bên trong: mỗi lần gọi tạo ref mới. Muốn một bản dùng chung thì đó là việc của store hoặc provide/inject, không phải của useToggle.',
    review: { label: 'useToggle', href: '#use-toggle' },
  },
  {
    q: 'Đoạn sau, template đọc value. Sau toggle(), template hiện gì?',
    code: ['const on = useToggle() // Ref', 'const { value } = on', 'on.value = true'],
    options: ['false', 'true', 'undefined', 'Một object Ref'],
    answer: 0,
    why: 'Destructure value lấy boolean ra khỏi ref tại đúng dòng đó. Gán on.value sửa hộp, value không đi theo. Giữ nguyên ref: const { on, toggle } = useToggle() khi on là ref.',
    review: { label: 'useToggle', href: '#use-toggle' },
  },
  {
    q: 'useFetch nhận một ref url. Viết nào fetch lại khi url.value đổi?',
    options: [
      'watch(() => toValue(url), fetchNow)',
      'const href = toValue(url); fetch(href)',
      'fetch(url) và để Vue tự mở ref',
      'computed(() => fetch(toValue(url)))',
    ],
    answer: 0,
    why: 'toValue gọi một lần ngoài watch chỉ là snapshot. Gọi bên trong getter của watch thì ref hoặc getter được ghi sổ. computed không phải chỗ gọi fetch.',
    review: { label: 'toValue', href: '#to-value' },
  },
  {
    q: 'Chỗ gọi nào đăng ký được watcher vào túi của component?',
    options: [
      'Top-level của script setup, gọi đồng bộ',
      'Trong hàm gắn vào @click',
      'Sau await, trong một hàm thường',
      'Trong if (ready) khi ready đang false lúc setup',
    ],
    answer: 0,
    why: 'Vue chỉ có active instance trong setup đồng bộ. script setup là chỗ duy nhất được gọi composable sau await. Nhánh if không chạy ở lần setup duy nhất thì composable đó không bao giờ chạy.',
    review: { label: 'Chỗ gọi', href: '#call-site' },
  },
  {
    q: 'onScopeDispose trong useFetch chạy khi nào?',
    options: [
      'Khi component unmount, hoặc khi effectScope chứa nó stop()',
      'Mỗi lần url đổi',
      'Chỉ khi fetch lỗi',
      'Khi người dùng bấm nút',
    ],
    answer: 0,
    why: 'Bài 7: onScopeDispose gắn vào túi hiện tại. Trong component thì túi dừng lúc unmount. Abort request đang bay thì đặt ở đây, và đặt thêm trong onCleanup của watch khi url đổi.',
    review: { label: 'Chỗ gọi', href: '#call-site' },
  },
]

const provideInject: QuizQuestion[] = [
  {
    q: 'App provide theme. Layout không khai báo prop theme. Button inject. Button đọc được không?',
    options: [
      'Được, nếu Button nằm trong cây con của App',
      'Không, Layout phải nhận rồi truyền tiếp',
      'Chỉ được khi key là string "theme"',
      'Chỉ được với Pinia',
    ],
    answer: 0,
    why: 'provide/inject bỏ qua tầng giữa, giống context của React. Layout không cần biết theme.',
    review: { label: 'Cây theme', href: '#theme-tree' },
  },
  {
    q: 'App và Sidebar cùng provide("theme", …). Button inject("theme") nhận giá trị của ai?',
    options: [
      'Sidebar, vì là cha gần Button nhất',
      'App, vì provide trước',
      'Cả hai, gộp thành mảng',
      'undefined, vì key bị trùng là lỗi',
    ],
    answer: 0,
    why: 'Cùng key thì cha gần nhất thắng. InjectionKey là Symbol nên key của Sidebar không đụng themeKey của App.',
    review: { label: 'InjectionKey', href: '#injection-key' },
  },
  {
    q: 'provide(themeKey, readonly(theme)). Consumer gán theme.value = "dark". Chuyện gì xảy ra?',
    options: [
      'Dev cảnh báo, giá trị không đổi. Provider vẫn sửa ref gốc được',
      'Consumer sửa được và App cập nhật theo',
      'readonly chỉ chặn TypeScript, runtime vẫn ghi',
      'inject trả về undefined',
    ],
    answer: 0,
    why: 'readonly giữ liên kết đọc: provider đổi thì consumer cập nhật, nhưng chiều ghi từ consumer bị chặn. Chỗ mutate nằm cạnh ref gốc.',
    review: { label: 'InjectionKey', href: '#injection-key' },
  },
  {
    q: 'provide("theme", { mode: "light" }) rồi provider gán theme.mode = "dark". Button có render lại không?',
    options: [
      'Không. Object thường không tạo liên kết reactive',
      'Có, mọi giá trị provide đều reactive',
      'Có, vì Button giữ cùng object',
      'Chỉ khi Button dùng watchEffect',
    ],
    answer: 0,
    why: 'Mutate object thường không trigger. Button không render lại, nên template vẫn thấy mode cũ. Provide một ref thì inject nhận đúng ref đó, không tự unwrap.',
    review: { label: 'InjectionKey', href: '#injection-key' },
  },
  {
    q: 'inject(themeKey) đặt trong handler @click. Kết quả?',
    options: [
      'Cảnh báo: không có active instance. inject gọi trong setup',
      'Vẫn lấy được giá trị, inject dùng mọi nơi',
      'Chỉ sai khi key là Symbol',
      'Trả về giá trị mặc định, im lặng',
    ],
    answer: 0,
    why: 'inject và provide phải chạy đồng bộ trong setup, cùng luật với composable. Lấy giá trị một lần trong setup, rồi handler dùng biến đó.',
    review: { label: 'InjectionKey', href: '#injection-key' },
  },
]

const pinia: QuizQuestion[] = [
  {
    q: 'Header và trang checkout cùng cần giỏ hàng. Chọn gì?',
    options: [
      'useCartStore() của Pinia',
      'useCart() composable, mỗi nơi gọi một lần',
      'provide ở từng trang',
      'Một reactive() export từ file, import thẳng',
    ],
    answer: 0,
    why: 'Hai cây không có cha chung tiện để provide. Store là singleton: gọi ở đâu cũng cùng một bản, giống store của Zustand. Composable thì mỗi lần gọi một giỏ.',
    review: { label: 'Khi nào dùng store', href: '#when-store' },
  },
  {
    q: 'Setup store return { items, total, add }. total là computed, add là function. Pinia coi chúng là gì?',
    options: [
      'items là state, total là getter, add là action',
      'Cả ba đều là action',
      'total là state, add là getter',
      'Chỉ option store mới có getter',
    ],
    answer: 0,
    why: 'Trong setup store: ref thành state, computed thành getter, function thành action. Phải return hết state thì devtools và plugin mới thấy.',
    review: { label: 'Setup store', href: '#cart-store' },
  },
  {
    q: 'count đang là 0. Đoạn sau chạy xong, template {{ count }} hiện gì?',
    code: ['const { count } = store', 'store.increment()'],
    options: ['0', '1', 'undefined', 'NaN'],
    answer: 0,
    why: 'Store là reactive. Destructure lấy số 0 ra ngoài. increment sửa store, biến count không đi theo. Đây là cùng bẫy với reactive ở Bài 2.',
    review: { label: 'storeToRefs', href: '#store-to-refs' },
  },
  {
    q: 'storeToRefs(store) chứa những gì?',
    options: [
      'State và getter dưới dạng ref. Không có action',
      'Mọi thứ, kể cả action',
      'Chỉ action',
      'Một bản copy JSON, không reactive',
    ],
    answer: 0,
    why: 'storeToRefs bỏ qua function. Action destructure thẳng từ store: const { add } = store vẫn gọi đúng, vì action đã được bind.',
    review: { label: 'storeToRefs', href: '#store-to-refs' },
  },
  {
    q: 'Modal chỉ một trang mở. Có nên đưa open vào Pinia không?',
    options: [
      'Không. Một ref trong trang là đủ',
      'Có, mọi boolean đều nên vào store',
      'Có, nếu không Pinia báo lỗi',
      'Chỉ khi dùng option store',
    ],
    answer: 0,
    why: 'Store đáng khi nhiều nơi phải cùng một bản. State chết cùng một màn thì để local. Nhét hết vào store là thêm chỗ phải nhớ reset.',
    review: { label: 'Khi nào dùng store', href: '#when-store' },
  },
]

const serverState: QuizQuestion[] = [
  {
    q: 'GET /users/:id cần loading, error và data. Để ở đâu?',
    options: [
      'Trong useUser(id), cạnh request',
      'Trong cart store, thêm ba field',
      'Trong provide của App',
      'Trong route.params',
    ],
    answer: 0,
    why: 'Ba ô đó là trạng thái của một request, không phải client state. Giỏ hàng thì mới là việc của Pinia.',
    review: { label: 'useUser', href: '#use-user' },
  },
  {
    q: 'Bấm Bảo (chậm) rồi An (nhanh). useUser abort request cũ. Màn hình còn ai?',
    options: [
      'An. Response của Bảo bị bỏ',
      'Bảo, vì bấm trước nên về sau và thắng',
      'Cả hai tên ghép lại',
      'Trống, vì abort xóa luôn An',
    ],
    answer: 0,
    why: 'onCleanup của watch abort controller cũ khi id đổi. Response muộn không được ghi vào data. Tắt abort thì request chậm về sau ghi đè người mới.',
    review: { label: 'useUser', href: '#use-user' },
  },
  {
    q: 'List user vừa fetch được cất vào Pinia, không có bước invalidate. Bug nào đúng?',
    options: [
      'Màn khác vẫn đọc list cũ, và loading của request sau dễ đè request trước',
      'Pinia làm list mất reactive',
      'Vue cấm để array trong store',
      'storeToRefs không đọc được array',
    ],
    answer: 0,
    why: 'Store không biết response đã cũ. loading/error để chung một chỗ thì hai màn fetch hai id sẽ giẫm nhau. Cache thuộc về request.',
    review: { label: 'Không phải store', href: '#wrong-home' },
  },
  {
    q: 'Ô search chỉ có trên trang danh sách. Nhà đúng của chuỗi đó?',
    options: ['ref trong trang', 'useUser', 'Pinia', 'beforeEnter'],
    answer: 0,
    why: 'Không ai ngoài trang cần chuỗi này. Đưa vào store là một field nữa phải reset khi rời trang.',
    review: { label: 'Không phải store', href: '#wrong-home' },
  },
  {
    q: 'AbortController của useUser nên được abort ở đâu khi id đổi?',
    options: [
      'onCleanup của watch(id, …)',
      'Trong một computed',
      'Trong template',
      'Chỉ trong onUnmounted, không cần khi id đổi',
    ],
    answer: 0,
    why: 'Bài 2: onCleanup chạy trước lần watch kế tiếp và khi watcher dừng. onScopeDispose lo lúc unmount nếu bạn giữ controller ngoài watch. Chỉ onUnmounted thì request cũ vẫn về khi id đã đổi.',
    review: { label: 'useUser', href: '#use-user' },
  },
]

const vueRouter: QuizQuestion[] = [
  {
    q: 'Đang ở /users/1, chuyển sang /users/2. UserPage thế nào?',
    options: [
      'Giữ instance. onMounted không chạy lại',
      'Unmount rồi mount lại',
      'setup chạy lại từ đầu',
      'beforeEnter của route này chạy lại',
    ],
    answer: 0,
    why: 'Cùng một route record thì Vue Router tái sử dụng component. beforeEnter cũng không chạy lại khi chỉ params đổi. Theo id bằng getter hoặc onBeforeRouteUpdate.',
    review: { label: 'Params', href: '#params' },
  },
  {
    q: 'Watcher nào chạy khi id trên URL đổi?',
    options: [
      'watch(() => route.params.id, load)',
      'watch(route.params.id, load)',
      'watch("route.params.id", load)',
      'watch(route.params.id.value, load)',
    ],
    answer: 0,
    why: 'route.params.id là string tại thời điểm gọi watch. Getter đọc route trong effect nên được ghi sổ. Cùng hình với watch(() => props.id) ở Bài 6.',
    review: { label: 'Params', href: '#params' },
  },
  {
    q: 'Trong setup, chạy route.params.id = "9". URL thế nào?',
    options: [
      'Vẫn URL cũ. Muốn đổi thì router.push',
      'Thành /users/9',
      'beforeEnter chạy với id 9',
      'Component remount với id 9',
    ],
    answer: 0,
    why: 'Route location không phải chỗ ghi. Gán property không điều hướng. router.push({ name: "user", params: { id: "9" } }) mới đổi URL.',
    review: { label: 'Params', href: '#params' },
  },
  {
    q: 'Khách bấm /orders. beforeEnter chạy. Nó đọc được gì?',
    options: [
      'to, from, và auth store. Không có ref của Orders',
      'this của OrdersPage',
      'DOM đã render của Orders',
      'props mà Orders khai báo',
    ],
    answer: 0,
    why: 'beforeEnter nằm trên cấu hình route và chạy trước khi async component được resolve. Chưa có instance. Redirect thì chunk của trang cũng chưa tải.',
    review: { label: 'beforeEnter', href: '#before-enter' },
  },
  {
    q: 'Route lazy: component: () => import("./Orders.vue"). Chunk tải khi nào nếu guard redirect?',
    options: [
      'Không tải. Guard chạy trước bước resolve async component',
      'Tải trước mọi guard',
      'Tải lúc build vào bundle chính',
      'Tải khi khai báo routes, lúc app khởi động',
    ],
    answer: 0,
    why: 'Thứ tự navigation: beforeEnter, rồi mới resolve async component. return { name: "Login" } thì import() của Orders không chạy.',
    review: { label: 'beforeEnter', href: '#before-enter' },
  },
]

const projectArchitecture: QuizQuestion[] = [
  {
    q: 'Nút "Thêm vào giỏ" dùng ở nhiều màn. File của nó nằm ở đâu?',
    options: [
      'features/add-to-cart/ui/AddButton.vue',
      'shared/ui/AddButton.vue',
      'entities/product/ui/AddButton.vue',
      'app/AddButton.vue',
    ],
    answer: 0,
    why: 'Đó là một hành động. shared không biết giỏ là gì. Entity product chỉ là danh từ. Feature giữ UI và model của hành động.',
    review: { label: 'Cây cart', href: '#cart-tree' },
  },
  {
    q: 'Giỏ mới chỉ trang /cart dùng. Làm gì hôm nay?',
    options: [
      'Để trong pages/cart. Tách ra khi header cũng cần',
      'Tạo đủ pages, widgets, features, entities ngay',
      'Đặt store vào shared/ui',
      'Đặt mọi thứ vào app/',
    ],
    answer: 0,
    why: 'Bài tổng quan: một việc chỉ một màn thì ở lại page. Tách entity khi contract được dùng lại, tách feature khi cùng một hành động xuất hiện ở nhiều màn.',
    review: { label: 'Cây cart', href: '#cart-tree' },
  },
  {
    q: 'features/add-to-cart import features/remove-line. Được không?',
    options: [
      'Không. Hai slice cùng tầng. Phối hợp ở widget hoặc page',
      'Được, vì cùng là feature',
      'Được nếu import qua index.ts',
      'Chỉ cấm khi import shared',
    ],
    answer: 0,
    why: 'Cùng tầng thì không trỏ nhau, giống complete-task không import delete-task trong bài tổng quan. Page hoặc widget phía trên ghép hai feature.',
    review: { label: 'Chiều import', href: '#import-rule' },
  },
  {
    q: 'entities/product import AddButton từ features/add-to-cart. Được không?',
    options: [
      'Không. Entity không được biết feature',
      'Được, vì thẻ sản phẩm cần nút mua',
      'Được nếu đặt nút trong slot',
      'Được ở file test',
    ],
    answer: 0,
    why: 'Mũi tên chỉ đi xuống. Widget hoặc page ghép ProductCard với AddButton, thường qua slot, đúng như TaskCard và CompleteTaskButton trong bài tổng quan.',
    review: { label: 'Chiều import', href: '#import-rule' },
  },
  {
    q: 'createPinia() và useCartStore() mỗi thứ nằm ở đâu?',
    options: [
      'createPinia ở app. useCartStore ở model của slice sở hữu giỏ',
      'Cả hai ở shared/ui',
      'Cả hai ở pages/cart',
      'createPinia trong từng component',
    ],
    answer: 0,
    why: 'App nối dây. Định nghĩa store đi với feature hoặc entity chủ. FSD không quyết định vòng đời state: local ref, provide, store vẫn là quyết định riêng.',
    review: { label: 'Cây cart', href: '#cart-tree' },
  },
]

const testing: QuizQuestion[] = [
  {
    q: 'Test mount Counter với modelValue: 2, rồi trigger nút tăng. Câu nào đúng?',
    options: [
      'emitted("update:modelValue")[0] là [3], text vẫn có "2"',
      'text() đổi thành "3" ngay',
      'props().modelValue tự thành 3',
      'emitted("reset") có một lần gọi',
    ],
    answer: 0,
    why: 'defineModel emit update:modelValue. mount không giữ v-model hộ cha. Muốn chữ trên màn hình thành 3 thì await wrapper.setProps({ modelValue: 3 }).',
    review: { label: 'Đọc test', href: '#read-test' },
  },
  {
    q: 'Muốn chắc người dùng đọc được chữ "Điểm". Gọi gì?',
    options: [
      'expect(wrapper.text()).toContain("Điểm")',
      'expect(wrapper.emitted("label"))',
      'expect(wrapper.props()).toBe("Điểm")',
      'expect(mount(Counter)).toBe("Điểm")',
    ],
    answer: 0,
    why: 'text() là những gì hiện trên màn hình. props() đọc prop label, chưa chắc chữ đó được render. Testing Library làm cùng việc này qua getByRole hoặc getByText.',
    review: { label: 'Assertion', href: '#assertion' },
  },
  {
    q: 'wrapper.get("[data-testid=inc]") khi không có node đó thì sao?',
    options: [
      'Ném lỗi. Test dừng',
      'Trả null, test tiếp tục',
      'Trả mảng rỗng',
      'Tự mount lại component',
    ],
    answer: 0,
    why: 'get yêu cầu đúng một node. find trả null nếu không thấy. Dùng get khi "không có nút" chính là thất bại.',
    review: { label: 'Assertion', href: '#assertion' },
  },
  {
    q: 'TagInput max = 1, người dùng nhập tag thứ hai. Assertion nào khớp hợp đồng Bài 5?',
    options: [
      'emitted("limit") có ít nhất một lần',
      'text() chứa cả hai tag',
      'props().max thành 2',
      'component throw',
    ],
    answer: 0,
    why: 'Quá max thì emit limit, không thêm tag. emitted là đúng cửa vì limit là hợp đồng, không phải chữ trên màn hình.',
    review: { label: 'Assertion', href: '#assertion' },
  },
  {
    q: 'Testing Library và Vue Test Utils khác nhau ở điểm nào?',
    options: [
      'Testing Library tìm theo vai trò người dùng. VTU có sẵn emitted và props',
      'Testing Library không chạy trên Vitest',
      'VTU không mount được SFC',
      'Hai package là một',
    ],
    answer: 0,
    why: 'Cùng một runner, Vitest. Khác chỗ nhìn: người dùng thấy gì, hay hợp đồng props/emits của component. Bài này dùng mô hình VTU vì Counter và TagInput được định nghĩa bằng hợp đồng đó.',
    review: { label: 'Đọc test', href: '#read-test' },
  },
]

const performance: QuizQuestion[] = [
  {
    q: 'Ba dòng, mỗi dòng một input. Đảo thứ tự list. Chữ trong ô phải đi theo món. Chọn gì?',
    options: [
      ':key="item.id"',
      ':key="index"',
      'Bỏ key',
      'v-memo="[]"',
    ],
    answer: 0,
    why: 'v-for vá tại chỗ nếu không có key ổn định. index giữ input ở vị trí cũ. id bắt Vue chuyển đúng node. React dùng key theo cùng lý do.',
    review: { label: 'Chọn công cụ', href: '#pick-tool' },
  },
  {
    q: 'Editor bọc trong KeepAlive, nhưng v-if đặt trên chính KeepAlive. Tắt rồi bật. Bản nháp?',
    options: [
      'Mất. KeepAlive unmount thì cache mất theo',
      'Còn, vì trong file có chữ KeepAlive',
      'Còn, v-if luôn giữ state',
      'Chỉ mất ở production',
    ],
    answer: 0,
    why: 'Cache sống cùng instance của KeepAlive. v-if làm KeepAlive unmount là hủy tủ. v-if phải nằm ở component bên trong, hoặc dùng component :is.',
    review: { label: 'KeepAlive', href: '#keep-alive' },
  },
  {
    q: 'Một dòng có v-memo="[selected]". name đổi, selected không đổi. DOM hiện tên nào?',
    options: [
      'Tên cũ, cho tới khi selected đổi hoặc name được thêm vào deps',
      'Tên mới ngay',
      'Chuỗi rỗng',
      'Lỗi biên dịch',
    ],
    answer: 0,
    why: 'Vue bỏ qua cả khúc template khi mọi phần tử trong mảng deps không đổi. Thiếu name là bỏ sót một lần cập nhật. Mảng rỗng thì giống v-once.',
    review: { label: 'v-memo', href: '#v-memo' },
  },
  {
    q: 'API trả 5.000 dòng, mỗi lần một mảng mới, không sửa từng phần tử. Công cụ nào đúng?',
    options: [
      'shallowRef, rồi gán cả mảng mới',
      'reactive() sâu cho từng dòng',
      'v-memo="[]" trên cả list',
      'KeepAlive quanh từng dòng',
    ],
    answer: 0,
    why: 'Chi phí ở đây là Proxy sâu, Bài 6. shallowRef chỉ canh .value. Gán list.value = rows là đủ. v-memo không bỏ được proxy.',
    review: { label: 'Chọn công cụ', href: '#pick-tool' },
  },
  {
    q: 'So với React.memo, Vue thường cần gì cho component con?',
    options: [
      'Không cần lớp memo: con không render lại nếu props của nó không đổi',
      'Bọc mọi con bằng một directive tương đương React.memo',
      'v-once trên mọi con',
      ':key là memo',
    ],
    answer: 0,
    why: 'Cha render không kéo con render theo. v-memo là việc khác: cha đang render và bạn muốn bỏ qua một khúc template của chính cha, khi kể được deps.',
    review: { label: 'v-memo', href: '#v-memo' },
  },
]

export const EXTRA_QUIZZES = {
  composables,
  'provide-inject': provideInject,
  pinia,
  'server-state': serverState,
  'vue-router': vueRouter,
  'project-architecture': projectArchitecture,
  testing,
  performance,
} satisfies Record<string, QuizQuestion[]>
