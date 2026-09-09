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
  id: 'intro', villageId: 'departure', title: 'System Design Interview', place: 'Bếp chung', spirit: 'Bạn Đom Đóm', icon: '🔥', color: '#df8848', position: [-4, 0],
  objectives: ['Biến đề bài mơ hồ thành hành vi kiểm chứng được', 'Nêu giả định và đánh đổi', 'Theo dấu một yêu cầu từ đầu đến cuối'], prerequisites: [], duration: 18,
  source: source('in-a-hurry/introduction'),
  sections: [
    section('Biết dạng phỏng vấn và cách được đánh giá', 'Product system design thường bắt đầu từ hành vi của một sản phẩm; infrastructure design có thể bắt đầu từ một dịch vụ nền như hàng đợi hoặc kho khóa–giá trị. Thiết kế lớp, mô hình ML và giao diện trình duyệt là các phạm vi khác cần xác nhận. Bốn năng lực cần thể hiện là Problem Navigation (phân rã, ưu tiên), Solution Design (nối thành lời giải), Technical Excellence (hiểu cơ chế, giới hạn) và Communication and Collaboration (giải thích, tiếp nhận phản biện). Đánh đổi phải được gắn với nhu cầu chứ không chỉ kể tên công nghệ.', 'Giả định: cùng từ “chat”, một đề yêu cầu định nghĩa lớp Message, đề khác yêu cầu chuyển tin giữa hàng triệu thiết bị. Hãy hỏi đầu ra mong muốn trước khi chuẩn bị sơ đồ. Với đề hệ thống, trình bày luồng gửi–lưu–nhận và cách xử lý mất kết nối sẽ tạo cơ sở để người phỏng vấn hỏi sâu.', 'Xác nhận loại bài và thể hiện suy luận, thay vì đọc lại một sơ đồ học thuộc.'),
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
  encounter: encounter('intro-fog', 'Sương Mù Học Thuộc', 'fog', 'Giả định: bảng tin chợ có 2.000 thành viên, chỉ cần đăng và đọc thông báo; tin thường được phép cũ 10 giây.', [
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
  id: 'delivery', villageId: 'departure', title: 'Delivery Framework', place: 'Cầu bản thảo', spirit: 'Bác Rùa Dẫn Lối', icon: '🧭', color: '#cf9a50', position: [4, 0],
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
  encounter: encounter('delivery-scope', 'Quái Vật Scope Creep', 'scope', 'Giả định: quầy cơm cần xem thực đơn, đặt phần, xem đơn; có 80 suất mỗi ngày và 30 phút thảo luận.', [
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
  id: 'networking', villageId: 'signals', title: 'Networking Essentials', place: 'Bến gói tin', spirit: 'Chim Hải Âu Đưa Tin', icon: '📡', color: '#55a7b4', position: [-6, -2],
  objectives: ['Phân biệt vận chuyển gói với thành công nghiệp vụ', 'Chọn HTTP, SSE hoặc WebSocket theo hướng dữ liệu', 'Giải thích cân bằng tải và giới hạn retry'], prerequisites: ['delivery'], duration: 20,
  source: source('core-concepts/networking-essentials'),
  sections: [
    section('Tần suất cập nhật và giao tiếp nội bộ', 'Short polling hỏi theo chu kỳ nên đơn giản nhưng có thể nhận nhiều câu trả lời không đổi. Long polling giữ request đến khi có sự kiện hoặc timeout, rồi khách nối lại; SSE duy trì luồng một chiều còn WebSocket trao đổi hai chiều. gRPC dùng hợp đồng schema, thường với Protocol Buffers và HTTP/2, phù hợp nhiều đường dịch vụ nội bộ; khả năng hỗ trợ trên trình duyệt và hạ tầng proxy cần được kiểm tra.', 'Giả định: bảng báo lịch tàu chỉ đổi mỗi giờ có thể polling thưa mà vẫn đủ nhu cầu. Bảng điều phối đổi mỗi giây đáng thử SSE. Một dịch vụ tổng hợp gọi dịch vụ định tuyến nội bộ có thể thử gRPC, nhưng vẫn cần deadline và đo serialization, mạng, xử lý; gọi RPC không biến lời gọi từ xa thành thao tác không thể lỗi.', 'Chọn theo nhịp cập nhật, chiều trao đổi và môi trường client, rồi đo chi phí.'),
    section('Các tầng có trách nhiệm khác nhau', 'IP đưa gói tới địa chỉ, transport như TCP/UDP kết nối các ứng dụng qua cổng, còn HTTP mô tả request và response. TLS bảo vệ kênh và xác minh đầu bên kia theo chứng chỉ; nó không quyết định người dùng có quyền sửa một đơn. HTTP/2 ghép nhiều stream trên một kết nối TCP; HTTP/3 dùng QUIC trên UDP với cơ chế tin cậy và mã hóa của QUIC, nên không được suy ra HTTP/3 là gửi rồi bỏ mặc.', 'Giả định: một trang tải nhiều ảnh và gọi API. Việc ghép stream có thể giảm nhu cầu mở nhiều kết nối, nhưng nếu API đang chờ database thì đổi phiên bản HTTP không sửa nút nghẽn ấy. Hãy đặt số đo ở thời gian kết nối, thời gian server xử lý và thời gian truyền payload để phân biệt.', 'Tối ưu ở tầng gây chậm; mã hóa kênh không thay thế phân quyền.'),
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
  encounter: encounter('networking-ghost', 'Hồn Ma Kết Nối', 'ghost', 'Giả định: bảng cảng trên trình duyệt cần nhận trạng thái tàu một chiều; Wi-Fi chập chờn.', [
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
  id: 'api', villageId: 'signals', title: 'API Design', place: 'Cổng giao ước', spirit: 'Cá Heo Giữ Lời', icon: '🔑', color: '#658dc4', position: [0, 3],
  objectives: ['Thiết kế tài nguyên và lỗi dễ dùng', 'Chặn retry tạo đơn trùng', 'Phân trang và kiểm tra quyền trên tài nguyên'], prerequisites: ['networking'], duration: 20,
  source: source('core-concepts/api-design'),
  sections: [
    section('Chọn giao diện và giữ khả năng tiến hóa', 'REST là điểm xuất phát đơn giản cho CRUD; dùng GET để đọc và không tạo tác dụng phụ. GraphQL hữu ích khi nhiều khách cần hình dạng dữ liệu khác nhau nhưng cần giới hạn truy vấn và xử lý N+1 bằng batching. gRPC với schema và serialization nhị phân đáng cân nhắc cho dịch vụ nội bộ. Tránh đổi nghĩa trường đang được client cũ sử dụng; thay đổi phá vỡ hợp đồng cần chiến lược phiên bản.', 'Giả định: app cũ hiểu amount là đồng, app mới muốn nghìn đồng. Giữ amount cùng nghĩa và thêm trường mới rõ đơn vị an toàn hơn âm thầm chia giá trị cho 1.000. Một query lấy 50 đơn cùng chủ hàng cũng cần kiểm tra có phát ra 51 lần đọc hay đã gom theo các chủ duy nhất.', 'Giao diện phải dự đoán được cả về ngữ nghĩa, chi phí và khả năng nâng cấp.'),
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
  encounter: encounter('api-mimic', 'Mimic Phân Trang', 'mimic', 'Giả định: chợ bán đồ độc bản; khách có thể retry sau timeout và chỉ được đọc đơn của mình.', [
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
  id: 'data-modeling', villageId: 'signals', title: 'Data Modeling', place: 'Xưởng bản ghi', spirit: 'Rái Cá Thợ Sổ', icon: '🧱', color: '#648f9f', position: [6, -2],
  objectives: ['Bắt đầu từ truy vấn và bất biến', 'Chọn quan hệ hay tài liệu theo ranh giới dữ liệu', 'Phân biệt snapshot nghiệp vụ với dữ liệu sao chép'], prerequisites: ['api'], duration: 20,
  source: source('core-concepts/data-modeling'),
  sections: [
    section('So sánh các hình dạng lưu trữ', 'Key-value phù hợp truy xuất theo khóa rõ ràng, ví dụ sessionId; truy vấn tùy ý thường cần mô hình phụ. Wide-column thường tổ chức theo partition key và thứ tự trong partition, cần thiết kế từ access pattern. Graph database biểu diễn đỉnh/cạnh và hợp với duyệt quan hệ nhiều bước. Chúng bổ sung lựa chọn cho quan hệ và tài liệu; không loại nào tự giải mọi truy vấn.', 'Giả định: xưởng đèn giữ phiên theo sessionId trong key-value, đơn và tồn trong kho quan hệ. Nếu cần lần theo mạng nhà cung cấp nhiều cấp, mô hình graph đáng thử; nếu chỉ lấy chi tiết một đơn theo id thì thêm graph sẽ tạo chi phí chưa có lợi ích. Viết ba truy vấn thật trước khi chọn thêm kho.', 'Chọn kho theo thao tác cần làm, và giới hạn số nguồn sự thật phải phối hợp.'),
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
  encounter: encounter('data-golem', 'Golem Quan Hệ', 'golem', 'Giả định: xưởng đèn bán hàng, cần lịch sử hóa đơn không đổi và tồn không âm.', [
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

const cachingModule: LearningModule = {
  id: 'caching', villageId: 'scale', title: 'Caching', place: 'Vườn ký ức', spirit: 'Sóc Giữ Hạt', icon: '🌿', color: '#78a86b', position: [-7, -4],
  objectives: ['Thiết kế cache-aside và đường miss', 'Phân biệt hết hạn với loại bỏ khi đầy', 'Xử lý dữ liệu cũ, stampede và hot key'], prerequisites: ['data-modeling'], duration: 20,
  source: source('core-concepts/caching'),
  sections: [
    section('Đặt cache ở đâu và ai chịu trách nhiệm ghi', 'Client cache giảm cả lượt mạng nhưng khó thu hồi từ server; CDN phù hợp nội dung có thể chia sẻ ở biên; cache trong tiến trình tránh mạng nhưng mỗi instance giữ bản riêng; cache phân tán chia sẻ giữa instance. Read-through để lớp cache tự nạp khi thiếu. Write-through chờ lưu kho gốc trước xác nhận; write-behind ghi kho gốc sau nên có cửa sổ mất dữ liệu nếu lớp đệm chưa bền.', 'Giả định: ảnh cây dùng URL có phiên bản trên CDN, cấu hình nhỏ ít đổi giữ trong tiến trình, mô tả dùng cache phân tán. Nếu chọn write-through qua Redis, cần code hoặc thư viện nối việc ghi database; gọi SET không tự tạo giao dịch đồng bộ với kho gốc. Đơn đã xác nhận không được chỉ nằm trong bộ đệm write-behind dễ mất.', 'Chỉ rõ chủ thể nạp/ghi, nguồn chuẩn và điều xảy ra khi lớp cache hỏng.'),
    section('Giữ lại điều đáng đọc lại', 'Cache giữ bản sao để tránh lặp công việc. Với cache-aside, ứng dụng thử cache, đọc kho gốc khi thiếu rồi điền bản sao. Một miss vì vậy có thể tốn thêm bước so với đọc thẳng kho. Tập dữ liệu được đọc lặp và chi phí tạo kết quả quyết định giá trị của cache; hit rate cao không tự chứng minh mọi request đều nhanh.', 'Giả định: vườn giống có 500 mô tả cây, nhưng 20 cây mùa vụ chiếm phần lớn lượt xem. Cache mô tả là hợp lý hơn việc giữ mọi kết quả tìm kiếm chỉ dùng một lần. Đo riêng hit, miss và thời gian đọc kho gốc để biết phần tải thực sự được giảm.', 'Vẽ cả đường hit và miss, xác định nguồn chuẩn.'),
    section('Độ mới là một hợp đồng', 'TTL quy định thời điểm hết hạn; LRU hay LFU chọn mục bị loại khi thiếu chỗ. Chúng giải hai vấn đề khác nhau. Ghi kho gốc rồi xóa cache giúp làm mới nhưng vẫn có race khi một lượt đọc cũ điền lại sau đó. Thao tác cần chính xác tuyệt đối nên kiểm tra tại nguồn có quyền quyết định.', 'Giả định: mô tả cây chấp nhận cũ 60 giây, nhưng số túi hạt cuối cùng phải được kiểm tra trong giao dịch mua. Bảng hiển thị có thể dùng cache; quyết định bán không dựa vào bản cache ấy. Khi sửa mô tả, dùng phiên bản hoặc cơ chế làm mới để nhận biết lượt điền cũ.', 'Không để bản sao hiển thị quyết định một bất biến tồn kho.'),
    section('Khi cache cùng hết hạn', 'Stampede xảy ra khi nhiều request cùng thiếu một kết quả và đồng thời tái tạo nó. Single-flight gộp công việc cho cùng khóa; jitter TTL phân tán thời điểm hết hạn giữa nhiều khóa. Hot key lại là tải lớn vào một khóa dù nó vẫn hit, nên cần phân phối đọc hoặc bản sao cục bộ với độ cũ được quản lý.', 'Giả định: ảnh cây đoạt giải xuất hiện trên trang chủ. Nếu khóa mô tả hết hạn, cho một tác vụ nạp lại trong khi các khách chờ có deadline. Nếu khóa không hết hạn mà một máy cache vẫn quá tải, thêm TTL jitter không giải quyết; cần tách tải đọc và đo từng máy.', 'Phân biệt thiếu đồng loạt với một khóa quá nóng.'),
  ],
  quiz: quiz('caching', [
    ['Cache-aside bị miss. Ai thường đọc kho gốc và điền cache?', 'Ứng dụng xử lý request', 'DNS resolver', 'Trình duyệt bắt buộc phải gọi thẳng database', 'Bộ cân bằng tải L4 luôn làm việc này', 'Cache-aside đặt logic đọc thiếu và điền cache trong ứng dụng.', 'cache-aside'],
    ['Cache chưa đầy nhưng mô tả phải làm mới sau 60 giây. Cơ chế nào liên quan?', 'TTL', 'Chỉ LRU', 'Chỉ thêm dung lượng RAM', 'Băm lại productId mỗi lần đọc', 'TTL kiểm soát hết hạn; LRU xử lý mục nào bị loại khi phải nhường chỗ.', 'ttl'],
    ['Một khóa hết hạn và 800 request cùng đọc kho gốc. Hướng xử lý trực tiếp?', 'Single-flight cho một lần nạp lại khóa', 'Tăng số request retry tức thì', 'Tắt cache toàn bộ hệ thống', 'Chuyển mọi khóa sang cùng một TTL đồng bộ', 'Gộp công việc tái tạo giảm số truy vấn trùng cho cùng khóa.', 'stampede'],
    ['Hit rate 99% nhưng một máy cache quá tải vì một cây nổi tiếng. Cần xem gì?', 'Tải theo khóa và khả năng phân phối bản sao đọc', 'Chỉ TTL của mọi khóa ít dùng', 'Chỉ tổng số khóa phân bố đều', 'Số tên miền của trang chủ', 'Phân bố số khóa không nói được phân bố request; hot key có thể nghẽn dù hit tốt.', 'hot-key'],
    ['Cache nói còn một túi hạt. Trước khi chốt mua phải làm gì?', 'Kiểm tra và trừ tồn nguyên tử tại nguồn chuẩn', 'Tin cache vì vừa đọc dưới một giây', 'Xóa mọi bản ghi đơn cũ', 'Đặt TTL bằng vô hạn để giữ kết quả', 'Bản sao có thể cũ hoặc bị hai khách đọc cùng lúc; nguồn quyết định phải bảo vệ tồn.', 'consistency'],
  ]),
  encounter: encounter('cache-mold', 'Nấm Mốc Dữ Liệu Cũ', 'mold', 'Giả định: mô tả cây được phép cũ 60 giây, tồn bán hàng không được âm.', [
    turn('Đặt cache vào đâu trước?', 'Mô tả cây bị đọc lặp nhiều lần; kho gốc đang tốn công trả cùng nội dung.', 'cache-aside',
      outcome('Cache-aside mô tả, giữ kho gốc là nguồn chuẩn', 'Các hit giảm truy vấn lặp, latency giảm và throughput hữu ích tăng.', { latency: -5, throughput: 5, complexity: 2 }),
      outcome('Ghi mọi đơn chỉ vào cache không có đường lưu bền', 'Cache trở thành điểm mất dữ liệu khi bị loại hoặc khởi động lại.', { consistency: -8, latency: -3 }), 'đưa đơn về kho bền và chỉ cache bản sao có thể tái tạo'),
    turn('Một cây nổi tiếng vừa hết hạn cache. Làm gì với đám đông?', 'Hàng trăm request cùng miss một khóa; kho gốc có năng lực hữu hạn.', 'stampede',
      outcome('Gộp lần nạp theo khóa với timeout và giới hạn hàng chờ', 'Một lần tái tạo phục vụ nhiều khách; availability tăng nhờ tránh tải trùng.', { availability: 5, throughput: 4, complexity: 3 }),
      outcome('Cho mọi request nạp lại độc lập và retry ngay khi chậm', 'Công việc trùng làm kho gốc nghẽn, kéo latency và lỗi tăng.', { latency: 6, availability: -6 }), 'gộp tái tạo khóa và đặt giới hạn chờ'),
    turn('Hai người cùng mua túi hạt cuối. Tin số tồn ở đâu?', 'Cache hiển thị còn một túi nhưng hai request có thể cùng thấy nó.', 'consistency',
      outcome('Chốt bằng cập nhật tồn có điều kiện ở kho chuẩn', 'Một người thắng giao dịch; consistency tăng dù thêm bước kiểm tra.', { consistency: 7, latency: 2 }),
      outcome('Chấp nhận cả hai vì cache vừa được làm mới', 'Độ mới không loại bỏ tranh chấp; hai lần mua vẫn bán quá tồn.', { consistency: -9, latency: -2 }), 'xác nhận mua bằng cập nhật nguyên tử và xử lý đơn vượt tồn'),
  ], 'Giải thích vì sao TTL, single-flight và giao dịch tồn kho xử lý ba vấn đề khác nhau.'),
};

const shardingModule: LearningModule = {
  id: 'sharding', villageId: 'scale', title: 'Sharding', place: 'Ruộng phân mảnh', spirit: 'Hải Ly Chia Ruộng', icon: '🗺️', color: '#b29965', position: [0, -5],
  objectives: ['Chọn shard key theo truy vấn và phân bố tải', 'Nhận biết fan-out và hot shard', 'Lập kế hoạch di chuyển dữ liệu'], prerequisites: ['caching'], duration: 20,
  source: source('core-concepts/sharding'),
  sections: [
    section('Phân biệt chia mảnh và nhân bản', 'Horizontal sharding chia các hàng, còn chia dọc tách nhóm cột hoặc chức năng dữ liệu. Replication giữ nhiều bản của dữ liệu để phục vụ đọc hoặc chịu lỗi; thêm replica không tự chia công ghi của một chủ. Directory-based sharding dùng bảng ánh xạ khóa tới shard để có quyền điều phối linh hoạt, đổi lại phải quản lý độ sẵn sàng và cache của chính bảng địa chỉ.', 'Giả định: A giữ đơn khách 1–999, B giữ khách 1.000–1.999: đó là chia mảnh. A2 giữ cùng đơn với A: đó là bản sao. Nếu chuyển riêng một khách rất lớn sang C qua directory, client giữ mapping cũ cần nhận chuyển hướng hoặc làm mới phiên bản; bản đồ cũng trở thành một phần của kế hoạch lỗi.', 'Đừng gọi bản sao là shard; nêu cả nơi lưu địa chỉ và cách làm mới địa chỉ.'),
    section('Chia dữ liệu sau khi biết giới hạn', 'Sharding chia các bản ghi giữa nhiều kho có tài nguyên riêng. Nó có thể tăng sức chứa và năng lực xử lý, đồng thời tạo thêm định tuyến, truy vấn nhiều shard và việc cân bằng lại. Trước khi chia, xác định nút nghẽn thực sự; truy vấn thiếu chỉ mục không tự trở nên hợp lý khi nhân thành nhiều máy.', 'Giả định: sổ giao hàng đã tối ưu truy vấn nhưng một máy vẫn không đủ tốc độ ghi ở giờ cao điểm. Chia theo cửa hàng có thể giữ đơn của một cửa hàng gần nhau. Tuy nhiên cần kiểm tra cửa hàng lớn nhất; số cửa hàng nhiều không bảo đảm tải phân bố đều.', 'Nêu bằng chứng phải chia và chi phí mới sau khi chia.'),
    section('Khóa chia đất cũng là địa chỉ truy vấn', 'Shard key tốt giúp định tuyến truy vấn phổ biến và không dồn phần lớn dữ liệu hoặc request vào một nơi. Chia theo khoảng giữ dữ liệu gần nhau theo thứ tự nhưng dễ nóng ở khoảng mới. Chia theo hash thường phân bố khóa tốt hơn, đổi lại truy vấn khoảng có thể cần nhiều shard.', 'Giả định: 90% thao tác lấy đơn theo buyerId. Hash buyerId giúp tìm đúng shard cho lịch sử một khách. Báo cáo doanh thu toàn chợ vẫn cần tổng hợp nhiều nơi; ta có thể cập nhật một mô hình báo cáo riêng thay vì quét mọi shard trên mỗi lần mở dashboard.', 'Luôn thử shard key bằng truy vấn phổ biến và truy vấn trái chiều.'),
    section('Chuyển nhà cần bàn giao', 'Thay hàm định tuyến chỉ thay địa chỉ cần tới, không chuyển các byte đã lưu. Một kế hoạch di chuyển cần sao chép dữ liệu, theo kịp thay đổi trong lúc sao chép, kiểm tra rồi chuyển quyền sở hữu. Ghi đồng thời ở hai nơi mà không có quy tắc phối hợp dễ tạo hai phiên bản khác nhau.', 'Giả định: chuyển nhóm khách 400–499 từ A sang B. A tiếp tục là nơi quyết định ghi, B nhận bản sao và phần thay đổi. Khi kiểm chứng bắt kịp, chuyển bản đồ có phiên bản và để A hướng client cũ sang B. Giới hạn tốc độ copy để không làm nghẽn đơn đang chạy.', 'Định tuyến, sở hữu ghi và di chuyển dữ liệu phải đi cùng nhau.'),
  ],
  quiz: quiz('sharding', [
    ['90% truy vấn là lịch sử theo buyerId, tải giữa khách khá đều. Shard key nào đáng thử?', 'Hash buyerId', 'Cờ isPaid chỉ có hai giá trị', 'Ngày hiện tại cho mọi đơn mới', 'Một hằng số chung của cả chợ', 'buyerId vừa nhiều giá trị vừa giúp truy vấn phổ biến đi tới một shard, với giả định tải đã nêu.', 'shard-key'],
    ['Chia theo ngày tạo khiến shard hôm nay nóng. Lý do?', 'Phần lớn ghi mới cùng rơi vào khoảng hiện tại', 'Dữ liệu cũ tự nhân đôi mỗi phút', 'Hash luôn giữ nguyên thứ tự thời gian', 'Mọi shard bắt buộc có CPU bằng không', 'Range theo thời gian có tính cục bộ nhưng ghi mới dễ dồn vào đuôi.', 'hot-shard'],
    ['Đơn chia theo buyerId; cần tổng doanh thu toàn chợ mỗi giây. Chi phí nào xuất hiện?', 'Fan-out hoặc một mô hình tổng hợp được cập nhật riêng', 'Một lookup buyerId bất kỳ đủ cho toàn chợ', 'DNS tự cộng doanh thu các shard', 'Không cần tính độ trễ của dữ liệu báo cáo', 'Truy vấn không có khóa định tuyến phải tổng hợp nhiều nơi hoặc đọc bản tổng hợp có hợp đồng độ mới.', 'fan-out'],
    ['Đổi hash(id)%4 thành hash(id)%5 rồi deploy. Dữ liệu cũ xảy ra điều gì?', 'Nhiều khóa đổi địa chỉ nhưng byte vẫn ở nơi cũ nếu chưa di chuyển', 'Mọi bản ghi tự xuất hiện tại shard mới', 'Chỉ khóa vừa tạo mới bị ảnh hưởng', 'Mọi giao dịch trở thành liên vùng nguyên tử', 'Hàm định tuyến không tự thực hiện sao chép và chuyển quyền sở hữu dữ liệu.', 'resharding'],
    ['Một truy vấn quét bảng do thiếu chỉ mục. Hành động đầu tiên hợp lý?', 'Đo kế hoạch truy vấn và đánh giá chỉ mục trước khi sharding', 'Nhân ngay thành 100 shard để khỏi đo', 'Xóa các điều kiện lọc', 'Chọn shard theo màu nút bấm', 'Cần sửa nguyên nhân truy vấn trước khi thêm chi phí phân phối.', 'evidence'],
  ]),
  encounter: encounter('shard-ogre', 'Ogre Hot Partition', 'ogre', 'Giả định: sổ đơn đã tối ưu chỉ mục nhưng vượt năng lực ghi một máy; phần lớn truy vấn theo người mua, tải khách tương đối đều.', [
    turn('Chọn khóa chia sổ đơn?', 'Tra lịch sử một người là truy vấn chủ đạo.', 'shard-key',
      outcome('Hash buyerId và đo tải từng shard', 'Truy vấn có địa chỉ rõ; dữ liệu có cơ hội phân bố đều theo giả định.', { throughput: 5, complexity: 3 }),
      outcome('Chia theo isPaid để chỉ có hai nhóm', 'Cardinality thấp giới hạn phân phối; nhóm đơn đã trả tiền dễ thành điểm nóng.', { throughput: -5, latency: 4 }), 'chuyển khỏi khóa hai giá trị sang khóa gắn với truy vấn và tải'),
    turn('Chủ chợ cần báo cáo toàn sàn. Đường đọc nào phù hợp?', 'Báo cáo được phép chậm 30 giây; không phải quyết định thanh toán.', 'fan-out',
      outcome('Cập nhật bảng tổng hợp riêng và công bố độ mới', 'Đường dashboard tránh quét đồng loạt shard, đổi lại consistency hiển thị giảm nhẹ.', { latency: -4, throughput: 3, consistency: -2, complexity: 3 }),
      outcome('Mỗi lần mở dashboard quét đồng bộ toàn bộ đơn mọi shard', 'Báo cáo tranh tài nguyên với đơn đang ghi, tăng latency và giảm throughput.', { latency: 6, throughput: -5 }), 'tách báo cáo khỏi truy vấn quét trực tiếp trên đường giao dịch'),
    turn('Thêm shard mới khi chợ đang mở. Bước chuyển nào an toàn?', 'Khách vẫn tiếp tục tạo đơn trong lúc dữ liệu được copy.', 'resharding',
      outcome('Copy, theo kịp thay đổi, kiểm chứng rồi chuyển bản đồ có phiên bản', 'Tránh mất ghi trong lúc bàn giao; availability tăng nhưng complexity cũng tăng.', { availability: 5, consistency: 4, complexity: 4 }),
      outcome('Đổi địa chỉ trước rồi mới tính việc copy dữ liệu', 'Client tới nơi chưa có bản ghi, giảm availability và consistency quan sát được.', { availability: -7, consistency: -5 }), 'khôi phục định tuyến tới chủ cũ và hoàn tất bàn giao trước khi chuyển'),
  ], 'Bảo vệ shard key bằng một truy vấn phổ biến, một ngoại lệ và kế hoạch chuyển chủ dữ liệu.'),
};

const hashingModule: LearningModule = {
  id: 'hashing', villageId: 'scale', title: 'Consistent Hashing', place: 'Vòng đá', spirit: 'Nai Sao Giữ Vòng', icon: '🌀', color: '#9c83ba', position: [7, -4],
  objectives: ['Theo dấu khóa trên vòng băm', 'Phân biệt vnode và bản sao', 'Giới hạn kỳ vọng với hot key và di chuyển'], prerequisites: ['sharding'], duration: 20,
  source: source('core-concepts/consistent-hashing'),
  sections: [
    section('Địa chỉ ít xáo trộn khi thêm máy', 'Hash modulo theo số máy làm nhiều khóa đổi nơi khi số máy thay đổi. Consistent hashing đặt khóa và vị trí máy trong cùng không gian vòng; một quy ước thường dùng là chọn vị trí máy kế tiếp theo chiều kim đồng hồ. Thêm máy chỉ đổi chủ của các khoảng nó nhận, giảm xáo trộn so với đổi mẫu số toàn cục.', 'Giả định vòng 0–99 có A ở 10, B ở 40, C ở 80. Khóa tại 32 đi tới B, khóa tại 92 vòng qua 0 tới A. Thêm D ở 25 khiến khoảng (10,25] chuyển từ B sang D; khóa 32 vẫn ở B. Đây là ví dụ quy ước, không phải cấu hình cụm thật.', 'Tìm chủ khóa bằng vị trí trên vòng, kể cả khi phải vòng qua 0.'),
    section('Nhiều vị trí không phải nhiều máy', 'Virtual node cho một máy vật lý nhiều vị trí trên vòng, giúp chia các khoảng nhỏ hơn và phân phối trách nhiệm khi máy thay đổi. Vnode không tự tạo bản sao độc lập. Nếu mọi bản sao của một khóa cùng nằm trên một máy vật lý, lỗi máy đó vẫn làm mất toàn bộ khả năng đọc khóa.', 'Giả định A có vị trí 10, 50 và 90. Ba vị trí là ba phần dữ liệu do cùng A giữ; tắt A làm cả ba cùng mất phục vụ. Với yêu cầu chịu lỗi một máy, danh sách replica phải bỏ qua các vnode có cùng chủ vật lý và chọn miền lỗi khác phù hợp.', 'Đếm miền lỗi thực, không đếm số chấm trên vòng.'),
    section('Cân khóa khác cân request', 'Một phân bố khóa đẹp vẫn có thể chứa một khóa nhận phần lớn traffic. Vnode giải sự lệch do kích thước khoảng, còn hot key đọc cần phân phối bản sao hoặc cache cục bộ. Vòng băm cũng không tự chuyển byte hay bảo vệ ghi; phải phối hợp bản đồ, sao chép và chuyển chủ.', 'Giả định một công thức bánh được đọc gấp nghìn lần các công thức khác. Thêm vị trí ảo giữ nguyên việc mọi request của khóa này tìm cùng chủ. Với công thức chấp nhận cũ ngắn hạn, nhân bản đọc có kiểm soát hữu ích hơn; với số vé còn lại, cần giữ một cơ chế quyết định ghi có thẩm quyền.', 'Consistent hashing giảm đổi địa chỉ, không giải mọi loại nghẽn.'),
  ],
  quiz: quiz('hashing', [
    ['Vòng 0–99: A=10, B=40, C=80. Khóa 92 thuộc ai theo chiều kim đồng hồ?', 'A, sau khi vòng qua 0', 'B vì gần giữa vòng', 'C vì 80 nhỏ hơn 92', 'Không máy nào vì khóa lớn hơn 80', 'Đi tiếp theo chiều quy định và vòng lại đầu; vị trí đầu gặp là A ở 10.', 'ring'],
    ['Thêm D=25 vào vòng A=10, B=40, C=80. Khoảng nào chuyển cho D?', '(10,25]', '(40,80]', 'Toàn bộ vòng', '(80,99] và [0,10]', 'D nhận những khóa trước đây đi tới B nhưng nay gặp D trước.', 'ring'],
    ['A có ba vnode. Có bảo đảm chịu lỗi máy A không?', 'Không, ba vnode vẫn cùng miền lỗi vật lý', 'Có, vì ba vnode là ba máy độc lập', 'Có, vì hash tự lưu backup', 'Có, vì khóa không còn cần dữ liệu', 'Vnode là vị trí phân phối, không phải bản sao trên máy khác.', 'virtual-nodes'],
    ['Một khóa chiếm 70% request đọc dù các khoảng rất đều. Điều gì đáng thử?', 'Nhân bản đọc hoặc cache cục bộ với hợp đồng độ cũ', 'Chỉ tăng số vnode và mặc định hot key đã hết', 'Đổi tên khóa nhưng vẫn giữ một bản duy nhất', 'Bỏ mọi đo đạc theo khóa', 'Một khóa vẫn tìm cùng chủ; cần tách tải request chứ không chỉ phân bố số khóa.', 'hot-key'],
    ['Sau khi vòng gán khóa cho máy mới, điều gì vẫn cần thực hiện?', 'Di chuyển dữ liệu và bàn giao quyền ghi có kiểm chứng', 'Không cần vì hash tự chuyển byte', 'Xóa ngay máy cũ trước khi copy', 'Cho mọi máy cùng ghi không quy tắc', 'Bản đồ mô tả nơi nên ở, còn dữ liệu và cập nhật cần giao thức chuyển thực tế.', 'migration'],
  ]),
  encounter: encounter('hash-serpent', 'Mãng Xà Vòng Băm', 'serpent', 'Giả định: vòng 0–99 có A=10, B=40, C=80; chọn máy kế tiếp theo chiều kim đồng hồ.', [
    turn('Khóa công thức tại 92 được đọc ở đâu?', 'Vòng quay lại 0 sau vị trí 99.', 'ring',
      outcome('Tới A ở 10 sau khi vòng qua 0', 'Định tuyến tìm đúng chủ, tránh lần đọc sai rồi thử lại.', { latency: -3, availability: 4 }),
      outcome('Tới C vì khoảng cách số học tới 80 nhỏ nhất', 'Quy tắc gần nhất không phải quy tắc kế tiếp; đọc sai chủ gây miss.', { availability: -5, latency: 4 }), 'sửa định tuyến thành kế tiếp theo chiều kim đồng hồ có wrap-around'),
    turn('Thêm D ở 25, chuyển dữ liệu nào?', 'Cần giảm công di chuyển trong lúc khách vẫn đang đọc.', 'migration',
      outcome('Bàn giao khoảng (10,25] từ B sang D sau kiểm chứng', 'Khoảng không liên quan giữ nguyên, giảm xáo trộn phục vụ.', { availability: 4, throughput: 3, complexity: 3 }),
      outcome('Đổi toàn bộ sang modulo 4 ngay lập tức', 'Nhiều khóa đổi chủ không đi kèm dữ liệu, gây miss trên diện rộng.', { availability: -7, latency: 5 }), 'khôi phục vòng và bàn giao chỉ các khoảng đổi chủ'),
    turn('Một công thức chiếm phần lớn lượt đọc. Thêm vnode có đủ không?', 'Công thức được phép cũ 20 giây; thống kê cho thấy một khóa nóng.', 'hot-key',
      outcome('Phân phối bản sao đọc có TTL và đo tải theo khóa', 'Tải đọc rời khỏi một chủ duy nhất, đổi lại độ mới giảm nhẹ.', { throughput: 6, latency: -3, consistency: -2, complexity: 3 }),
      outcome('Chỉ tăng vnode rồi coi mọi request đã được chia đều', 'Khóa vẫn có một chủ định tuyến; nút nghẽn request chưa được xử lý.', { throughput: -4, complexity: 3 }), 'tách tải đọc của khóa nóng qua bản sao có độ cũ được quản lý'),
  ], 'Tự đặt một khóa và một máy mới lên vòng; chỉ ra dữ liệu di chuyển và điều vnode không bảo đảm.'),
};

const capModule: LearningModule = {
  id: 'cap', villageId: 'scale', title: 'CAP Theorem', place: 'Đèo hai lời hứa', spirit: 'Cú Hiền Canh Đèo', icon: '⚖️', color: '#a786ac', position: [-7, 3],
  objectives: ['Hiểu lựa chọn khi phân vùng mạng xảy ra', 'Phân biệt consistency của CAP với ACID', 'Chọn chính sách theo từng thao tác'], prerequisites: ['hashing'], duration: 20,
  source: source('core-concepts/cap-theorem'),
  sections: [
    section('Phân vùng làm hai lời hứa xung đột', 'Trong CAP, consistency nói tới hành vi như một bản sao tuyến tính: thao tác phải phù hợp một thứ tự duy nhất tôn trọng thứ tự thời gian thực. Availability yêu cầu mọi request tới nút không lỗi cuối cùng nhận kết quả hợp lệ. Khi các nhóm nút không liên lạc được, không thể đồng thời hứa luôn phục vụ và luôn giữ thứ tự ấy cho dữ liệu chia sẻ. P là điều kiện lỗi phải đối mặt, không phải nút bật tắt để né bài toán.', 'Giả định: hai trạm bán cùng chiếc vé cuối, đường truyền giữa trạm bị cắt. Nếu cả hai nhận mua dựa trên tồn cục bộ, hai khách có thể cùng được xác nhận. Nếu chỉ trạm còn quyền ghi nhận mua, khách ở trạm kia có thể phải chờ hoặc bị từ chối.', 'Nói rõ thao tác nào bị hạn chế trong lúc partition.'),
    section('Đừng dùng một chữ C cho mọi thứ', 'Consistency của ACID là việc giao dịch giữ các quy tắc dữ liệu đã định nghĩa; nó không đồng nghĩa mọi bản sao đọc đều tuyến tính. Một hệ thống có thể dùng giao dịch trong một vùng và vẫn có replica đọc trễ ở vùng khác. Tương tự, trả HTTP 200 với dữ liệu giả không chứng minh availability theo hợp đồng nghiệp vụ.', 'Giả định: giao dịch tại trạm A bảo đảm tồn không âm. Trạm B đọc replica trễ vẫn thấy vé trống sau khi A đã bán. Ràng buộc tại A còn đúng, nhưng đường đọc B không đáp ứng lời hứa “luôn thấy lần ghi mới nhất”. Cần xét riêng đường chốt vé và đường xem sơ đồ.', 'Nêu mô hình nhất quán của thao tác, không chỉ nhãn database.'),
    section('Một sản phẩm có nhiều ưu tiên', 'Mô tả sự kiện có thể chấp nhận bản cũ; xác nhận vé thường cần giữ duy nhất. Sau partition, dữ liệu chấp nhận nhiều nguồn ghi cần quy tắc hòa giải. Ngoài partition, đồng bộ qua khoảng cách vẫn tạo đánh đổi độ trễ và độ mới; PACELC nhắc nhìn cả hoạt động bình thường, không chỉ thảm họa.', 'Giả định: người xem được đọc tên chương trình cũ trong vài phút, còn mua ghế phải đi tới chủ ghi hợp lệ. Khi kết nối mất, vẫn mở trang giới thiệu nhưng tạm dừng xác nhận ở phía không đủ thẩm quyền. Khách được biết rõ chưa có vé thay vì một lời hứa cần thu hồi.', 'Chọn chính sách theo hậu quả của dữ liệu sai ở từng endpoint.'),
  ],
  quiz: quiz('cap', [
    ['Hai vùng mất liên lạc nhưng cùng bán ghế cuối. Muốn tránh hai xác nhận phải làm gì?', 'Giới hạn ghi ở phía có thẩm quyền, chấp nhận từ chối phía còn lại', 'Cho cả hai ghi rồi coi như chưa có mâu thuẫn', 'Đổi tên partition thành timeout', 'Trả 200 không lưu gì để tuyên bố đủ CAP', 'Giữ một quyết định duy nhất trong partition có thể buộc một phía không phục vụ ghi.', 'partition'],
    ['Consistency của CAP gần với khái niệm nào?', 'Linearizability: như một bản sao theo thứ tự thời gian thực', 'Mọi cột đều dùng cùng kiểu chuỗi', 'Màu giao diện giống nhau giữa vùng', 'Chỉ cần tồn không âm tại từng máy độc lập', 'CAP xét hành vi quan sát của dữ liệu phân tán, không chỉ ràng buộc trong từng giao dịch.', 'linearizability'],
    ['Replica đọc trễ dù primary có giao dịch ACID. Điều này cho thấy gì?', 'ACID không tự bảo đảm mọi đường đọc replica đều tuyến tính', 'Giao dịch tại primary chắc chắn chưa commit', 'ACID không cho phép có replica', 'Không có đánh đổi độ mới nào trong hệ thống', 'Ràng buộc giao dịch và độ mới của bản sao là hai vấn đề khác nhau.', 'acid-vs-cap'],
    ['Trong partition, trang mô tả và API mua vé có bắt buộc cùng chính sách không?', 'Không; mô tả có thể đọc cũ, mua vé cần giữ duy nhất', 'Có; mọi endpoint bắt buộc ngừng toàn bộ', 'Có; mọi endpoint bắt buộc xác nhận thành công', 'Có; chọn một lần theo tên framework', 'Hậu quả dữ liệu cũ khác nhau nên quyết định theo thao tác và hợp đồng.', 'per-operation'],
    ['Không có partition thì đồng bộ hai vùng còn đánh đổi nào?', 'Độ trễ chờ phối hợp so với mức nhất quán mong muốn', 'Mạng trở thành tức thời', 'Không còn chi phí ghi replica', 'Mọi cache tự biến thành nguồn chuẩn', 'PACELC mở rộng góc nhìn: ngay lúc bình thường, phối hợp từ xa vẫn có giá về latency.', 'pacelc'],
  ]),
  encounter: encounter('cap-dragon', 'Rồng Network Partition', 'dragon', 'Giả định: hai trạm cùng truy cập tồn vé; mạng giữa trạm bị chia cắt, vé không được bán trùng.', [
    turn('Trạm không liên lạc được chủ ghi muốn bán ghế cuối. Trả gì?', 'Chưa có cơ chế cấp riêng tồn cho từng trạm.', 'partition',
      outcome('Tạm từ chối xác nhận tại phía không có quyền ghi', 'Giữ duy nhất bằng cách hy sinh availability của thao tác mua tại phía này.', { consistency: 7, availability: -4 }),
      outcome('Xác nhận từ tồn cục bộ rồi hòa giải sau', 'Hai lời hứa có thể cùng tồn tại cho một ghế; consistency giảm dù phục vụ được thêm request.', { availability: 4, consistency: -9 }), 'dừng ghi không có thẩm quyền và đối soát các vé đã xác nhận trùng'),
    turn('Trang giới thiệu chương trình có cần đóng theo không?', 'Tên và ảnh được phép cũ vài phút, không quyết định quyền sở hữu vé.', 'per-operation',
      outcome('Phục vụ mô tả đã lưu với dấu thời gian cập nhật', 'Đọc vẫn hoạt động với dung sai độ mới công khai.', { availability: 5, consistency: -2, latency: -2 }),
      outcome('Đóng mọi trang cho đến khi cả hai vùng liên lạc lại', 'Chặn cả dữ liệu được phép cũ làm availability giảm không cần thiết.', { availability: -6 }), 'mở lại đường đọc mô tả với độ cũ được công bố'),
    turn('Mạng trở lại. Có nên nhận ghi hai phía ngay?', 'Cần xác định chủ ghi hợp lệ và trạng thái các lần xác nhận trong thời gian lỗi.', 'reconciliation',
      outcome('Kiểm chứng quyền ghi, đối soát lịch sử rồi mở lại theo một chủ', 'Chuyển trạng thái có kiểm chứng tránh nhân đôi lịch sử; complexity tăng cho công đối soát.', { consistency: 5, availability: 3, complexity: 3 }),
      outcome('Cộng số vé còn ở hai bản sao rồi bán tiếp', 'Hai bản sao có thể chứa cùng tồn, cộng lại tạo số vé không có thật.', { consistency: -8, throughput: 2 }), 'dựng lại tồn từ lịch sử hợp lệ thay vì cộng các bản sao'),
  ], 'Giải thích vì sao cùng một sản phẩm vừa đọc cũ được vừa cần từ chối một số lần ghi khi partition.'),
};

const indexingModule: LearningModule = {
  id: 'indexing', villageId: 'scale', title: 'Database Indexing', place: 'Thư viện đường tắt', spirit: 'Mèo Thủ Thư', icon: '📚', color: '#b89460', position: [0, 4],
  objectives: ['Chọn chỉ mục từ hình dạng truy vấn', 'Giải thích B-tree, hash và chỉ mục chuyên biệt', 'Đo lợi ích đọc cùng chi phí ghi'], prerequisites: ['cap'], duration: 20,
  source: source('core-concepts/db-indexing'),
  sections: [
    section('Một đường tìm phụ cần được nuôi dưỡng', 'Index giữ cấu trúc tìm kiếm để giảm lượng dữ liệu phải xét. Nó cần không gian và phải được cập nhật khi dữ liệu liên quan thay đổi. Lợi ích phụ thuộc độ chọn lọc, lượng dòng cần trả và kế hoạch thực thi; với bảng nhỏ hoặc truy vấn lấy phần lớn bảng, quét tuần tự có thể hợp lý.', 'Giả định: thư viện có một triệu phiếu mượn. Tra một mã phiếu thường hưởng lợi từ index, nhưng xuất toàn bộ phiếu để lưu trữ đêm có thể vẫn đọc tuần tự. Nếu thêm index cho mọi cột ghi chú hiếm khi tìm, mỗi lần ghi phiếu sẽ trả chi phí mà người đọc ít được lợi.', 'Chỉ mục là đầu tư cho truy vấn cụ thể, không phải phần thưởng miễn phí.'),
    section('Chọn cấu trúc theo phép tìm', 'B-tree hỗ trợ tìm bằng, khoảng và thứ tự. Hash index phục vụ đối sánh bằng, không phải lựa chọn cho sắp xếp hoặc khoảng. Inverted index ánh xạ từ khóa tới tài liệu cho tìm văn bản; geospatial index hỗ trợ truy vấn vị trí. Không cần triển khai mọi cấu trúc, nhưng cần biết loại truy vấn nào khiến một đường tìm phù hợp.', 'Giả định: tra phiếu id=17 là tìm bằng; tìm sách giá từ 50 đến 100 là khoảng; tìm sách chứa từ “vườn” là văn bản; tìm điểm trả sách gần khách là không gian. Đưa mọi câu hỏi về cùng một hash index sẽ bỏ qua hình dạng thật của bài toán.', 'Nối điều kiện lọc với khả năng của cấu trúc tìm kiếm.'),
    section('Thứ tự cột và bằng chứng thực thi', 'Composite index có thứ tự cột, nên cách đặt cột ảnh hưởng đường tìm. Với truy vấn lọc một người rồi sắp theo thời gian, có thể bắt đầu bằng người đó, tiếp tới thời gian và khóa phân xử. Covering index có thể giảm lần lấy dữ liệu bảng, nhưng index-only scan còn phụ thuộc cơ chế kho và trạng thái khả kiến của bản ghi.', 'Giả định: SELECT id, createdAt FROM Loans WHERE memberId=? ORDER BY createdAt DESC, id DESC LIMIT 20. Thử index (memberId, createdAt DESC, id DESC), kiểm tra EXPLAIN và số dòng thực đọc. Sau đó đo tốc độ ghi phiếu; đừng kết luận chỉ từ việc tên index xuất hiện.', 'Đánh giá kế hoạch truy vấn, độ trễ đuôi và chi phí ghi cùng nhau.'),
  ],
  quiz: quiz('indexing', [
    ['Lọc memberId rồi lấy 20 phiếu mới nhất theo createdAt,id. Index nào đáng thử?', '(memberId, createdAt DESC, id DESC)', 'Chỉ ghi chú văn bản không dùng trong truy vấn', 'Hash(createdAt) để tự có sắp xếp thời gian', '(màu bìa) cho mọi phiếu', 'Cột bằng trước rồi thứ tự cần đọc giúp lấy trang đầu theo một người với ít dòng phải xét.', 'composite-index'],
    ['Muốn lọc giá trong một khoảng và sắp tăng dần, cấu trúc cơ bản nào phù hợp?', 'B-tree trên giá', 'Chỉ hash index trên giá', 'Một cache key ngẫu nhiên cho mỗi request', 'DNS round-robin', 'B-tree giữ thứ tự; hash index không cung cấp đường đi theo khoảng giá.', 'btree'],
    ['Tìm sách chứa một từ trong nội dung nên cân nhắc gì?', 'Inverted index theo từ tới tài liệu', 'Chỉ hash toàn bộ đoạn văn rồi so bằng', 'Chỉ tăng số replica mà không đổi cách tìm', 'Chỉ index tọa độ kho sách', 'Tìm từ cần ánh xạ từ tới tài liệu, khác với đối sánh bằng toàn bộ nội dung.', 'specialized-index'],
    ['Thêm sáu index ít được đọc có thể gây hậu quả gì?', 'Tốn không gian và tăng công cập nhật khi ghi', 'Luôn tăng throughput ghi', 'Xóa nhu cầu lưu bảng gốc trong mọi database', 'Bảo đảm mọi truy vấn trở thành O(1)', 'Mỗi cấu trúc phụ liên quan cần được duy trì, nên phải cân bằng lợi ích đọc với chi phí ghi.', 'write-amplification'],
    ['EXPLAIN cho thấy quét tuần tự khi lấy 95% bảng nhỏ. Kết luận đúng?', 'Có thể là lựa chọn hợp lý; đo trước khi ép index', 'Database chắc chắn hỏng', 'Mọi quét tuần tự đều cần sharding', 'Xóa bớt kết quả để ép một câu trả lời nhanh', 'Đọc phần lớn bảng có thể rẻ hơn đi index rồi quay lại nhiều trang dữ liệu.', 'query-plan'],
  ]),
  encounter: encounter('index-worm', 'Sâu Full Scan', 'worm', 'Giả định: thư viện thường lấy 20 phiếu mới nhất của một thành viên; ghi phiếu cũng phải duy trì ổn định.', [
    turn('Chọn đường tìm cho trang phiếu theo thành viên?', 'Truy vấn lọc memberId, sắp createdAt rồi id giảm dần, giới hạn 20.', 'composite-index',
      outcome('Thử composite index theo memberId, createdAt DESC, id DESC', 'Index khớp bộ lọc và thứ tự, giảm latency đọc nhưng tăng công duy trì.', { latency: -5, throughput: 3, complexity: 2 }),
      outcome('Index riêng ghi chú vì cột đó có nhiều chữ nhất', 'Không khớp truy vấn chính mà vẫn phải cập nhật cấu trúc phụ.', { latency: 3, throughput: -3, complexity: 3 }), 'thay index không liên quan bằng index khớp điều kiện và thứ tự'),
    turn('Muốn biết tối ưu có hiệu quả thật không?', 'Có index mới nhưng chưa biết số dòng xét hay ảnh hưởng tới ghi.', 'query-plan',
      outcome('So kế hoạch, số dòng đọc, p95 và throughput ghi trên tải đại diện', 'Bằng chứng tránh giữ đường tìm không có lợi; complexity vận hành được kiểm soát.', { complexity: -3, throughput: 2 }),
      outcome('Chỉ kiểm tra tên index rồi tuyên bố mọi truy vấn nhanh', 'Không phát hiện được kế hoạch kém hoặc ghi chậm; latency rủi ro vẫn tăng.', { latency: 4, complexity: 3 }), 'đo truy vấn và đường ghi bằng tải đại diện'),
    turn('Nhóm đề nghị index mọi cột trước ngày khai trương. Chọn gì?', 'Nhiều cột chỉ là ghi chú, chưa có truy vấn cần chúng.', 'write-amplification',
      outcome('Giữ index có truy vấn chứng minh, đo lại trước khi thêm', 'Ít cấu trúc vô ích giúp throughput ghi và complexity tốt hơn.', { throughput: 4, complexity: -3 }),
      outcome('Thêm mọi index vì index luôn miễn phí khi ghi', 'Ghi phải duy trì nhiều cấu trúc, throughput giảm và complexity tăng.', { throughput: -6, complexity: 5 }), 'loại index không có nhu cầu sau khi kiểm tra mức sử dụng'),
  ], 'Nêu một truy vấn, index phù hợp, và phép đo có thể khiến bạn bỏ index ấy.'),
};

const numbersModule: LearningModule = {
  id: 'numbers', villageId: 'scale', title: 'Numbers to Know', place: 'Đài ước lượng', spirit: 'Nhím Đếm Sao', icon: '🔢', color: '#7397b9', position: [7, 3],
  objectives: ['Tính QPS trung bình, đỉnh và dung lượng', 'Phân biệt latency với throughput', 'Dùng ngân sách và benchmark thay vì số thần kỳ'], prerequisites: ['indexing'], duration: 20,
  source: source('core-concepts/numbers-to-know'),
  sections: [
    section('Đơn vị trước, độ chính xác sau', 'Ước lượng chỉ hữu ích khi đầu vào có đơn vị và kết quả ảnh hưởng quyết định. DAU không phải QPS: cần số thao tác mỗi người rồi chia theo thời gian. Ghi rõ đang dùng byte thập phân hay đơn vị nhị phân. Dung lượng thô chưa bao gồm index, replica, metadata, lịch sử và khoảng trống vận hành.', 'Giả định: 120.000 người hoạt động, mỗi người đọc 36 lần/ngày. Có 4.320.000 lượt đọc/ngày, trung bình 50 request/giây vì một ngày có 86.400 giây. Nếu đỉnh bằng 8 lần trung bình thì cần thử 400 request/giây. Hệ số 8 là giả định của bài, phải thay bằng quan sát thực.', 'Mỗi con số phải ghi nguồn giả định và đơn vị.'),
    section('Năng lực phần cứng cần bối cảnh', 'Máy hiện đại có năng lực rất khác các mốc truyền miệng cũ, nhưng sức chứa tối đa không phải hiệu năng ứng dụng. Cache trong tiến trình tránh một lượt mạng; đọc từ dịch vụ khác thêm truyền tải và xếp hàng; gọi liên vùng thường có chi phí khoảng cách lớn hơn. Thứ bậc này gợi ý chỗ đo, không cung cấp một độ trễ cố định cho mọi hệ thống. p99 là phân vị mà khoảng 99% mẫu có độ trễ không vượt nó; phải nêu cửa sổ đo và cách lấy mẫu, không suy ra p99 từ trung bình.', 'Giả định benchmark của đội: hit mất 3 ms, miss mất 45 ms, hit rate 80%. Trung bình có trọng số là 0,8×3 + 0,2×45 = 11,4 ms. Điều đó không cho biết p99: một phần miss có thể xếp hàng lâu hơn nhiều. Báo cáo phân vị riêng trên tải đỉnh.', 'Dùng mốc để đặt câu hỏi rồi kiểm chứng trên workload thật.'),
    section('Ngân sách cho đường đi và tải đang chờ', 'Latency là thời gian của một thao tác; throughput là số thao tác hoàn thành trên một đơn vị thời gian. Với hệ thống ổn định, Little’s law nối số tác vụ trung bình đang ở trong hệ thống L với tốc độ hoàn thành λ và thời gian W: L=λW. Khi tải tới vượt năng lực, hàng chờ tăng và điều kiện ổn định không còn phù hợp để dự đoán một hàng chờ hữu hạn.', 'Giả định: 400 request/giây hoàn thành, mỗi request trung bình ở hệ thống 0,2 giây, thì có khoảng 80 request đang xử lý hoặc chờ. Đó không phải yêu cầu 80 thread. Nếu request giữ kết nối DB 0,01 giây, số kết nối bận trung bình do phần đó là khoảng 4, trước dự phòng và phân vị đuôi.', 'Tính đại lượng đúng ranh giới rồi để kết quả dẫn tới một phép thử.'),
    section('Tính sức chứa và phần dự phòng', 'Kích thước tập nóng quyết định ngân sách cache; băng thông quyết định tốc độ truyền payload lớn; năng lực phục hồi quyết định dự phòng khi mất máy. Đừng chỉ tính hoạt động bình thường. Ghi rõ dữ liệu đã nén hay chưa và replication factor, rồi tách mức tối thiểu toán học khỏi cấu hình vận hành sẽ thử.', 'Giả định: 2 triệu bản ghi × 800 byte = 1,6 GB thô; ba bản sao là 4,8 GB trước index và metadata. Nếu một máy đo được 100 request/giây ở mục tiêu latency, tải 400 cần ít nhất bốn máy còn sống theo giả định tuyến tính; để chịu mất một máy phải có ít nhất năm, rồi benchmark lại vì scaling có thể không tuyến tính.', 'Dự phòng là một giả định cần kiểm chứng, không phải phần trăm chọn tùy ý.'),
  ],
  quiz: quiz('numbers', [
    ['Giả định 120.000 DAU × 36 lượt đọc/ngày. QPS trung bình là bao nhiêu?', '50 request/giây', '4.320.000 request/giây', '1.200 request/giây', '36 request/giây', '120.000×36÷86.400=50; tổng lượt trong ngày phải chia số giây trong ngày.', 'qps'],
    ['Giả định trung bình 50 QPS, đỉnh gấp 8. Tải đỉnh cần thử?', '400 QPS', '58 QPS', '6,25 QPS', '4.000 QPS', '50×8=400; hệ số đỉnh là giả định workload, không phải hằng số chung.', 'peak-load'],
    ['Giả định 2 triệu bản ghi × 800 byte, ba replica, dùng GB thập phân. Tối thiểu dữ liệu thô?', '4,8 GB, chưa tính index và metadata', '1,6 GB đã gồm cả ba replica', '4,8 MB gồm mọi overhead', '480 GB bắt buộc với mọi schema', '2.000.000×800×3=4.800.000.000 byte; overhead phải ước lượng riêng.', 'storage'],
    ['Hệ ổn định hoàn thành 400 request/s, thời gian trong hệ trung bình 0,2 s. L là?', '80 request trong hệ trung bình', '2.000 thread bắt buộc', '400 kết nối DB bắt buộc', '0,0005 request trong hệ', 'L=λW=80; đây là số request trong ranh giới đo, không trực tiếp là thread hay kết nối.', 'little-law'],
    ['Hit 80% mất 3 ms, miss 20% mất 45 ms. Có thể kết luận gì?', 'Trung bình 11,4 ms; chưa suy ra p99', 'p99 chắc chắn 11,4 ms', 'Trung bình 48 ms vì phải cộng hai đường loại trừ nhau', 'Hit rate cho biết luôn cả throughput tối đa', 'Trung bình có trọng số là 0,8×3+0,2×45; phân vị cần phân bố mẫu thực tế.', 'latency-budget'],
  ]),
  encounter: encounter('numbers-giant', 'Khổng Lồ Overengineering', 'giant', 'Giả định: 120.000 DAU, 36 lượt đọc/ngày/người, đỉnh gấp 8; mỗi máy benchmark được 100 QPS ở mục tiêu độ trễ.', [
    turn('Chọn tải nào cho phép thử mở bán?', 'Một ngày có 86.400 giây; hệ số đỉnh 8 là giả định cần kiểm chứng.', 'qps',
      outcome('Tính 50 QPS trung bình và thử đỉnh 400 QPS', 'Tải đỉnh có cơ sở giúp kiểm tra năng lực trước khi mở bán.', { availability: 4, complexity: -2 }),
      outcome('Dùng 120.000 DAU như 120.000 QPS và cấp máy ngay', 'Nhầm đơn vị đẩy complexity lên mà chưa chứng minh tải thật.', { complexity: 8 }), 'đổi DAU thành lượt mỗi ngày rồi chia giây và áp hệ số đỉnh'),
    turn('Muốn chịu mất một máy ở đỉnh, ngưỡng tối thiểu để thử là bao nhiêu?', 'Giả định tạm thời: năng lực cộng tuyến tính, không có nút nghẽn dùng chung.', 'headroom',
      outcome('Thử ít nhất năm máy để bốn máy còn sống phục vụ 400 QPS', 'Dự phòng một máy tăng availability nhưng thêm complexity; vẫn cần benchmark lại.', { availability: 5, complexity: 3 }),
      outcome('Chỉ bốn máy vì lúc bình thường vừa đủ 400 QPS', 'Mất một máy chỉ còn năng lực giả định 300 QPS, hàng chờ tăng.', { availability: -6, latency: 5 }), 'bổ sung dự phòng lỗi một máy và kiểm chứng nút nghẽn chung'),
    turn('Trung bình phản hồi tốt đã đủ kết luận chưa?', 'Một số khách vẫn báo chờ lâu đúng lúc mở bán.', 'latency-budget',
      outcome('Đo p95/p99, hàng chờ và năng lực từng thành phần ở tải đỉnh', 'Phân vị và hàng chờ làm lộ vùng chậm bị trung bình che khuất.', { latency: -3, complexity: 2 }),
      outcome('Bỏ mẫu chậm để trung bình khớp dự đoán', 'Số báo cáo đẹp không giảm thời gian chờ thực; rủi ro latency và availability còn tăng.', { latency: 5, availability: -4 }), 'khôi phục mẫu chậm và đo phân vị trên toàn bộ tải đại diện'),
  ], 'Trình bày một phép tính có đơn vị, một giả định dễ sai và benchmark sẽ dùng để kiểm chứng.'),
};

const twitterBoss = encounter('twitter-intro', 'Twitter · Người giữ quảng trường', 'golem', 'Giả định thiết kế một Twitter thu nhỏ: đăng bài, theo dõi và đọc bảng tin theo thời gian; 10.000 người dùng. Bảng tin được phép cũ 5 giây, tác giả cần thấy bài vừa đăng. Đây là bài tập nguyên bản, không mô tả kiến trúc Twitter thực.', [
  turn('Chốt lời hứa nào trước khi vẽ?', 'Đội chỉ có một buổi để trình bày hệ thống cơ sở.', 'requirements',
    outcome('Giữ đăng bài, theo dõi, đọc feed và ghi rõ mục tiêu độ mới', 'Phạm vi có thể nghiệm thu, complexity giảm để dành thời gian cho luồng chính.', { complexity: -5 }),
    outcome('Nhận thêm quảng cáo, video trực tiếp và nhắn tin mã hóa', 'Phạm vi vượt buổi thảo luận; complexity tăng trước khi có hệ thống chạy được.', { complexity: 7 }), 'đưa tính năng ngoài ba hành vi chính về phần mở rộng'),
  turn('Thực thể và giao diện nào nối được ba hành vi?', 'Cần định danh tác giả, quan hệ theo dõi và trang feed có giới hạn.', 'entities',
    outcome('User, Post, Follow; POST bài/theo dõi và GET feed phân trang', 'Hợp đồng gắn được với dữ liệu; trạng thái nghiệp vụ rõ hơn.', { consistency: 4, complexity: 1 }),
    outcome('Chỉ một endpoint /doEverything với body tùy ý không mô tả trạng thái', 'Không biết tác vụ nào thay đổi dữ liệu gì; complexity giao tiếp tăng.', { complexity: 5, consistency: -4 }), 'định nghĩa User, Post, Follow và hợp đồng riêng cho từng hành vi'),
  turn('Khi nào nút Đăng được báo thành công?', 'Có thể mất máy ngay sau phản hồi, tác giả còn cần đọc lại bài.', 'end-to-end',
    outcome('Xác thực tác giả, ghi bền Post rồi trả id và nội dung đã ghi', 'Điểm xác nhận có ý nghĩa và tác giả nhìn thấy kết quả, đổi lại latency ghi tăng.', { consistency: 6, latency: 2 }),
    outcome('Trả thành công khi nhận vào bộ nhớ rồi ghi sau không có log bền', 'Lỗi máy làm bài đã xác nhận biến mất, consistency suy giảm.', { consistency: -8, latency: -2 }), 'lưu bền trước xác nhận và đối soát bài đã được nhận'),
  turn('Đọc feed cơ sở ra sao trước khi tối ưu lớn?', 'Giả định mỗi người theo dõi ít tài khoản; chưa có bằng chứng cần fan-out khi ghi.', 'delivery',
    outcome('Lấy người theo dõi, đọc bài mới, hợp theo thời gian và giới hạn trang', 'Một luồng cơ sở hoàn chỉnh đủ để đo; tránh cấu trúc phân phối chưa cần.', { complexity: -3, throughput: 2 }),
    outcome('Trả toàn bộ mọi bài của hệ thống cho client tự lọc', 'Payload tăng không giới hạn, lộ dữ liệu ngoài phạm vi và giảm throughput.', { latency: 6, throughput: -5 }), 'lọc feed phía server theo Follow và giới hạn kích thước trang'),
  turn('Một tác giả nổi tiếng làm feed chậm. Đào sâu và kết thúc thế nào?', 'Cần biết nghẽn ở truy vấn, số người theo dõi hay khâu hợp kết quả.', 'evidence',
    outcome('Đo fan-out, truy vấn và p95; chọn tối ưu theo nút nghẽn rồi nhắc lại giới hạn', 'Phép đo gắn tối ưu với nguyên nhân, kiểm soát complexity trước mở rộng.', { latency: -3, throughput: 3, complexity: 2 }),
    outcome('Thêm mọi công nghệ đã học và cam kết không bao giờ chậm', 'Không có bằng chứng nguyên nhân; complexity tăng mà lời hứa chưa được kiểm chứng.', { complexity: 7, availability: -3 }), 'bỏ cam kết tuyệt đối, đo đường feed và ưu tiên một nút nghẽn'),
], 'Trình bày lại Twitter cơ sở theo yêu cầu → thực thể → API → luồng → đào sâu. Đâu là giả định khiến bạn đổi thiết kế?');
twitterBoss.timeLimitSeconds = 480;

const marketplaceBoss = encounter('marketplace-hydra', 'Hydra Spaghetti Architecture', 'hydra', 'Giả định: marketplace đồ thủ công, mỗi món độc bản, người mua xem trạng thái đơn một chiều và có thể retry vì mạng yếu. Không xử lý thanh toán thật trong bài tập.', [
  turn('Hydra tạo hàng nghìn lượt hỏi trạng thái không đổi. Chọn đường cập nhật?', 'Trình duyệt chỉ nhận trạng thái mới; tạo đơn vẫn là thao tác HTTP riêng.', 'protocol',
    outcome('HTTP cho đơn và SSE có khả năng nối lại cho trạng thái', 'Giảm polling lặp; kênh có hướng phù hợp nhu cầu.', { latency: -3, throughput: 4, complexity: 2 }),
    outcome('Mỗi đơn polling toàn bộ chợ mỗi 100 ms', 'Các truy vấn trùng chiếm năng lực, throughput hữu ích giảm.', { throughput: -6, latency: 4 }), 'gom cập nhật trạng thái thành luồng có điểm nối lại'),
  turn('Một đầu Hydra gửi buyerId của người khác. API tin gì?', 'Phiên đã xác thực nhưng body và orderId có thể bị sửa.', 'authorization',
    outcome('Lấy danh tính từ phiên và kiểm tra quyền trên từng đơn', 'Ngăn truy cập sai chủ, giữ trạng thái nghiệp vụ nhất quán.', { consistency: 6, complexity: 1 }),
    outcome('Tin body vì orderId dài và khó đoán', 'Độ khó đoán không thay thế quyền; đơn có thể bị đọc hoặc sửa bởi sai người.', { consistency: -8 }), 'bắt buộc kiểm tra quyền theo phiên và rà soát đơn bị tác động'),
  turn('Hydra gửi hai bản tạo đơn sau timeout. Giữ một kết quả thế nào?', 'Hai worker có thể nhận cùng lúc; body của retry phải giữ nguyên.', 'idempotency',
    outcome('Khóa theo người mua, kiểm tra hash body, lưu kết quả nguyên tử với đơn', 'Cùng thao tác nhận cùng kết quả, kể cả khi hai worker cạnh tranh.', { consistency: 7, complexity: 3 }),
    outcome('Để từng worker kiểm tra một Set trong RAM riêng', 'Mỗi worker có thể thấy khóa mới, tạo nhiều đơn cho một ý định.', { consistency: -8, latency: -1 }), 'đặt khóa duy nhất và kết quả vào giao dịch dùng chung'),
  turn('Hai người tranh món cuối, chủ hàng đồng thời đổi giá. Mô hình nào giữ lời hứa?', 'Đơn cũ cần giữ giá đã mua và tổng số món bán không vượt tồn.', 'data-modeling',
    outcome('OrderLine lưu giá mua; cập nhật tồn có điều kiện trong giao dịch tạo đơn', 'Snapshot bảo vệ lịch sử, cập nhật nguyên tử quyết định người mua thắng.', { consistency: 7, latency: 2, complexity: 2 }),
    outcome('Đơn luôn nối giá hiện tại và trừ tồn cuối ngày', 'Lịch sử đổi theo giá mới, đồng thời món độc bản có thể được bán nhiều lần.', { consistency: -9, throughput: 2 }), 'khôi phục giá mua và ràng buộc tồn nguyên tử khi tạo đơn'),
  turn('Hydra làm kết nối rơi sau khi đơn đã ghi. UI và mạng phục hồi ra sao?', 'Trạng thái có thể đã tiến tới CONFIRMED dù client chưa nhận sự kiện.', 'retries',
    outcome('Tra đơn theo id/key cũ, nối lại có cursor và retry giới hạn với jitter', 'Đọc lại nguồn chuẩn bù sự kiện lỡ, tránh tạo đơn mới và tải retry dồn.', { availability: 5, consistency: 4, complexity: 2 }),
    outcome('Tạo đơn mới mỗi lần mất kết nối và đánh dấu đơn cũ thất bại ở client', 'Client không biết kết quả commit, nên hành động này có thể nhân đôi ý định mua.', { consistency: -7, availability: -4 }), 'tra kết quả cũ và đồng bộ lại trạng thái trước khi cho thao tác mới'),
], 'Vẽ một lần tạo đơn bị mất phản hồi: danh tính, khóa chống lặp, giao dịch tồn và đường phục hồi trạng thái nằm ở đâu?');

const ticketingBoss = encounter('ticketing-titan', 'Titan Quy Mô', 'titan', 'Giả định: mở bán sân khấu 400 QPS đỉnh; mô tả được phép cũ 30 giây, mỗi ghế chỉ có một chủ. Các con số là workload diễn tập, không phải benchmark Ticketmaster.', [
  turn('Titan kéo đám đông tới xem cùng mô tả sự kiện. Chặn nghẽn thế nào?', 'Nội dung mô tả lặp lại; quyết định giữ ghế phải dùng tồn chuẩn.', 'caching',
    outcome('Cache mô tả với TTL, single-flight khi miss; giữ ghế qua kho chuẩn', 'Giảm công đọc lặp mà không giao quyền bán cho cache.', { latency: -5, throughput: 5, complexity: 2 }),
    outcome('Cache cả quyết định còn ghế và xác nhận mua từ bản sao', 'Bản sao hiển thị không giải quyết hai người tranh một ghế.', { consistency: -9, latency: -3 }), 'đưa xác nhận giữ ghế về nguồn chuẩn và chỉ cache dữ liệu đọc phù hợp'),
  turn('Kho ghi cần chia; một sự kiện đặc biệt nóng. Chọn ranh giới nào?', 'Ghế trong cùng sự kiện có nhiều khu; truy vấn giữ ghế mang cả eventId, sectionId, seatId.', 'sharding',
    outcome('Thử chia theo eventId và sectionId, giữ một ghế ở một chủ, dùng vòng có phiên bản khi tăng máy', 'Khu chia tải của sự kiện lớn; vòng giảm xáo trộn khi thêm máy, vẫn cần bàn giao dữ liệu.', { throughput: 5, complexity: 4 }),
    outcome('Chia chỉ theo ngày mở bán rồi đổi modulo số máy ngay khi nóng', 'Ghi mới dồn vào ngày hiện tại và nhiều địa chỉ đổi trước khi dữ liệu theo kịp.', { throughput: -5, availability: -6, complexity: 3 }), 'chọn khóa tránh dồn ngày mở bán và bàn giao các khoảng trước đổi định tuyến'),
  turn('Tìm ghế trống trong một khu đang quét quá nhiều dòng. Tối ưu nào cần kiểm chứng?', 'Truy vấn lọc eventId, sectionId, status rồi sắp seatId; status thay đổi khi giữ ghế.', 'indexing',
    outcome('Thử index theo eventId, sectionId, status, seatId và đo cả cập nhật status', 'Giảm đường đọc nhưng mỗi đổi trạng thái phải duy trì index; cần đo đánh đổi ghi.', { latency: -4, throughput: 2, complexity: 2 }),
    outcome('Thêm hash index trên giá và mặc định truy vấn ghế đã nhanh', 'Index không khớp điều kiện chính; vẫn chịu chi phí cập nhật không có lợi ích tương ứng.', { latency: 4, throughput: -3, complexity: 3 }), 'đổi sang index khớp truy vấn và kiểm tra kế hoạch cùng chi phí ghi'),
  turn('Partition chia hai vùng đúng lúc giữ ghế cuối. Chính sách nào giữ đúng hợp đồng?', 'Không có tồn ghế cấp riêng cho từng vùng; phải có một xác nhận duy nhất.', 'cap',
    outcome('Chỉ phía có thẩm quyền ghi giữ ghế nguyên tử; phía kia vẫn đọc mô tả cũ', 'Từ chối một số lần mua để giữ consistency, trong khi đường giới thiệu còn phục vụ.', { consistency: 7, availability: -3, complexity: 2 }),
    outcome('Cả hai vùng xác nhận giữ cùng ghế rồi chọn người thắng ngày mai', 'Hai khách đã nhận lời hứa không thể cùng thực hiện, consistency sụt giảm.', { consistency: -9, availability: 3 }), 'dừng xác nhận ở phía không có quyền ghi và đối soát ghế bị hứa trùng'),
  turn('Mỗi máy đo được 100 QPS ở mục tiêu latency. Mở bán 400 QPS và chịu mất một máy?', 'Giả định cộng tuyến tính chỉ là mốc khởi đầu; cache miss, index và partition đều có thể đổi năng lực thực.', 'numbers',
    outcome('Thử ít nhất năm máy, gây lỗi một máy, đo p99, queue và số giữ ghế trùng', 'Bài thử kiểm chứng cả tải và bất biến; dự phòng tăng availability với chi phí vận hành.', { availability: 5, complexity: 3, consistency: 3 }),
    outcome('Dùng bốn máy và chỉ báo cáo latency trung bình lúc ít khách', 'Không có dư địa mất máy và không thấy đuôi chậm giờ đỉnh, rủi ro lỗi tăng.', { availability: -6, latency: 5 }), 'bổ sung dư địa lỗi và chạy tải đỉnh có kiểm tra bất biến giữ ghế'),
], 'Bảo vệ thiết kế trước Titan: cache gì, chia theo gì, vòng băm chuyển dữ liệu ra sao, index nào, khi nào từ chối và phép tính tải nào cần kiểm chứng?');

export const curriculum: Curriculum = {
  version: 2,
  villages: [
    { id: 'departure', title: 'Làng Khởi Hành', subtitle: 'Hiểu đề · Dẫn dắt thiết kế', description: 'Quanh bếp chung, học cách biến yêu cầu mơ hồ thành một hệ thống cơ sở có thể giải thích và kiểm chứng. Hoàn tất hai bài rồi bảo vệ quảng trường Twitter.', color: '#d8a568', biome: 'meadow', moduleIds: ['intro', 'delivery'], boss: twitterBoss },
    { id: 'signals', title: 'Làng Tín Hiệu', subtitle: 'Kết nối · Giao diện · Dữ liệu', description: 'Theo một yêu cầu từ bến mạng qua cổng giao ước tới xưởng bản ghi. Ba người bạn giúp bạn giữ lời hứa với khách trước Hydra của chợ.', color: '#69a6b8', biome: 'coast', moduleIds: ['networking', 'api', 'data-modeling'], boss: marketplaceBoss },
    { id: 'scale', title: 'Làng Quy Mô', subtitle: 'Phân phối · Đánh đổi · Đo lường', description: 'Đi qua sáu trạm cao nguyên để giảm tải đọc, chia quyền sở hữu dữ liệu, đối mặt phân vùng và tính năng lực có giả định. Titan thử toàn bộ thiết kế cổng vé.', color: '#9d96ba', biome: 'highlands', moduleIds: ['caching', 'sharding', 'hashing', 'cap', 'indexing', 'numbers'], boss: ticketingBoss },
  ],
  modules: [introModule, deliveryModule, networkingModule, apiModule, dataModule, cachingModule, shardingModule, hashingModule, capModule, indexingModule, numbersModule],
};
export const modules = curriculum.modules;
export const villages = curriculum.villages;
export function moduleById(id: string): LearningModule {
  const found = modules.find(module => module.id === id);
  if (!found) throw new Error(`Unknown learning module: ${id}`);
  return found;
}
export function villageById(id: string): Village {
  const found = villages.find(village => village.id === id);
  if (!found) throw new Error(`Unknown village: ${id}`);
  return found;
}
