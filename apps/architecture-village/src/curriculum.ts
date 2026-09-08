import type { Curriculum, Encounter, EncounterNode, LearningModule, LessonSection, Metrics, QuizQuestion, Village } from './types';

// Public references reviewed 2026-09-08. Explanations, exercises and fictional
// workloads are original Hearth teaching material, not translated source quizzes.
const root = 'https://www.hellointerview.com/learn/system-design/';
const source = (slug: string) => root + slug;
const metricKeys = ['latency', 'availability', 'consistency', 'throughput', 'complexity'] as const;
const metricGuide = 'Giả định mô phỏng: điểm định tính 0–100, không phải ms, QPS hay phần trăm SLA. availability, consistency, throughput càng cao càng tốt; latency, complexity càng thấp càng tốt. Các thay đổi chỉ minh họa đánh đổi trong tình huống này, không phải số đo sản phẩm thực.';
const initial: Metrics = { latency: 45, availability: 60, consistency: 60, throughput: 45, complexity: 35 };
type Outcome = { label: string; feedback: string; effects: Partial<Metrics> };
type Turn = { prompt: string; context: string; tag: string; good: Outcome; bad: Outcome; repair: string };
const outcome = (label: string, feedback: string, effects: Partial<Metrics>): Outcome => ({ label, feedback, effects });
const turn = (prompt: string, context: string, tag: string, good: Outcome, bad: Outcome, repair: string): Turn => ({ prompt, context, tag, good, bad, repair });
function applyEffects(state: Metrics, effects: Partial<Metrics>): Metrics {
  return Object.fromEntries(metricKeys.map(key => [key, Math.max(0, Math.min(100, state[key] + (effects[key] ?? 0)))])) as Metrics;
}
const describeMetrics = (state: Metrics) => metricKeys.map(key => `${key}=${state[key]}`).join(', ');

/** Expand a finite decision tree. Each node has one unambiguous incoming history,
 * so static context can faithfully show accumulated state without engine changes.
 * A recovery repairs all outstanding decisions, but does not erase their score cost.
 */
function encounter(id: string, name: string, kind: Encounter['kind'], intro: string, turns: Turn[], reflectionPrompt: string): Encounter {
  const nodes: EncounterNode[] = [];
  const visit = (depth: number, path: string, state: Metrics, history: string[], repairs: string[]): string => {
    const spec = turns[depth];
    const nodeId = `${id}-${depth + 1}-${path || 'start'}`;
    const recovery = repairs.length > 0;
    const node: EncounterNode = {
      id: nodeId,
      prompt: `Lượt ${depth + 1}/${turns.length}${recovery ? ' · Phục hồi' : ''}: ${spec.prompt}${recovery ? ' Xử lý cả hậu quả còn tồn đọng trước khi tiếp tục.' : ''}`,
      context: `${spec.context}\n${metricGuide}\nTrạng thái hiện tại: ${describeMetrics(state)}.\n${history.length ? `Lịch sử quyết định:\n${history.join('\n')}` : 'Chưa có quyết định trước đó.'}${recovery ? `\nCần phục hồi: ${repairs.join('; ')}. Chi phí đã phát sinh vẫn nằm trong điểm; phục hồi cần thêm công vận hành.` : '\nKhông còn sự cố chưa xử lý từ các lượt trước.'}`,
      choices: [],
    };
    nodes.push(node);
    for (const correct of [true, false]) {
      const selected = correct ? spec.good : spec.bad;
      const effects = { ...selected.effects };
      if (recovery && correct) effects.complexity = (effects.complexity ?? 0) + 2;
      const label = recovery && correct ? `Phục hồi (${repairs.join('; ')}), rồi ${selected.label.charAt(0).toLocaleLowerCase('vi')}${selected.label.slice(1)}` : selected.label;
      const nextState = applyEffects(state, effects);
      const feedback = `${selected.feedback}${recovery ? (correct ? ' Đã xử lý các vấn đề tồn đọng; complexity tăng thêm 2 điểm cho công phục hồi, điểm mất trước đó không được hoàn lại.' : ' Các vấn đề tồn đọng chưa được sửa; rủi ro mới chồng lên lịch sử cũ.') : ''} Điểm sau lựa chọn: ${describeMetrics(nextState)}.${depth === turns.length - 1 ? (correct ? ' Kết thúc: ghi lại đánh đổi và điều kiện cần kiểm chứng.' : ` Kết thúc chưa đạt: đề xuất sửa ${spec.repair}${repairs.length ? `; đồng thời ${repairs.join('; ')}` : ''} trong phần phản tư.`) : ''}`;
      const next = depth === turns.length - 1 ? null : visit(depth + 1, path + (correct ? 'g' : 'b'), nextState,
        [...history, `${depth + 1}. ${label} → ${feedback}`], correct ? [] : [...repairs, spec.repair]);
      node.choices.push({ id: `${nodeId}-${correct ? 'g' : 'b'}`, label, correct, feedback, effects, tags: [spec.tag, ...(recovery ? ['recovery'] : [])], next });
    }
    // Correct options are not always in the first position.
    if ((depth + path.split('b').length) % 2 === 0) node.choices.reverse();
    return nodeId;
  };
  const start = visit(0, '', { ...initial }, [], []);
  return { id, name, kind, intro: `${intro}\n${metricGuide}`, start, nodes, initial: { ...initial }, reflectionPrompt };
}
const section = (title: string, body: string, example: string, takeaway: string): LessonSection => ({ title, body, example, takeaway });
type QuestionSeed = [prompt: string, correct: string, distractor1: string, distractor2: string, distractor3: string, explanation: string, tag: string];
function quiz(moduleId: string, questions: QuestionSeed[]): QuizQuestion[] {
  return questions.map(([prompt, correct, ...rest], index) => {
    const [a, b, c, explanation, tag] = rest;
    const answer = (index + moduleId.length) % 4;
    const options = [a, b, c];
    options.splice(answer, 0, correct);
    return { id: `${moduleId}-q${index + 1}`, prompt, options, answer, explanation, tag };
  });
}

const introModule: LearningModule = {
  id: 'intro', villageId: 'departure', title: 'Ngọn lửa thiết kế', place: 'Bếp chung', spirit: 'Sương mù yêu cầu', icon: '🔥', color: '#df8848', position: [20, 45],
  objectives: ['Biến đề bài mơ hồ thành hành vi kiểm chứng được', 'Nêu giả định và đánh đổi', 'Theo dấu một yêu cầu từ đầu đến cuối'], prerequisites: [], duration: 18,
  source: source('in-a-hurry/introduction'),
  sections: [
    section('Một đề bài có nhiều lời giải', 'Thiết kế hệ thống bắt đầu bằng việc hiểu điều người dùng cần hoàn thành. Một sơ đồ có nhiều dịch vụ vẫn có thể bỏ sót hành vi quan trọng. Hãy mô tả đầu vào, trạng thái thay đổi và điều người dùng nhìn thấy; sau đó hỏi điều gì xảy ra nếu một bước thất bại. Lựa chọn kiến trúc có giá trị khi gắn với một yêu cầu cụ thể và một giới hạn rõ ràng.', 'Giả định: bảng tin của hợp tác xã có 2.000 thành viên. Lan cần đăng tin nghỉ chợ và đọc tin đã đăng. Trước khi chọn hàng đợi, hãy chỉ đường đi từ nút Đăng tới bản ghi bền vững và lần tải trang tiếp theo. Nếu chỉ lưu trong RAM, thông báo biến mất khi máy khởi động lại.', 'Chứng minh một hành vi hoàn chỉnh trước khi thêm thành phần.'),
    section('Hỏi để chốt ranh giới', 'Tách hành vi sản phẩm khỏi phẩm chất vận hành. “Đọc tin” là chức năng; “đọc trong một khoảng thời gian mục tiêu” là ràng buộc. Ghi rõ điều đang giả định và điều còn phải xác nhận. Đừng dùng một tính từ như nhanh để thay cho tiêu chí nghiệm thu. Khi phạm vi tăng, ưu tiên lại cùng người đưa đề thay vì âm thầm nhận mọi tính năng.', 'Giả định bài tập: tin thường có thể trễ 10 giây; tin đóng cổng cần được tác giả thấy ngay sau khi đăng. Ta có thể dành đường đọc riêng cho tác giả. Quy tắc này không suy ra rằng mọi người phải đọc cùng một phiên bản ở mọi thời điểm.', 'Đặt câu hỏi có khả năng thay đổi thiết kế.'),
    section('Giải thích bằng chuỗi nguyên nhân', 'Mỗi quyết định nên nối vấn đề, cơ chế và cái giá phải trả. Khi có thông tin mới, cập nhật lý do thay vì bảo vệ công nghệ đã chọn. Phân biệt một dự đoán với bằng chứng đo đạc: thêm bản sao có thể tăng khả năng phục vụ đọc, nhưng còn phụ thuộc độ trễ sao chép và cách chuyển hướng khi lỗi.', 'Trong buổi diễn tập, Minh nói “thêm cache cho nhanh”. Cách trình bày có ích hơn là: “cùng một thông báo bị đọc lặp lại; giữ bản sao trong 10 giây sẽ giảm số lần đọc kho gốc, đổi lại độc giả có thể thấy tin cũ”. Đội có thể phản biện đúng giả định về độ cũ.', 'Nói được vì sao chọn, khi nào bỏ, và sẽ đo gì.'),
  ],
  quiz: quiz('intro', [
    ['Đề bài chỉ nói “làm bảng tin nhanh”. Câu hỏi nào hữu ích nhất trước khi vẽ?', 'Ai đọc tin nào, và chấp nhận chờ hoặc thấy tin cũ bao lâu?', 'Đội thích dùng màu gì cho database?', 'Có thể dùng cùng lúc ba loại hàng đợi không?', 'Nên đặt tên cụm Kubernetes là gì?', 'Hành vi và giới hạn độ trễ/độ cũ quyết định đường đọc; các lựa chọn triển khai chưa giải quyết sự mơ hồ.', 'requirements'],
    ['Nhóm đã vẽ cache, queue và worker nhưng nút Đăng chưa có nơi lưu bền. Thiếu gì?', 'Một luồng ghi hoàn chỉnh có điểm xác nhận thành công', 'Thêm một lớp CDN trước worker', 'Một thuật toán băm khác cho icon', 'Một vùng triển khai thứ ba trước khi định nghĩa dữ liệu', 'Cần biết dữ liệu được lưu lúc nào và khi nào trả thành công; số thành phần không chứng minh chức năng hoạt động.', 'end-to-end'],
    ['“Người dùng có thể sửa thông báo của mình” thuộc loại yêu cầu nào?', 'Chức năng, kèm quy tắc quyền sở hữu cần làm rõ', 'Chỉ là mục tiêu thông lượng', 'Chỉ là giả định về ổ đĩa', 'Một cam kết độ trễ p99', 'Câu này mô tả hành động và đối tượng được phép tác động, chưa nêu tốc độ hay tải.', 'requirements'],
    ['Người phỏng vấn đổi yêu cầu: tác giả phải đọc ngay tin vừa sửa. Phản ứng tốt nhất?', 'Xem lại đường đọc của tác giả và giải thích ảnh hưởng tới cache', 'Khẳng định cache đã chọn luôn nhất quán', 'Bỏ toàn bộ yêu cầu đọc để giữ sơ đồ', 'Đổi tên Redis thành SQL mà không đổi luồng', 'Thông tin mới làm thay đổi điều kiện đúng của thiết kế; đọc qua nguồn có phiên bản mới là một hướng cần đánh giá.', 'tradeoffs'],
    ['Bằng chứng nào mạnh nhất cho quyết định thêm bản sao đọc?', 'Đo thấy tải đọc làm nghẽn kho gốc và xác nhận dung sai trễ sao chép', 'Sơ đồ của một công ty nổi tiếng có bản sao', 'Số lượng dịch vụ hiện tại là số lẻ', 'Mọi hệ thống nhỏ đều phải có nhiều vùng', 'Số đo xác định nút nghẽn, còn dung sai dữ liệu cũ cho biết tối ưu có phù hợp hành vi hay không.', 'evidence'],
  ]),
  encounter: encounter('intro-fog', 'Sương mù ở bếp chung', 'fog', 'Giả định: bảng tin chợ có 2.000 thành viên, chỉ cần đăng và đọc thông báo; tin thường được phép cũ 10 giây.', [
    turn('Chủ chợ muốn “mọi thứ thật nhanh”. Chốt gì trước?', 'Bạn chưa biết cần tối ưu hành vi nào; buổi thiết kế chỉ còn 20 phút.', 'requirements',
      outcome('Chốt đăng/đọc và dung sai tin cũ với chủ chợ', 'Phạm vi cụ thể giúp bỏ phần việc thừa, giảm complexity.', { complexity: -5 }),
      outcome('Thêm chat, video và gợi ý ngay vào phạm vi', 'Ba luồng ngoài yêu cầu làm complexity tăng, thời gian cho luồng chính giảm.', { complexity: 7, throughput: -2 }), 'thu gọn phạm vi về đăng và đọc'),
    turn('Nút Đăng nên xác nhận ở đâu?', 'Mất điện có thể xảy ra ngay sau phản hồi thành công.', 'durability',
      outcome('Lưu bền thành công rồi trả mã thông báo', 'Đợi kho gốc làm latency tăng nhẹ nhưng giữ trạng thái đã xác nhận.', { consistency: 6, latency: 2 }),
      outcome('Trả thành công sau khi đặt tin vào RAM của tiến trình', 'Khởi động lại có thể mất tin đã báo thành công; consistency suy giảm.', { latency: -2, consistency: -8 }), 'chuyển điểm xác nhận sang sau ghi bền và đối soát tin đã nhận'),
    turn('Tác giả vừa đăng nhưng màn hình chưa thấy tin. Bạn kết luận thế nào?', 'Bản đọc của tác giả có thể đang dùng dữ liệu cũ; đây là buổi thử nghiệm đầu tiên.', 'tradeoffs',
      outcome('Đọc lại từ nguồn vừa ghi cho tác giả và đo độ trễ', 'Đường đọc rõ ràng tăng consistency, đổi lại thêm một nhánh vận hành.', { consistency: 5, complexity: 2 }),
      outcome('Ẩn lỗi bằng thông báo “đã đồng bộ mọi nơi”', 'Thông báo không thay đổi dữ liệu; người dùng vẫn thấy trạng thái mâu thuẫn.', { consistency: -5, complexity: 2 }), 'bỏ cam kết đồng bộ sai và kiểm tra phiên bản trên đường đọc'),
  ], 'Kể lại một yêu cầu bạn đã làm rõ, điểm xác nhận ghi và một đánh đổi còn phải đo.'),
};

const deliveryModule: LearningModule = {
  id: 'delivery', villageId: 'departure', title: 'Con đường trình bày', place: 'Cầu bản thảo', spirit: 'Kẻ kéo dài phạm vi', icon: '🧭', color: '#cf9a50', position: [70, 55],
  objectives: ['Dẫn dắt từ yêu cầu đến thiết kế chạy được', 'Chọn phần đào sâu theo rủi ro', 'Ước lượng khi kết quả đổi quyết định'], prerequisites: ['intro'], duration: 20,
  source: source('in-a-hurry/delivery'),
  sections: [
    section('Đặt cột mốc cho cuộc trao đổi', 'Một trình tự hữu ích là yêu cầu, thực thể, giao diện, thiết kế tổng thể rồi đào sâu. Các bước là điểm tựa để tránh quên việc, không phải nghi thức phải hoàn tất mọi chi tiết. Danh sách thực thể ban đầu giúp mọi người dùng cùng từ vựng; thuộc tính có thể bổ sung khi đường dữ liệu rõ hơn.', 'Giả định: dịch vụ nhận phần ăn có 30 phút thiết kế. Nhóm ghi ba hành vi: xem thực đơn, đặt phần, xem trạng thái. Meal, Order và Customer đủ để mở cuộc trao đổi; trường ghi chú trang trí có thể chờ sau khi biết ai tạo và ai cập nhật Order.', 'Mỗi cột mốc phải giúp quyết định tiếp theo dễ hơn.'),
    section('Nối hợp đồng với dữ liệu', 'Giao diện mô tả khách gửi gì và được hứa điều gì. Với từng hành vi, đi qua nơi kiểm tra quyền, nơi lưu trạng thái và nơi đọc kết quả. Khi toàn bộ luồng đã tồn tại, kiểm tra lỗi ở các ranh giới. Một hộp dịch vụ với mũi tên vào database chưa nói được thao tác nào phải nguyên tử.', 'POST /orders nhận mealId và quantity; người mua được xác định từ phiên đã xác thực. Server kiểm tra số phần còn, tạo đơn và trả orderId. GET /orders/{id} cần kiểm tra quyền sở hữu. Nếu tạo đơn thành công nhưng phản hồi mất, hợp đồng phải cho phép tìm lại kết quả.', 'Một API đáng tin cần lời hứa thành công và cách xử lý thất bại.'),
    section('Dành thời gian cho điều có thể làm hệ thống sai', 'Đào sâu bắt đầu từ ràng buộc chưa được chứng minh. Tính dung lượng hoặc tải khi con số giúp chọn giữa các hướng; tránh phép tính không dẫn tới hành động. Trước khi hết giờ, quay lại yêu cầu và nêu giới hạn của thiết kế cùng phép thử tiếp theo.', 'Giả định: quầy chỉ làm 80 suất/ngày nhưng có đợt đặt đồng thời lúc trưa. Tính tổng dung lượng năm không giải quyết hai người tranh suất cuối. Hãy dành thời gian cho cập nhật tồn nguyên tử; sau đó mới đo lượng request trong phút mở bán để chọn giới hạn tải.', 'Ưu tiên rủi ro phá vỡ lời hứa sản phẩm.'),
  ],
  quiz: quiz('delivery', [
    ['Sau khi chốt ba chức năng đặt phần ăn, bước nào tạo từ vựng chung nhanh nhất?', 'Liệt kê Meal, Order, Customer và quan hệ chính', 'Chọn mọi trường audit cho mười năm tới', 'So sánh sáu nhà cung cấp cloud', 'Viết thuật toán nén ảnh món ăn', 'Thực thể cốt lõi tạo nền cho API mà chưa buộc nhóm vào schema đầy đủ.', 'entities'],
    ['Còn tám phút, luồng đặt phần đã chạy nhưng có thể bán quá suất. Nên đào sâu gì?', 'Điều kiện cập nhật tồn và tạo đơn khi có tranh chấp', 'Tên miền dự phòng đẹp hơn', 'Số màu biểu đồ dashboard', 'Tối ưu icon thực đơn trước', 'Bán quá suất vi phạm yêu cầu chính; các chi tiết khác chưa giảm rủi ro này.', 'prioritization'],
    ['Phép tính nào có khả năng thay đổi thiết kế cache?', 'Kích thước tập thực đơn nóng so với ngân sách RAM', 'Số ký tự tên các dịch vụ', 'Tổng số request nhưng không phân biệt thời gian', 'Số cạnh trong sơ đồ kiến trúc', 'Kích thước tập nóng giúp quyết định cache có vừa bộ nhớ và cần phân phối hay không.', 'estimation'],
    ['Thiết kế tổng thể đã đủ khi nào để chuyển sang đào sâu?', 'Mỗi chức năng chính có luồng vào, thay đổi trạng thái và trả kết quả', 'Đã có ít nhất mười hộp trên sơ đồ', 'Đã chốt mọi chỉ mục cho mọi truy vấn tương lai', 'Đã trình bày hết tên công nghệ nhớ được', 'Điểm chuyển hợp lý là khi có một hệ thống cơ sở đáp ứng hành vi, còn ràng buộc sẽ được kiểm tra sâu.', 'end-to-end'],
    ['Chủ quầy yêu cầu thêm hệ thống điểm thưởng giữa buổi. Cách xử lý phù hợp?', 'Xác nhận ưu tiên và ảnh hưởng tới thời gian, đưa vào phạm vi sau nếu chưa thiết yếu', 'Nhận ngay và bỏ qua luồng thanh toán không báo trước', 'Từ chối mọi thông tin mới', 'Âm thầm đổi yêu cầu đặt phần thành điểm thưởng', 'Quản lý phạm vi là thương lượng minh bạch để vẫn hoàn thành phần quan trọng.', 'scope'],
  ]),
  encounter: encounter('delivery-scope', 'Kẻ kéo dài phạm vi', 'scope', 'Giả định: quầy cơm cần xem thực đơn, đặt phần, xem đơn; có 80 suất mỗi ngày và 30 phút thảo luận.', [
    turn('Một đề xuất điểm thưởng xuất hiện. Bạn phân bổ thời gian thế nào?', 'Luồng đặt phần vẫn chưa được vẽ; điểm thưởng chưa phải tiêu chí bàn giao.', 'scope',
      outcome('Ghi điểm thưởng vào phần mở rộng, hoàn tất đặt phần trước', 'Giới hạn phạm vi giảm complexity của bản bàn giao.', { complexity: -5 }),
      outcome('Dành nửa buổi thiết kế đổi điểm trước', 'Thời gian bị tiêu vào chức năng phụ, complexity tăng mà luồng chính còn trống.', { complexity: 6 }), 'đưa điểm thưởng ra khỏi bản bàn giao đầu'),
    turn('Chọn bản thiết kế cơ sở nào?', 'Khách cần đặt phần và tra lại trạng thái đơn của mình.', 'end-to-end',
      outcome('Vẽ POST/GET đơn, kiểm tra chủ đơn và kho lưu bền', 'Luồng ghi và đọc nối được với hợp đồng; consistency tăng.', { consistency: 5, complexity: 2 }),
      outcome('Vẽ queue và worker nhưng chưa định nghĩa ai lưu đơn', 'Không có chủ sở hữu dữ liệu nên phản hồi không có trạng thái đáng tin.', { consistency: -6, complexity: 4 }), 'gán dịch vụ chịu trách nhiệm lưu và trả trạng thái đơn'),
    turn('Chỉ còn một phần ăn, hai khách đặt cùng lúc. Đào sâu đâu?', 'Bài thử cần giữ quy tắc tổng số phần bán không vượt tồn.', 'atomicity',
      outcome('Kiểm tra tồn và trừ phần trong cùng giao dịch tạo đơn', 'Tuần tự hóa tranh chấp bảo vệ consistency, đổi lại latency tăng nhẹ.', { consistency: 7, latency: 2 }),
      outcome('Đọc tồn rồi tạo đơn ở hai bước độc lập', 'Cả hai request có thể thấy một phần; consistency giảm vì bán trùng.', { consistency: -9, throughput: 2 }), 'gộp điều kiện tồn và tạo đơn thành giao dịch nguyên tử'),
  ], 'Trình bày bản thiết kế trong một phút: phạm vi, thực thể, API, luồng dữ liệu và rủi ro được đào sâu.'),
};

const networkingModule: LearningModule = {
  id: 'networking', villageId: 'signals', title: 'Những con đường tín hiệu', place: 'Bến gói tin', spirit: 'Bóng ma kết nối', icon: '📡', color: '#55a7b4', position: [18, 35],
  objectives: ['Phân biệt vận chuyển gói với thành công nghiệp vụ', 'Chọn HTTP, SSE hoặc WebSocket theo hướng dữ liệu', 'Giải thích cân bằng tải và giới hạn retry'], prerequisites: ['delivery'], duration: 24,
  source: source('core-concepts/networking-essentials'),
  sections: [
    section('Từ tên miền đến tiến trình', 'DNS giúp tìm địa chỉ phục vụ tên miền; kết quả có thể được lưu tạm theo TTL. Sau đó kết nối phải đi tới đúng tiến trình, thường qua bộ cân bằng tải. L4 định tuyến theo thông tin kết nối, còn L7 có thể hiểu đường dẫn HTTP. Đường đi này chứa nhiều ranh giới lỗi; thay địa chỉ không đồng nghĩa mọi khách lập tức dùng địa chỉ mới.', 'Giả định: tàu hàng gửi trạng thái tới api.ben.example. Sau khi đổi máy chủ, một số máy trên tàu vẫn dùng bản DNS cũ còn hạn. Duy trì máy cũ chuyển tiếp trong giai đoạn chuyển đổi sẽ tránh cắt kết nối đột ngột; cần đo lượng lưu lượng còn tới địa chỉ cũ.', 'Vẽ cả phân giải tên và định tuyến khi giải thích chuyển máy.'),
    section('Chọn kênh theo cách trao đổi', 'TCP cung cấp luồng byte có thứ tự và truyền lại khi mất gói; UDP không tự bảo đảm giao nhận hay thứ tự. Ở tầng ứng dụng, HTTP phù hợp hỏi–đáp; SSE phù hợp server đẩy cập nhật một chiều tới trình duyệt; WebSocket hỗ trợ trao đổi hai chiều trên kết nối lâu dài. Chọn theo hành vi, không chỉ vì giao thức nghe hiện đại.', 'Giả định: bảng cảng chỉ nhận thông báo tàu tới, mỗi phút vài sự kiện. SSE cộng một HTTP endpoint đọc trạng thái ban đầu là đủ để thảo luận. Nếu thêm điều khiển cần cẩu tương tác liên tục hai chiều, yêu cầu mới khiến WebSocket đáng đánh giá.', 'Hướng và nhịp dữ liệu quyết định kênh giao tiếp.'),
    section('Timeout không nói được giao dịch đã xảy ra chưa', 'Một kết nối tin cậy không bảo đảm ứng dụng chỉ thực hiện tác vụ một lần. Server có thể ghi xong rồi mất phản hồi. Deadline giới hạn thời gian chờ; retry cần số lần tối đa, khoảng lùi và nhận dạng thao tác. Khi nhiều máy cùng retry ngay lập tức, tải phục hồi có thể trở thành đợt quá tải thứ hai.', 'Giả định: tàu gửi yêu cầu nhận chỗ neo nhưng tín hiệu yếu làm mất phản hồi. Gửi lại cùng mã thao tác giúp server tra kết quả cũ. Việc đổi từ TCP sang giao thức khác không tự xử lý hai lần nhận chỗ; quy tắc phải ở tầng nghiệp vụ.', 'Tách tin cậy truyền tải khỏi tính duy nhất của tác vụ.'),
  ],
  quiz: quiz('networking', [
    ['Đổi bản ghi DNS nhưng một số khách vẫn gọi máy cũ. Nguyên nhân hợp lý?', 'Bộ nhớ đệm DNS còn hiệu lực theo TTL', 'TCP bắt buộc ghi nhớ tên miền vĩnh viễn', 'HTTP cấm chuyển máy chủ', 'Cân bằng tải tự nhân bản mọi giao dịch', 'DNS có cache nên chuyển địa chỉ phải tính thời gian khách còn giữ kết quả cũ.', 'dns'],
    ['Bảng cảng trong trình duyệt chỉ cần nhận sự kiện từ server. Kênh nào vừa nhu cầu?', 'SSE cùng HTTP cho thao tác hỏi–đáp', 'UDP thô trong mọi trình duyệt mà không cần lớp hỗ trợ', 'Một WebSocket riêng cho từng ký tự', 'Tải lại toàn bộ trang mỗi 10 mili giây', 'SSE phục vụ luồng server tới client; không cần kênh hai chiều khi chưa có hành vi tương ứng.', 'protocol'],
    ['TCP giao byte đúng thứ tự. Điều gì vẫn chưa được bảo đảm?', 'Yêu cầu đặt chỗ chỉ tạo một giao dịch khi client retry', 'Các byte trong cùng luồng được sắp lại', 'Có cơ chế truyền lại khi mất gói', 'Kết nối có trạng thái', 'Tính duy nhất nghiệp vụ cần idempotency ở ứng dụng; mất phản hồi sau commit vẫn gây retry.', 'retries'],
    ['Cần đưa /images và /orders tới hai nhóm server. Khả năng nào phù hợp?', 'Bộ cân bằng tải L7 đọc đường dẫn HTTP', 'DNS tự đọc body JSON', 'UDP tự phân loại đơn hàng', 'Chỉ dựa vào TTL của cache ảnh', 'Định tuyến theo đường dẫn cần hiểu giao thức ứng dụng, là khả năng của L7.', 'load-balancing'],
    ['Một nghìn client timeout cùng lúc. Chính sách nào giảm tải dồn khi phục hồi?', 'Retry có giới hạn, exponential backoff và jitter', 'Retry vô hạn không chờ', 'Mỗi lần timeout gửi thêm mười bản sao', 'Tắt deadline để tất cả kết nối chờ mãi', 'Khoảng lùi và ngẫu nhiên hóa phân tán retry; giới hạn bảo vệ hệ thống trước lỗi kéo dài.', 'retries'],
  ]),
  encounter: encounter('networking-ghost', 'Bóng ma ngoài bến', 'ghost', 'Giả định: bảng cảng trên trình duyệt cần nhận trạng thái tàu một chiều; Wi-Fi chập chờn.', [
    turn('Chọn kênh cập nhật bảng cảng?', 'Chỉ server phát sự kiện; người dùng không gửi luồng liên tục.', 'protocol',
      outcome('Dùng SSE và tải trạng thái đầu bằng HTTP', 'Một luồng sự kiện giảm polling lặp; latency giảm với ít trạng thái hơn nhiều kênh riêng.', { latency: -4, complexity: 2 }),
      outcome('Cho mỗi ô trên bảng polling toàn bộ danh sách mỗi 100 ms', 'Các lần đọc trùng nhau đẩy tải lên cao, throughput hữu ích giảm.', { throughput: -6, latency: 4 }), 'gom cập nhật thành một luồng SSE cho mỗi bảng'),
    turn('Chuyển sang máy chủ mới như thế nào?', 'Một nhóm tàu vẫn giữ địa chỉ DNS cũ còn TTL.', 'dns',
      outcome('Giữ máy cũ chuyển tiếp trong cửa sổ TTL và theo dõi kết nối', 'Khách giữ cache vẫn được phục vụ, availability tăng với thêm việc vận hành.', { availability: 5, complexity: 2 }),
      outcome('Tắt ngay máy cũ vì DNS đã sửa', 'Khách còn cache gọi địa chỉ không phục vụ; availability giảm.', { availability: -7 }), 'khôi phục đường chuyển tiếp từ địa chỉ cũ trong cửa sổ TTL'),
    turn('Các tàu đồng thời mất phản hồi đặt chỗ neo. Retry ra sao?', 'Một số yêu cầu có thể đã ghi thành công trước khi mất mạng.', 'retries',
      outcome('Giữ mã thao tác, retry giới hạn với backoff và jitter', 'Không nhân đôi tác vụ và phân tán tải phục hồi; consistency và availability tăng.', { consistency: 5, availability: 4, complexity: 2 }),
      outcome('Tạo mã mới và gửi lại liên tục cho tới khi có phản hồi', 'Mã mới khiến chống lặp vô hiệu; tải dồn làm tình trạng kết nối tệ hơn.', { consistency: -7, availability: -5 }), 'tra kết quả bằng mã cũ và giới hạn retry có khoảng lùi'),
  ], 'Phân biệt lỗi DNS, lỗi kết nối và kết quả nghiệp vụ chưa biết; mô tả cách retry cho trường hợp cuối.'),
};

const apiModule: LearningModule = {
  id: 'api', villageId: 'signals', title: 'Lời hứa qua giao diện', place: 'Cổng giao ước', spirit: 'Kẻ giả danh', icon: '🔑', color: '#658dc4', position: [52, 58],
  objectives: ['Thiết kế tài nguyên và lỗi dễ dùng', 'Chặn retry tạo đơn trùng', 'Phân trang và kiểm tra quyền trên tài nguyên'], prerequisites: ['networking'], duration: 25,
  source: source('core-concepts/api-design'),
  sections: [
    section('API là lời hứa nhìn từ bên ngoài', 'REST biểu diễn tài nguyên qua các phương thức HTTP; GraphQL cho khách chọn trường dữ liệu; RPC mô tả lời gọi hành động. Lựa chọn cần hợp với khách sử dụng và chi phí vận hành. Dù dùng kiểu nào, hợp đồng phải nói rõ dữ liệu vào, thành công, lỗi và ai được phép thao tác.', 'Giả định: chợ thủ công có web và ứng dụng cùng tạo đơn. POST /orders nhận listingId, quantity; GET /orders/{id} trả trạng thái. Mã lỗi SOLD_OUT giúp giao diện mời khách chọn món khác, còn timeout yêu cầu tra lại kết quả. Hai lỗi không nên cùng dẫn tới nút “đặt lại với mã mới”.', 'Thiết kế cả hành vi khi lời hứa không thể thực hiện.'),
    section('Retry an toàn cần trạng thái phía server', 'Idempotency key đại diện cho một thao tác logic và được giữ nguyên khi thử lại. Server cần liên kết khóa với người gọi, nội dung yêu cầu và kết quả, đồng thời xử lý hai request trùng đến cùng lúc. Một bảng nhớ kết quả không đủ nếu kiểm tra khóa và tạo đơn là hai bước có thể chạy đua.', 'Giả định: Vy đặt một bình gốm, phản hồi bị mất. Hai request cùng khóa k17 tới hai worker. Ràng buộc duy nhất trên khóa theo người mua và giao dịch tạo đơn cho phép một worker tạo, worker kia đọc kết quả. Cùng khóa nhưng body khác phải bị từ chối để tránh trả một đơn không đúng ý khách.', 'Khóa chống lặp phải có phạm vi và cơ chế ghi nguyên tử.'),
    section('Giới hạn tập kết quả và quyền truy cập', 'Danh sách tăng trưởng cần giới hạn kích thước trang. Cursor theo thứ tự ổn định giúp đi tiếp khi có dữ liệu mới, nhưng không tự tạo ảnh chụp bất biến của cả danh sách. Xác thực cho biết người gọi là ai; phân quyền quyết định họ có được đọc hoặc sửa tài nguyên cụ thể hay không.', 'Giả định: trang đơn sắp theo createdAt rồi id. Khi hai đơn cùng thời gian, id là khóa phân xử để cursor không bỏ sót. Server lấy danh tính từ phiên đã kiểm chứng, sau đó kiểm tra order.buyerId; một orderId khó đoán không thay thế được kiểm tra này.', 'Giới hạn dữ liệu trả về và kiểm tra quyền cho từng tài nguyên.'),
  ],
  quiz: quiz('api', [
    ['POST tạo đơn timeout sau khi server có thể đã commit. Client nên làm gì?', 'Retry cùng idempotency key của thao tác đó', 'Đổi key mỗi lần retry', 'Dùng GET có tác dụng tạo thêm đơn', 'Tin chắc timeout nghĩa là server chưa làm gì', 'Giữ key cho phép nhận lại cùng kết quả thay vì tạo một thao tác logic mới.', 'idempotency'],
    ['Hai worker cùng nhận key chưa tồn tại. Điều gì ngăn tạo hai đơn?', 'Ràng buộc duy nhất và ghi key/kết quả cùng giao dịch nghiệp vụ', 'Chỉ kiểm tra key rồi ghi sau ngoài giao dịch', 'Đặt tên endpoint ở dạng số nhiều', 'Mỗi worker dùng cache riêng không đồng bộ', 'Cần xử lý cạnh tranh nguyên tử; kiểm tra rồi ghi rời rạc có cửa sổ chạy đua.', 'atomicity'],
    ['Khách A gửi buyerId của B trong body. Server nên lấy danh tính từ đâu?', 'Phiên hoặc token đã xác thực rồi kiểm tra quyền tài nguyên', 'Luôn tin buyerId do body gửi', 'Ký tự đầu tiên của orderId', 'Địa chỉ IP làm bằng chứng quyền sở hữu đơn', 'Dữ liệu khách gửi không chứng minh danh tính; vẫn phải kiểm tra quyền trên đơn cụ thể.', 'authorization'],
    ['Danh sách đơn có nhiều createdAt trùng nhau. Cursor nên dựa trên gì?', 'Cặp createdAt và id với thứ tự xác định', 'Chỉ số phần tử đang hiển thị trong DOM', 'Một thời gian không kèm khóa phân xử', 'Số trang nhân với kích thước ảnh', 'Khóa phân xử duy nhất tạo thứ tự ổn định để tiếp tục sau bản ghi cuối.', 'pagination'],
    ['Cùng key nhưng lần retry đổi quantity từ 1 thành 4. Xử lý hợp lý?', 'Báo xung đột nội dung, yêu cầu thao tác mới nếu thực sự muốn đổi', 'Âm thầm tạo thêm ba đơn', 'Trả thành công quantity 4 dù kho chỉ ghi 1', 'Xóa lịch sử key và coi như không có request trước', 'Key định danh một ý định cụ thể; không nên tái sử dụng nó cho body khác.', 'idempotency'],
  ]),
  encounter: encounter('api-mimic', 'Kẻ giả danh ở cổng', 'mimic', 'Giả định: chợ bán đồ độc bản; khách có thể retry sau timeout và chỉ được đọc đơn của mình.', [
    turn('Request chứa buyerId lạ. Xác định chủ đơn thế nào?', 'Người gọi đã có phiên xác thực; body vẫn là dữ liệu không đáng tin.', 'authorization',
      outcome('Lấy người mua từ phiên và kiểm tra quyền trên tài nguyên', 'Đơn gắn đúng chủ; consistency của trạng thái nghiệp vụ tăng.', { consistency: 6, complexity: 1 }),
      outcome('Tin buyerId trong body để giảm một bước xử lý', 'Kẻ giả danh có thể gán đơn sai chủ; consistency nghiệp vụ giảm.', { consistency: -8, latency: -1 }), 'gắn lại danh tính theo phiên và rà soát đơn bị gán sai'),
    turn('Hai bản retry cùng khóa đến hai worker. Thiết kế nào đúng?', 'Bình gốm chỉ có một chiếc; phản hồi lần đầu đã mất.', 'idempotency',
      outcome('Lưu khóa duy nhất, hash body và kết quả cùng giao dịch tạo đơn', 'Một tác vụ chỉ tạo một đơn dù cạnh tranh; cần thêm trạng thái quản lý.', { consistency: 7, complexity: 3 }),
      outcome('Mỗi worker nhớ khóa trong RAM riêng', 'Hai worker đều thấy khóa mới và có thể tạo hai đơn.', { consistency: -8, throughput: 2 }), 'đưa khóa chống lặp vào kho dùng chung với ràng buộc nguyên tử'),
    turn('Trang lịch sử tăng nhanh trong khi đang xem. Trả danh sách ra sao?', 'Các đơn có thể cùng timestamp; ứng dụng chỉ cần đi tiếp, không nhảy tới trang bất kỳ.', 'pagination',
      outcome('Giới hạn 30 đơn, cursor theo createdAt và id, lọc theo chủ đơn', 'Trang hữu hạn giảm latency; thứ tự rõ giúp tiếp tục mà không lệ thuộc offset dịch chuyển.', { latency: -4, throughput: 3, complexity: 1 }),
      outcome('Trả toàn bộ đơn của chợ rồi để client tự lọc', 'Dữ liệu riêng tư bị lộ và payload lớn kéo latency lên.', { latency: 6, consistency: -5, throughput: -4 }), 'lọc quyền phía server và thay toàn bộ danh sách bằng trang hữu hạn'),
  ], 'Viết hợp đồng tạo đơn gồm danh tính, key, xử lý body xung đột và phản hồi khi tồn đã hết.'),
};

const dataModule: LearningModule = {
  id: 'data-modeling', villageId: 'signals', title: 'Hình dáng của dữ liệu', place: 'Xưởng bản ghi', spirit: 'Người đá quan hệ', icon: '🧱', color: '#648f9f', position: [82, 30],
  objectives: ['Bắt đầu từ truy vấn và bất biến', 'Chọn quan hệ hay tài liệu theo ranh giới dữ liệu', 'Phân biệt snapshot nghiệp vụ với dữ liệu sao chép'], prerequisites: ['api'], duration: 25,
  source: source('core-concepts/data-modeling'),
  sections: [
    section('Liệt kê câu hỏi dữ liệu phải trả lời', 'Mô hình dữ liệu phục vụ hành vi đọc và ghi. Ghi ra các truy vấn thường xuyên, kích thước quan hệ và bất biến cần bảo vệ trước khi chọn kho. Một quan hệ một–nhiều không tự quyết định phải nhúng mọi bản ghi con; lượng tăng trưởng và cách cập nhật cũng quan trọng.', 'Giả định: xưởng đèn có Product, Order và OrderLine. Câu hỏi “đơn của khách trong tháng” cần buyerId và thời điểm; “còn bao nhiêu đèn loại A” cần tồn theo sản phẩm. Nhúng toàn bộ đơn nhiều năm vào hồ sơ khách làm một hồ sơ tăng không giới hạn và khó cập nhật độc lập.', 'Thiết kế từ truy vấn, tăng trưởng và quy tắc đúng.'),
    section('Chọn ranh giới giao dịch', 'Kho quan hệ phù hợp khi các liên kết và giao dịch nhiều bản ghi là trung tâm. Tài liệu phù hợp cho nhóm dữ liệu thường được đọc cùng nhau và có ranh giới kích thước hợp lý. Tên SQL hay NoSQL không tự chứng minh khả năng mở rộng hoặc mức nhất quán; cần mô tả chính xác thao tác nào cùng thành công hay cùng thất bại.', 'Giả định: mua hai chiếc đèn phải vừa tạo OrderLine vừa trừ tồn. Nếu trừ tồn rồi tiến trình chết trước khi ghi đơn, xưởng mất phần hàng có thể bán mà khách không có đơn để tra. Giao dịch chứa cả hai bước làm ranh giới thành công có ý nghĩa.', 'Đặt bất biến vào đúng ranh giới nguyên tử.'),
    section('Sao chép có chủ đích', 'Chuẩn hóa giảm nhiều nguồn cần sửa khi một sự thật đổi. Phi chuẩn hóa có thể giảm chi phí đọc nhưng cần xác định nguồn gốc và cách đồng bộ. Có dữ liệu nhìn giống bản sao nhưng thực ra là lịch sử nghiệp vụ: giá tại lúc mua phải độc lập với giá hiện tại của sản phẩm.', 'Giả định: đèn tăng từ 180.000 lên 200.000 đồng. OrderLine lưu unitPriceAtPurchase=180.000 để hóa đơn cũ không đổi; đây là snapshot có chủ đích. Tên sản phẩm hiển thị trên trang tìm kiếm có thể là bản sao được cập nhật qua sự kiện, với dung sai trễ đã thống nhất.', 'Ghi rõ trường nào là sự thật hiện tại, trường nào là lịch sử.'),
  ],
  quiz: quiz('data-modeling', [
    ['Giá sản phẩm đổi hôm nay. Hóa đơn tháng trước nên dùng giá nào?', 'Giá được lưu tại thời điểm mua trong OrderLine', 'Giá hiện tại nối từ Product mỗi lần xem', 'Giá lớn nhất từng tồn tại', 'Giá do client tự gửi lại lúc mở hóa đơn', 'Giá mua là dữ kiện lịch sử; nối giá hiện tại sẽ viết lại ý nghĩa đơn đã hoàn tất.', 'snapshot'],
    ['Tại sao không nhúng mọi đơn nhiều năm vào một hồ sơ khách?', 'Tập con tăng không giới hạn và tạo điểm cập nhật lớn', 'Tài liệu không thể chứa số', 'SQL bắt buộc lưu ảnh trong mọi dòng', 'Quan hệ một–nhiều luôn bị cấm', 'Cần xét kích thước, cạnh tranh cập nhật và cách đọc; nhúng phù hợp hơn với tập con có giới hạn.', 'model-boundary'],
    ['Bất biến “có đơn thì đã trừ tồn tương ứng” cần gì?', 'Tạo đơn và trừ tồn trong cùng giao dịch hoặc giao thức phối hợp rõ ràng', 'Hai lệnh độc lập không có phục hồi', 'Một chỉ mục trên màu sản phẩm', 'Đổi tên Order thành Receipt', 'Ranh giới nguyên tử hoặc cơ chế phối hợp có phục hồi mới bảo vệ quan hệ giữa hai thay đổi.', 'atomicity'],
    ['Danh sách hàng bán chạy lưu tên sản phẩm sao chép. Cần bổ sung gì?', 'Nguồn tên chuẩn, cơ chế cập nhật và dung sai độ cũ', 'Cam kết dữ liệu sao chép không bao giờ cũ tự nhiên', 'Xóa mọi productId khỏi danh sách', 'Cho mỗi bản sao là nguồn chuẩn độc lập', 'Phi chuẩn hóa đổi chi phí đọc lấy trách nhiệm đồng bộ; cần biết ai sở hữu sự thật.', 'denormalization'],
    ['Dữ liệu đơn có quan hệ và giao dịch nhiều dòng. Kết luận nào hợp lý?', 'Kho quan hệ là điểm xuất phát đáng cân nhắc, rồi kiểm chứng tải thực', 'SQL không thể mở rộng trong bất kỳ trường hợp nào', 'Chỉ cần chọn NoSQL là giao dịch luôn nguyên tử', 'Số lượng bảng tự quyết định SLA', 'Chọn theo truy vấn và bất biến; tên nhóm database không thay thế thiết kế hoặc phép đo.', 'storage-choice'],
  ]),
  encounter: encounter('data-golem', 'Người đá giữ sổ', 'golem', 'Giả định: xưởng đèn bán hàng, cần lịch sử hóa đơn không đổi và tồn không âm.', [
    turn('Lưu đơn và sản phẩm thế nào?', 'Giá sản phẩm có thể đổi sau khi giao hàng; cần giữ hóa đơn cũ.', 'snapshot',
      outcome('Tách Product, Order, OrderLine và lưu giá mua trên dòng đơn', 'Lịch sử không bị giá hiện tại viết lại; consistency tăng.', { consistency: 6, complexity: 2 }),
      outcome('Chỉ lưu productId rồi luôn nối giá hiện tại lên hóa đơn', 'Hóa đơn cũ thay đổi khi bảng giá cập nhật, làm lịch sử mâu thuẫn.', { consistency: -7, complexity: -2 }), 'bổ sung snapshot giá mua và đối soát hóa đơn đã bị đổi'),
    turn('Một đơn cần hai chiếc nhưng tồn vừa đủ hai. Ghi thế nào?', 'Nhiều khách có thể cùng mua trong một giây.', 'atomicity',
      outcome('Trừ tồn có điều kiện cùng giao dịch tạo các dòng đơn', 'Tranh chấp được quyết định tại kho chuẩn; consistency tăng với latency nhỏ.', { consistency: 7, latency: 2 }),
      outcome('Tạo đơn trước, cuối ngày mới kiểm tra tồn', 'Đơn có thể vượt số hàng thật; phản hồi thành công không bảo đảm giao được.', { consistency: -8, latency: -2 }), 'chặn tồn âm ở giao dịch tạo đơn và xử lý các đơn vượt tồn'),
    turn('Trang hàng bán chạy cần tên để đọc nhanh. Quản lý bản sao thế nào?', 'Tên đổi không cần xuất hiện tức thì ở danh sách, nhưng phải cập nhật lại được.', 'denormalization',
      outcome('Giữ productId, cập nhật tên từ nguồn chuẩn bằng sự kiện có phiên bản', 'Giảm lookup đọc với đường sửa bản sao rõ ràng; complexity tăng có chủ đích.', { latency: -4, throughput: 3, complexity: 3 }),
      outcome('Cho mỗi danh sách tự sửa tên và bỏ liên kết nguồn', 'Nhiều nguồn sự thật không có đường đối soát, consistency giảm.', { consistency: -6, complexity: 5 }), 'khôi phục liên kết productId và nguồn tên chuẩn để đồng bộ'),
  ], 'Chỉ ra một bất biến, một truy vấn quan trọng và vì sao giá mua không phải bản sao cần cập nhật theo Product.'),
};
