import type { RawPrompt } from "./types";

export const WRITING_B2_REPLY: RawPrompt[] = [
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "민준 씨, 다음 분기에 새로운 해외 지사 프로젝트가 생겼는데 민준 씨가 맡아 주셨으면 합니다. 지금 진행 중인 업무량을 고려하더라도 가능하실지 의견 부탁드립니다.",
    stimulus_en:
      "Min-jun, we have a new overseas branch project starting next quarter, and I'd like you to take it on. Please let me know if it's feasible given your current workload.",
    prompt_kr:
      "업무량이 많은 상황에서 새 프로젝트를 맡아 달라는 팀장님의 요청에 답하는 답장을 여섯 문장 이상 써 보세요. '-기 마련이다'와 '-을 수밖에 없다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to your manager's request to take on a new project despite a heavy workload. Use the grammar patterns '-기 마련이다' and '-을 수밖에 없다'.",
    example_kr:
      "팀장님, 좋은 기회를 주셔서 감사합니다. 다만 지금 맡고 있는 업무만으로도 일정이 빠듯한 상황이라 솔직히 말씀드리면 조금 부담스럽습니다. 새로운 프로젝트를 그대로 병행하면 기존 업무의 품질이 떨어질 수밖에 없을 것 같아 걱정이 됩니다. 사람이 감당할 수 있는 업무량에는 한계가 있기 마련이라 무리하게 맡았다가 둘 다 놓치는 것보다는 신중하게 접근하고 싶습니다. 혹시 기존 업무 중 일부를 다른 팀원에게 분담할 수 있다면 새 프로젝트를 맡아 볼 수 있을 것 같습니다. 그렇지 않다면 시작 시점을 한 달 정도 미뤄 주실 수 있을까요? 팀장님과 함께 현실적인 일정을 논의하고 싶습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 저희 쪽 사정으로 원래 3주였던 로고 디자인 작업을 일주일 안에 끝내 주셨으면 합니다. 급하게 부탁드려서 죄송하지만 가능하실까요?",
    stimulus_en:
      "Hello, due to circumstances on our end, we need the logo design that was originally scheduled for 3 weeks to be finished within one week. Sorry for the short notice, but would that be possible?",
    prompt_kr:
      "일정을 대폭 앞당겨 달라는 클라이언트의 요청에 추가 비용을 언급하며 답하는 답장을 여섯 문장 이상 써 보세요. '-을 뿐만 아니라'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a client's request to drastically shorten the deadline, mentioning an additional fee. Use the grammar pattern '-을 뿐만 아니라'.",
    example_kr:
      "안녕하세요, 연락 주셔서 감사합니다. 말씀하신 일정은 물리적으로 가능하기는 하지만 다른 작업 일정을 모두 조정해야 할 뿐만 아니라 저녁과 주말까지 작업해야 맞출 수 있는 상황입니다. 급행 작업은 완성도를 유지하기 위해 신경을 훨씬 더 많이 써야 할 뿐만 아니라 시안 검토 시간도 줄어들 수밖에 없습니다. 그래서 죄송하지만 기존 견적에 40퍼센트의 급행 비용을 추가로 요청드리고 싶습니다. 대신 매일 진행 상황을 공유해 드릴 뿐만 아니라 최우선으로 이 작업만 진행하겠습니다. 급행 비용이 부담스러우시다면 시안 수 자체를 줄이는 방법도 고려해 볼 수 있습니다. 편하신 방향으로 말씀해 주시면 바로 시작하겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "직원 여러분, 다음 달부터 출퇴근 시간을 지문 인식기로 기록하는 새로운 근태 관리 정책이 시행됩니다. 의견이 있으신 분은 이번 주까지 회신해 주시기 바랍니다.",
    stimulus_en:
      "All staff, starting next month a new attendance policy using fingerprint scanners will be implemented to track clock-in and clock-out times. If you have any feedback, please reply by the end of this week.",
    prompt_kr:
      "새로운 근태 관리 정책 공지에 우려를 전하는 답장을 여섯 문장 이상 써 보세요. '-는 반면에'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a company-wide notice about a new fingerprint-based attendance policy, expressing concern. Use the grammar pattern '-는 반면에'.",
    example_kr:
      "안내해 주셔서 감사합니다. 정확한 근태 기록은 관리 측면에서 효율적인 반면에 개인 생체 정보를 수집하는 부분에 대해서는 우려가 됩니다. 지문 정보가 어디에 어떻게 저장되고 관리되는지 명확히 안내해 주시면 좋겠습니다. 시스템 도입은 부정 출퇴근을 줄이는 데 도움이 되는 반면에 유연근무를 하는 직원들에게는 오히려 불편을 줄 수도 있습니다. 특히 재택근무일에는 지문 인식이 불가능하니 별도의 예외 규정이 필요할 것 같습니다. 정책 취지에는 공감하는 반면에 시행 전에 직원들의 의견을 조금 더 반영해 주셨으면 합니다. 관련해서 설명회를 한번 열어 주실 수 있을까요?",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "세입자님, 계약 갱신 시점이 다가와 안내드립니다. 주변 시세 상승을 반영해서 다음 계약부터는 월세를 15만 원 인상하려고 합니다.",
    stimulus_en:
      "Dear tenant, as your lease renewal date approaches, please note that we plan to raise the monthly rent by 150,000 won starting next term, reflecting rising rents in the area.",
    prompt_kr:
      "월세 인상을 통보한 집주인에게 협상하는 답장을 여섯 문장 이상 써 보세요. '-에 비해'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply negotiating with a landlord who announced a rent increase. Use the grammar pattern '-에 비해'.",
    example_kr:
      "안녕하세요, 미리 알려 주셔서 감사합니다. 다만 인상 폭이 조금 크게 느껴져서 말씀드리고 싶습니다. 저희 집은 다른 세대에 비해 채광이 부족하고 엘리베이터에서도 먼 편이라 시세를 그대로 적용하기에는 무리가 있는 것 같습니다. 또한 지난 2년간 임대료를 한 번도 올리지 않으셨던 것에 비해 이번 인상 폭이 다소 급작스럽게 느껴집니다. 저는 지금까지 월세를 밀린 적 없이 성실히 납부해 왔으니 이 점도 참고해 주시면 좋겠습니다. 혹시 인상 폭을 10만 원 정도로 조정해 주실 수 있을까요? 좋은 방향으로 다시 논의할 수 있으면 좋겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 퇴거하신 방을 확인해 보니 벽지 훼손과 바닥 스크래치가 있어서 보증금에서 수리비 80만 원을 제외하고 돌려드리려고 합니다.",
    stimulus_en:
      "Hello, after inspecting the room you vacated, we found damaged wallpaper and scratches on the floor, so we plan to deduct 800,000 won for repairs from your deposit before returning it.",
    prompt_kr:
      "보증금에서 수리비를 공제하겠다는 집주인의 통보에 이의를 제기하는 답장을 여섯 문장 이상 써 보세요. '-을 리가 없다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply challenging a landlord's notice of deducting repair costs from your deposit. Use the grammar pattern '-을 리가 없다'.",
    example_kr:
      "안녕하세요, 연락 주셔서 감사합니다만 말씀하신 금액에는 동의하기 어렵습니다. 저는 3년 동안 지내면서 벽에 못 하나 박은 적이 없는데 벽지가 그렇게 심하게 훼손되었을 리가 없습니다. 입주 당시 사진을 확인해 보니 바닥 스크래치도 이미 그때부터 있었던 것으로 보입니다. 정상적인 생활에서 생긴 자연스러운 마모까지 전부 저에게 청구하실 리가 없다고 생각합니다. 정확한 원인 파악을 위해 입주 시 계약서에 첨부된 사진을 다시 보내 드리고 싶습니다. 혹시 필요하시면 제3의 전문가에게 함께 확인을 받아도 좋을 것 같습니다. 원만하게 해결할 수 있기를 바랍니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "고객님, 최근 구매하신 무선 청소기의 배터리가 하루 만에 방전된다는 문의를 접수했습니다. 어떤 해결을 원하시는지 알려 주시겠어요?",
    stimulus_en:
      "Dear customer, we've received your inquiry that the cordless vacuum you recently purchased loses its battery charge within a day. Could you tell us how you'd like this resolved?",
    prompt_kr:
      "제품 불량에 대해 회사가 문의한 메시지에 원하는 해결책을 밝히는 고객의 답장을 여섯 문장 이상 써 보세요. '-다고 보다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence customer reply specifying the desired resolution after the company asked about a defective product. Use the grammar pattern '-다고 보다'.",
    example_kr:
      "문의해 주셔서 감사합니다. 구매한 지 한 달도 안 됐는데 이 정도로 배터리가 빨리 닳는 것은 단순한 사용상의 문제가 아니라고 봅니다. 설명서대로 충전하고 사용했는데도 같은 증상이 반복되니 제품 자체의 결함이라고 볼 수밖에 없습니다. 단순 수리로는 근본 원인이 해결되지 않을 것 같다고 보기 때문에 새 제품으로 교환해 주셨으면 합니다. 만약 교환이 어렵다면 전액 환불도 검토해 주시면 좋겠습니다. 저는 이 브랜드를 오래 신뢰해 왔기 때문에 이번 일이 그저 한 번의 실수라고 보고 싶습니다. 빠른 시일 내에 처리해 주시면 감사하겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "고객님, 주문하신 상품이 물류센터 사정으로 예정보다 5일 늦게 도착할 예정입니다. 불편을 드려 죄송하며 양해 부탁드립니다.",
    stimulus_en:
      "Dear customer, due to warehouse issues, your order will arrive 5 days later than scheduled. We apologize for the inconvenience and ask for your understanding.",
    prompt_kr:
      "배송 지연 안내에 환불을 요청하는 고객의 답장을 여섯 문장 이상 써 보세요. '는 탓에'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence customer reply demanding a refund after a shipping delay notice. Use the grammar pattern '-는 탓에'.",
    example_kr:
      "안내해 주셔서 감사하지만 사실 많이 당황스럽습니다. 이 상품은 다음 주 지인의 결혼식 선물로 쓰려고 주문한 것인데 배송이 늦어지는 탓에 일정을 전혀 맞출 수 없게 되었습니다. 사이트에는 분명히 3일 이내 배송이라고 안내되어 있었는데 그 문구만 믿은 탓에 다른 대안을 준비하지 못했습니다. 이렇게 갑자기 일정이 바뀌는 탓에 급하게 다른 선물을 새로 구매해야 하는 상황입니다. 이런 이유로 이번 주문은 취소하고 전액 환불을 요청드리고 싶습니다. 앞으로는 재고 상황을 미리 정확히 안내해 주시면 좋겠습니다. 빠른 처리 부탁드립니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "선생님, 다음 달 학회 발표가 시설 문제로 일주일 뒤로 연기되었습니다. 변경된 일정에 참석 가능하신지 회신 부탁드립니다.",
    stimulus_en:
      "Dear speaker, next month's conference presentation has been postponed by one week due to facility issues. Please let us know if you're available for the new date.",
    prompt_kr:
      "학회 일정 연기 안내에 다른 일정과의 충돌을 언급하며 답하는 발표자의 답장을 여섯 문장 이상 써 보세요. '-는 편이 낫다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply from a speaker responding to a conference postponement notice, mentioning a scheduling conflict. Use the grammar pattern '-는 편이 낫다'.",
    example_kr:
      "안내해 주셔서 감사합니다. 그런데 변경된 날짜에는 이미 다른 지역 강연이 잡혀 있어서 두 일정을 동시에 소화하기는 어려울 것 같습니다. 무리해서 두 곳을 오가느니 한쪽 일정을 확실히 지키는 편이 낫다고 판단됩니다. 혹시 하루 정도 더 조정이 가능하다면 두 일정을 모두 소화할 수 있을 것 같습니다. 조정이 어렵다면 아쉽지만 이번에는 화상으로 참여하는 편이 나을 것 같습니다. 발표 자료는 미리 준비해서 보내 드리겠습니다. 최선의 방법을 함께 찾을 수 있으면 좋겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 저번에 부탁드린 웹사이트 작업에 추가로 결제 시스템 연동도 함께 넣어 주실 수 있을까요? 예산은 그대로 유지하고 싶습니다.",
    stimulus_en:
      "Hello, could you also add payment system integration to the website work I requested before? I'd like to keep the budget the same.",
    prompt_kr:
      "예산 변경 없이 작업 범위를 넓혀 달라는 클라이언트의 요청에 답하는 프리랜서의 답장을 여섯 문장 이상 써 보세요. '-을 수밖에 없다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence freelancer reply to a client's request to expand the scope of work without changing the budget. Use the grammar pattern '-을 수밖에 없다'.",
    example_kr:
      "안녕하세요, 프로젝트에 만족해 주셔서 감사합니다. 다만 결제 시스템 연동은 원래 견적에 포함되지 않았던 작업이라 별도로 논의가 필요할 수밖에 없을 것 같습니다. 결제 시스템은 보안 검증과 테스트 과정이 추가로 필요해서 작업 시간도 상당히 늘어날 수밖에 없습니다. 기존 예산 안에서 진행하면 다른 부분의 품질을 낮출 수밖에 없어서 결과적으로 좋은 결과물을 드리기 어려울 것 같습니다. 그래서 결제 시스템 연동에 대해 별도 견적서를 보내 드리고 싶습니다. 예산이 정해져 있으시다면 우선순위를 정해서 단계적으로 진행하는 방법도 가능합니다. 편하신 방향을 알려 주시면 바로 조율하겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "언니, 나 정말 이혼을 진지하게 고민하고 있어. 남편이랑 몇 년째 대화가 안 통해서 너무 지쳤어. 어떻게 생각해?",
    stimulus_en:
      "Sis, I'm seriously considering divorce. My husband and I haven't been able to communicate for years and I'm exhausted. What do you think?",
    prompt_kr:
      "이혼을 고민하는 동생에게 신중하게 조언하는 답장을 여섯 문장 이상 써 보세요. '-을망정'을 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply carefully advising a sibling who is considering divorce. Use the grammar pattern '-을망정'.",
    example_kr:
      "그동안 얼마나 힘들었을지 짐작조차 안 된다, 솔직하게 얘기해 줘서 정말 고마워. 힘든 얘기일망정 먼저 상담사와 함께 이야기를 정리해 보는 게 어떨까 싶어. 후회할망정 지금 성급하게 결정하는 것보다는 한 번쯤 냉정하게 상황을 짚어 보는 편이 나을 것 같아. 물론 관계가 회복 불가능하다고 판단되면 억지로 참을망정 참지는 않았으면 좋겠어. 어떤 선택을 하든 내가 무조건 네 편이라는 것만 알아줬으면 해. 혼자 짊어지지 말고 힘들 때마다 나한테 전화해. 언제든 옆에 있을게.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "저기, 옆집인데요. 매일 저녁마다 강아지 짖는 소리가 너무 커서 잠을 설칠 정도예요. 조금 신경 써 주실 수 있을까요?",
    stimulus_en:
      "Hi, this is your next-door neighbor. Your dog barks so loudly every evening that I'm having trouble sleeping. Could you please look into it?",
    prompt_kr:
      "반려견 소음에 대한 이웃의 불만에 사과하며 대책을 제시하는 답장을 여섯 문장 이상 써 보세요. '-는 통에'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply apologizing to a neighbor about a dog barking complaint and proposing a solution. Use the grammar pattern '-는 통에'.",
    example_kr:
      "말씀해 주셔서 감사합니다, 불편을 드려서 정말 죄송합니다. 요즘 이사한 지 얼마 안 돼서 강아지가 낯선 환경에 적응하는 통에 평소보다 많이 짖었던 것 같습니다. 저녁마다 제가 늦게 퇴근하는 통에 강아지가 혼자 있는 시간이 길어진 것도 원인인 것 같습니다. 이번 주부터는 훈련사와 상담해서 짖는 습관을 줄여 보려고 합니다. 또 방음 매트도 추가로 설치해서 소음이 벽을 타고 넘어가지 않도록 조치하겠습니다. 그래도 계속 불편하시면 언제든 바로 알려 주시면 감사하겠습니다. 다시 한번 죄송합니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "고객님, 접수하신 화재보험 청구 건과 관련하여 손상 부위 사진과 수리 견적서를 추가로 제출해 주셔야 심사가 가능합니다.",
    stimulus_en:
      "Dear customer, regarding your fire insurance claim, we need additional photos of the damage and a repair estimate before we can proceed with the review.",
    prompt_kr:
      "보험 청구에 추가 서류를 요청한 보험사에 답하는 답장을 여섯 문장 이상 써 보세요. '-느니 차라리'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to an insurance company requesting additional documents for a claim. Use the grammar pattern '-느니 차라리'.",
    example_kr:
      "안내해 주셔서 감사합니다. 필요한 자료를 최대한 빨리 준비해서 보내 드리겠습니다. 다만 손상된 부위가 넓어서 사진만으로는 정확히 전달되지 않을 것 같아 걱정입니다. 사진만 여러 장 보내느니 차라리 담당자분께서 직접 방문해서 확인해 주시면 더 정확할 것 같습니다. 수리 견적도 한 업체에만 맡기느니 차라리 두세 곳에서 받아서 함께 첨부하는 것이 신뢰도를 높일 수 있을 것 같습니다. 필요한 서류는 이번 주 안으로 모두 제출하겠습니다. 심사가 원활히 진행될 수 있도록 협조하겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "고객님 계좌에서 해외 온라인 사이트로 결제된 89,000원 건이 확인되어 연락드립니다. 본인이 결제하신 것이 맞는지 확인 부탁드립니다.",
    stimulus_en:
      "We're contacting you regarding a 89,000-won charge to an overseas online site from your account. Could you confirm whether you made this purchase yourself?",
    prompt_kr:
      "의심스러운 해외 결제에 대해 문의한 은행에 답하는 답장을 여섯 문장 이상 써 보세요. '-을 따름이다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a bank inquiring about a suspicious overseas charge. Use the grammar pattern '-을 따름이다'.",
    example_kr:
      "연락 주셔서 감사합니다. 확인해 보니 저는 그 사이트를 이용한 기억이 전혀 없어서 당황스러울 따름입니다. 최근 해외 사이트에서 물건을 구매한 적도 없고 그런 결제를 승인한 적도 없어서 답답할 따름입니다. 이 결제가 정말 저와 무관한 것이라면 카드 정보가 유출되었을 가능성이 걱정될 따름입니다. 우선 해당 카드는 즉시 정지해 주시고 새 카드를 발급받고 싶습니다. 부정 사용으로 확인된다면 관련 절차에 따라 전액 취소를 요청드리고 싶습니다. 빠른 확인 부탁드립니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "세입자님, 계약 만료가 두 달 남은 시점에서 안내드립니다. 저희 사정으로 이번 계약은 갱신하지 않으려고 합니다. 양해 부탁드립니다.",
    stimulus_en:
      "Dear tenant, this is to inform you that as your lease expiration approaches in two months, we won't be renewing the contract due to circumstances on our end. Thank you for your understanding.",
    prompt_kr:
      "계약 갱신 거절 통보에 재고를 요청하는 세입자의 답장을 여섯 문장 이상 써 보세요. '-는 데 그치다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence tenant reply asking a landlord to reconsider a lease non-renewal notice. Use the grammar pattern '-는 데 그치다'.",
    example_kr:
      "안내해 주셔서 감사합니다만 갑작스러운 통보라 많이 당황스럽습니다. 계약서상으로는 통보 기간이 한 달인데 이번 안내가 그 기준을 겨우 지키는 데 그쳐서 이사 준비 시간이 매우 촉박합니다. 저는 3년 동안 이곳에서 지내며 큰 문제 없이 지내 왔는데 단순히 사정이라는 말로만 설명하시는 데 그쳐서 이유가 궁금합니다. 혹시 구체적인 사정을 조금 더 말씀해 주실 수 있을까요? 사정이 정말 불가피하다면 이해하겠지만 단순한 임대료 인상이 목적인 데 그치는 것이라면 다시 논의하고 싶습니다. 가능하시다면 이번 주 중으로 통화나 만남으로 자세히 이야기 나눌 수 있을까요? 답변 기다리겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "지은 씨, 이번 분기 성과 평가에서 목표 달성률이 예상보다 낮게 나왔습니다. 다음 면담에서 개선 방안을 함께 논의했으면 합니다.",
    stimulus_en:
      "Ji-eun, your goal achievement rate came in lower than expected in this quarter's performance review. I'd like to discuss improvement plans together at our next meeting.",
    prompt_kr:
      "낮은 성과 평가 결과를 전달받은 직원이 상황을 설명하며 답하는 답장을 여섯 문장 이상 써 보세요. '-는 이상'을 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence employee reply to a manager's low performance-review feedback, explaining the circumstances. Use the grammar pattern '-는 이상'.",
    example_kr:
      "팀장님, 솔직한 평가 감사드립니다. 결과가 낮게 나온 이상 변명보다는 원인부터 정확히 짚어 보고 싶습니다. 다만 이번 분기에 팀원 두 명이 퇴사한 이상 제가 맡은 업무량이 평소보다 훨씬 늘어난 상황이었다는 점은 참고해 주시면 좋겠습니다. 그래도 결과로 이야기해야 하는 이상 핑계로 남기고 싶지는 않습니다. 다음 분기에는 업무 우선순위를 다시 정리해서 목표를 반드시 달성하도록 하겠습니다. 면담 전에 개선 계획을 미리 정리해서 보내 드려도 될까요? 좋은 방향으로 다시 시작하고 싶습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "지호 씨, 지난번 발표 자료에서 제가 정리한 부분이 지호 씨 이름으로만 소개된 것 같아서 조금 서운했습니다. 다음부터는 신경 써 주시면 좋겠습니다.",
    stimulus_en:
      "Ji-ho, I felt a bit hurt that the part I prepared in the last presentation was credited only under your name. I'd appreciate more care about this going forward.",
    prompt_kr:
      "공동 작업 크레딧 문제로 서운함을 표현한 동료에게 답하는 답장을 여섯 문장 이상 써 보세요. '-을 리가 없다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a coworker who expressed hurt over not being credited for shared work. Use the grammar pattern '-을 리가 없다'.",
    example_kr:
      "말씀해 주셔서 감사합니다, 그리고 정말 죄송합니다. 제가 서연 씨의 노력을 모르고 일부러 빠뜨렸을 리가 없는데 결과적으로 그렇게 보였다면 전적으로 제 실수입니다. 발표 자료를 급하게 정리하다가 이름을 빠뜨린 것뿐이지 절대 의도적으로 그랬을 리가 없습니다. 서연 씨가 담당한 부분이 없었다면 발표 자체가 완성될 리가 없었다는 것을 저도 잘 알고 있습니다. 다음 자료에는 반드시 서연 씨 이름을 함께 명시하고 팀장님께도 별도로 정정 메일을 보내겠습니다. 앞으로는 작업 시작 전에 크레딧 표기를 먼저 확인하도록 하겠습니다. 불편하게 해 드려서 다시 한번 죄송합니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "현우 씨, 말씀하신 퇴사 의사를 잘 전달받았습니다. 회사에서는 아쉽지만 결정을 존중하겠습니다. 인수인계 일정을 함께 정해 보시죠.",
    stimulus_en:
      "Hyun-woo, I've received your resignation notice. The company is sorry to see you go, but we'll respect your decision. Let's work out a handover schedule together.",
    prompt_kr:
      "퇴사 의사를 수용한 상사의 메일에 감사와 향후 계획을 전하는 답장을 여섯 문장 이상 써 보세요. '-는 데 반해'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply expressing gratitude and future plans after a manager accepted your resignation notice. Use the grammar pattern '-는 데 반해'.",
    example_kr:
      "부장님, 존중해 주셔서 감사합니다. 새로운 도전에 대한 기대가 큰 데 반해 정든 팀을 떠난다는 아쉬움도 그만큼 큽니다. 이곳에서 배운 것들이 앞으로의 커리어에 큰 자산이 될 것이라는 확신이 드는 데 반해 이 팀만큼 편안한 곳을 다시 만날 수 있을지는 모르겠습니다. 인수인계는 남은 3주 동안 꼼꼼히 진행하고 싶습니다. 제가 맡았던 업무 중 급한 것은 문서로 정리해서 공유하는 데 반해 시간이 걸리는 부분은 직접 설명해 드리려고 합니다. 후임자가 정해지면 최대한 빨리 인계 일정을 잡아 주시면 좋겠습니다. 그동안 정말 감사했습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "예린 씨, 검토해 보니 요청하신 연봉 인상은 이번에 8퍼센트까지만 가능할 것 같습니다. 처음 말씀하신 15퍼센트는 어렵겠습니다.",
    stimulus_en:
      "Ye-rin, after review, we can only offer an 8% raise this time, not the 15% you originally requested.",
    prompt_kr:
      "연봉 인상 요청에 대한 회사의 역제안에 재협상하는 직원의 답장을 여섯 문장 이상 써 보세요. '-는 만큼'을 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence employee reply renegotiating after the company's counter-offer on a raise request. Use the grammar pattern '-는 만큼'.",
    example_kr:
      "검토해 주셔서 감사합니다. 다만 지난 일 년간 담당 업무의 범위가 크게 늘어난 만큼 8퍼센트로는 조금 아쉽다는 생각이 듭니다. 올해 제가 진행한 프로젝트가 매출에 직접적으로 기여한 만큼 그 성과를 반영해 주시면 좋겠습니다. 시장 평균 인상률을 살펴본 만큼 최소 12퍼센트 정도는 합리적인 수준이라고 생각합니다. 물론 회사 사정도 있는 만큼 한 번에 모든 것을 반영해 달라는 것은 아닙니다. 혹시 이번에 10퍼센트로 조정하고 남은 부분은 상반기 성과에 따라 추가로 검토해 주실 수 있을까요? 다시 논의할 자리를 마련해 주시면 감사하겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "고객님, 지난달 전기 요금이 평소보다 크게 늘어난 것으로 확인되어 안내드립니다. 사용량 증가로 인해 정상 청구된 금액입니다.",
    stimulus_en:
      "Dear customer, we noticed your electricity bill increased significantly last month. This is confirmed as a normal charge reflecting increased usage.",
    prompt_kr:
      "요금 과다 청구에 이의를 제기하는 답장을 여섯 문장 이상 써 보세요. '는 김에'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply disputing an unusually high utility bill. Use the grammar pattern '-는 김에'.",
    example_kr:
      "안내해 주셔서 감사합니다만 청구 금액이 너무 높아서 이의를 제기하고 싶습니다. 지난달에는 오히려 두 주 정도 집을 비웠는데 사용량이 평소보다 두 배 가까이 늘어난 것은 이해가 되지 않습니다. 요금을 확인하는 김에 계량기 오작동 여부도 함께 점검해 주셨으면 합니다. 최근 이웃집도 비슷한 문제를 겪었다고 들었는데 이참에 전체 계량기 상태를 점검하는 김에 저희 집도 살펴봐 주시면 좋겠습니다. 만약 계량기 문제가 아니라면 사용 내역을 시간대별로 상세히 받아 보고 싶습니다. 확인 후 결과를 알려 주시면 감사하겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 신청하신 도로 점용 허가와 관련하여 건물 도면과 인접 상가 동의서가 추가로 필요합니다. 이번 주 안으로 제출해 주시기 바랍니다.",
    stimulus_en:
      "Hello, regarding your road occupancy permit application, we additionally need the building plans and consent forms from neighboring shops. Please submit them by the end of this week.",
    prompt_kr:
      "허가 신청에 추가 서류를 요청한 구청 담당자에게 어려움을 전하는 답장을 여섯 문장 이상 써 보세요. '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a city office worker who requested extra documents for a permit application, explaining a difficulty. Use the grammar pattern '-을 정도로'.",
    example_kr:
      "안내해 주셔서 감사합니다. 다만 이번 주 안으로 모든 서류를 준비하기에는 시간이 빠듯할 정도로 일정이 촉박합니다. 인접 상가 세 곳의 동의서를 모두 받으려면 각 사장님과 개별적으로 약속을 잡아야 할 정도로 시간이 걸리는 상황입니다. 건물 도면은 이미 준비되어 있어서 바로 제출이 가능할 정도로 문제가 없습니다. 다만 동의서 부분만큼은 열흘 정도 시간을 더 주시면 정확하게 준비할 수 있을 정도로 여유가 생길 것 같습니다. 기한 연장이 어려우시다면 준비된 서류부터 우선 제출하고 나머지를 추후 제출해도 될까요? 협조해 주시면 감사하겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "입주민 여러분, 다음 달부터 베란다 확장 공사를 원하시는 세대는 관리사무소에 사전 승인을 받으셔야 합니다. 미승인 공사는 원상 복구를 요청드립니다.",
    stimulus_en:
      "Residents, starting next month, any unit wanting to expand their balcony must obtain prior approval from the management office. Unapproved construction will be required to be restored to its original state.",
    prompt_kr:
      "베란다 확장 공사 규정 공지에 문의하는 입주민의 답장을 여섯 문장 이상 써 보세요. '-는 반면에'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence resident reply inquiring about a balcony-renovation approval notice. Use the grammar pattern '-는 반면에'.",
    example_kr:
      "안내해 주셔서 감사합니다. 새로운 규정에는 대체로 공감하는 반면에 몇 가지 궁금한 점이 있어서 문의드립니다. 저희 세대는 이미 5년 전에 확장 공사를 마친 반면에 이번 공지가 기존 공사에도 소급 적용되는 것인지 명확하지 않습니다. 새로 공사하는 세대는 사전 승인 절차를 거치는 반면에 이미 완료된 공사는 별도 절차가 필요 없는 것으로 이해해도 될까요? 승인 절차가 안전을 위한 것이라는 취지는 이해가 되는 반면에 절차가 지나치게 복잡하면 입주민들의 부담이 커질 것 같습니다. 관련 서류 양식과 처리 기간도 함께 안내해 주시면 좋겠습니다. 답변 기다리겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 예상보다 하객 수가 늘어나서 예식장 대관료와 식사 비용이 처음 견적보다 200만 원 정도 늘어날 것 같습니다. 확인 부탁드립니다.",
    stimulus_en:
      "Hello, since the guest count has grown beyond expectations, the venue rental and catering costs will likely be about 2 million won more than the original estimate. Please confirm.",
    prompt_kr:
      "예산 증가를 알린 웨딩플래너에게 조정을 요청하는 답장을 여섯 문장 이상 써 보세요. '다고 보다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a wedding planner who announced a budget increase, asking for adjustments. Use the grammar pattern '-다고 보다'.",
    example_kr:
      "안내해 주셔서 감사합니다. 다만 저희 입장에서는 200만 원이라는 증가 폭이 조금 부담스럽다고 봅니다. 하객 수가 늘어난 것은 저희 사정이지만 식사 비용을 일률적으로 인상하는 것은 다소 과하다고 봅니다. 대신 코스 요리에서 일부 메뉴를 조정하면 비용을 낮출 수 있다고 봅니다. 대관료 부분은 협의가 어렵다고 보지만 케이터링 업체와는 다시 협상할 여지가 있다고 봅니다. 전체 예산을 100만 원 선에서 조정할 수 있는 방법이 있는지 검토해 주실 수 있을까요? 다음 미팅 때 자세히 상의하고 싶습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "회원님, 헬스장 계약 해지는 가입 시점부터 6개월 이내에만 위약금 없이 가능합니다. 현재 8개월이 지나서 위약금이 발생합니다.",
    stimulus_en:
      "Dear member, gym membership cancellation without a penalty fee is only possible within 6 months of joining. Since 8 months have passed, a cancellation fee applies.",
    prompt_kr:
      "위약금 발생 안내에 예외를 요청하는 답장을 여섯 문장 이상 써 보세요. '-는 편이 낫다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply asking for an exception after being told a cancellation fee applies. Use the grammar pattern '-는 편이 낫다'.",
    example_kr:
      "안내해 주셔서 감사합니다. 다만 최근 무릎 부상으로 운동을 계속하기 어려운 상황이라 다시 한번 검토를 부탁드립니다. 진단서를 제출하지 않고 그냥 넘어가느니 정확한 사정을 말씀드리는 편이 낫다고 생각해서 연락드립니다. 병원 진단서와 소견서를 함께 첨부해 드릴 수 있으니 참고 자료로 활용해 주시면 좋겠습니다. 규정을 무리하게 어기기보다는 예외 규정이 있는지 먼저 확인해 보는 편이 나을 것 같아 문의드립니다. 만약 전액 면제가 어렵다면 위약금을 절반이라도 조정해 주시면 감사하겠습니다. 답변 기다리겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 다음 주부터 어린이집 하원 시간이 오후 4시에서 3시 30분으로 변경됩니다. 참고 부탁드립니다.",
    stimulus_en:
      "Hello, starting next week, daycare pickup time will change from 4 p.m. to 3:30 p.m. Please take note.",
    prompt_kr:
      "하원 시간 변경 공지에 어려움을 전하는 학부모의 답장을 여섯 문장 이상 써 보세요. '는 탓에'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence parent reply to a daycare's pickup-time change notice, explaining a difficulty. Use the grammar pattern '-는 탓에'.",
    example_kr:
      "안내해 주셔서 감사합니다. 다만 제가 회사 근무 시간이 오후 6시까지인 탓에 3시 30분에 맞춰 하원시키는 것이 현실적으로 어렵습니다. 갑작스럽게 시간이 변경되는 탓에 대체 돌봄을 새로 구할 시간도 충분하지 않은 상황입니다. 다른 부모님들도 비슷한 사정이 있으실 것 같아서 조심스럽게 여쭤봅니다. 혹시 연장 보육반을 신청할 수 있는지 확인해 주실 수 있을까요? 갑작스러운 변경인 탓에 준비 기간이 짧으니 시행 시점을 2주 정도 늦춰 주실 수 있다면 감사하겠습니다. 확인 후 답변 부탁드립니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "고객님, 확인 결과 차량 엔진 고장은 소모품 미교체로 인한 것으로 판단되어 무상 보증 수리 대상에서 제외됩니다.",
    stimulus_en:
      "Dear customer, our inspection determined that the engine failure was caused by unreplaced consumable parts, so it is excluded from the free warranty repair.",
    prompt_kr:
      "무상 수리 거절 통보에 이의를 제기하는 답장을 여섯 문장 이상 써 보세요. '-을 수밖에 없다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply disputing a dealership's denial of a free warranty repair. Use the grammar pattern '-을 수밖에 없다'.",
    example_kr:
      "확인해 주셔서 감사합니다만 결과에 동의하기 어렵습니다. 저는 정비소에서 안내받은 대로 모든 소모품 교체 주기를 지켜 왔는데 이런 결과를 받으니 당황스러울 수밖에 없습니다. 정기 점검 기록을 모두 보관하고 있으니 확인해 주시면 소모품 관리에 문제가 없었다는 것을 알 수 있을 수밖에 없습니다. 만약 정말 관리 소홀이 원인이라면 구체적으로 어떤 부품이 문제였는지 자료로 받아 보고 싶습니다. 명확한 근거 없이 보증 대상에서 제외하시면 소비자로서는 신뢰하기 어려울 수밖에 없습니다. 제3의 정비 업체에 별도로 진단을 의뢰해 보려고 하는데 그 결과도 함께 검토해 주실 수 있을까요? 답변 기다리겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "작가님, 보내 주신 원고를 검토했는데 3장의 논리 전개가 조금 약한 것 같아 전면 수정을 요청드립니다. 마감은 그대로 유지해 주시면 좋겠습니다.",
    stimulus_en:
      "Author, after reviewing your manuscript, chapter 3's logical flow seems weak, so we're requesting a full rewrite. We'd like the deadline to stay the same.",
    prompt_kr:
      "원고 전면 수정을 요청한 편집자에게 답하는 답장을 여섯 문장 이상 써 보세요. '는 통에'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to an editor requesting a full manuscript rewrite while keeping the deadline. Use the grammar pattern '-는 통에'.",
    example_kr:
      "검토해 주셔서 감사합니다. 말씀하신 부분에 대해서는 저도 어느 정도 동의합니다. 다만 자료 조사가 부족한 통에 3장을 처음부터 다시 쓰려면 시간이 상당히 필요할 것 같습니다. 갑자기 방향을 바꾸는 통에 다른 장과의 연결도 함께 다시 손봐야 할 것 같습니다. 마감을 그대로 지키려고 무리하게 서두르는 통에 오히려 완성도가 떨어질까 봐 걱정이 됩니다. 그래서 죄송하지만 일주일 정도 마감을 연장해 주실 수 있을까요? 수정 방향에 대해 간단히 통화로 상의할 수 있으면 더 정확하게 반영할 수 있을 것 같습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 이번 주말 지역 도서관 행사에 자원봉사자로 참여해 주실 수 있는지 여쭤봅니다. 토요일 오전 9시부터 오후 3시까지입니다.",
    stimulus_en:
      "Hello, I'm reaching out to ask if you could volunteer for this weekend's local library event, from 9 a.m. to 3 p.m. on Saturday.",
    prompt_kr:
      "자원봉사 요청에 시간 조정을 제안하며 답하는 답장을 여섯 문장 이상 써 보세요. '-을 리가 없다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a volunteer request, proposing a time adjustment. Use the grammar pattern '-을 리가 없다'.",
    example_kr:
      "연락 주셔서 감사합니다. 좋은 취지의 행사에 참여하고 싶은 마음이 없을 리가 없지만 그날 오전에 이미 가족 행사가 잡혀 있어서 온종일 참여하기는 어려울 것 같습니다. 오후 시간이라면 참여가 불가능할 리가 없으니 1시부터 3시까지라도 함께할 수 있을까요? 짧은 시간이라 큰 도움이 안 될 리가 없다고 믿고 최선을 다해 돕겠습니다. 필요하신 준비물이나 사전 교육이 있다면 미리 알려 주시면 감사하겠습니다. 다음 행사에는 처음부터 끝까지 함께할 수 있도록 일정을 비워 두겠습니다. 좋은 결과 있기를 바랍니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 문의하신 매물은 다음 주 화요일 오후에만 집주인분이 시간을 내주실 수 있다고 합니다. 방문 가능하실까요?",
    stimulus_en:
      "Hello, regarding the property you inquired about, the owner is only available Tuesday afternoon next week for a viewing. Would that work for you?",
    prompt_kr:
      "매물 방문 일정을 조율하는 부동산 중개인에게 답하는 답장을 여섯 문장 이상 써 보세요. '-는 데 반해'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply coordinating a property viewing schedule with a real estate agent. Use the grammar pattern '-는 데 반해'.",
    example_kr:
      "연락 주셔서 감사합니다. 화요일 오후에는 회사 업무가 있어서 3시까지는 어려운 데 반해 4시 이후라면 시간을 낼 수 있을 것 같습니다. 다른 매물들은 저녁 시간에도 방문이 가능한 데 반해 이 집만 오후로 제한되어 있어서 조금 아쉽습니다. 혹시 집주인분과 다시 조율해서 4시 반 정도로 맞출 수 있을까요? 그 시간도 어렵다면 수요일 오전은 제가 온종일 시간이 되는 데 반해 오후는 다시 어려워집니다. 최대한 맞춰 보고 싶으니 가능한 시간대를 몇 가지 더 알려 주시면 감사하겠습니다. 좋은 소식 기다리겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "고객님, 예약하신 이사 날짜가 다른 고객님과 겹쳐서 오전이 아닌 오후 시간대로 조정될 수 있습니다. 괜찮으실까요?",
    stimulus_en:
      "Dear customer, your moving date overlaps with another customer's, so we may need to move it to the afternoon instead of the morning. Would that be okay?",
    prompt_kr:
      "이사 일정 조정을 요청한 이사업체에 답하는 답장을 여섯 문장 이상 써 보세요. '-을 수밖에 없다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a moving company requesting a schedule adjustment. Use the grammar pattern '-을 수밖에 없다'.",
    example_kr:
      "연락 주셔서 감사합니다. 다만 오후로 시간이 바뀌면 새집 인터넷과 가스 설치 기사님 예약 시간과 겹칠 수밖에 없어서 조금 곤란합니다. 오후 늦게 이사가 끝나면 그날 밤에 짐 정리를 제대로 못 할 수밖에 없다는 것도 걱정입니다. 혹시 같은 날 다른 시간대의 여유 있는 팀으로 배정받을 수 있을까요? 그것도 어렵다면 하루 앞당기거나 늦추는 방법도 고려할 수밖에 없을 것 같습니다. 어떤 방법이든 최대한 빨리 확정해 주시면 저도 다른 일정을 조율할 수 있을 것 같습니다. 답변 기다리겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 다음 달 컨퍼런스 프로그램북에 실을 발표자 소개와 발표 주제를 이번 주 금요일까지 보내 주시기 바랍니다.",
    stimulus_en:
      "Hello, please send your speaker bio and presentation topic for the program book by this Friday for next month's conference.",
    prompt_kr:
      "발표 주제 변경을 알리며 답하는 발표자의 답장을 여섯 문장 이상 써 보세요. '는 김에'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence speaker reply informing the organizer of a topic change. Use the grammar pattern '-는 김에'.",
    example_kr:
      "안내해 주셔서 감사합니다. 소개 자료를 준비하는 김에 발표 주제도 조금 조정하고 싶어서 미리 말씀드립니다. 처음에는 산업 동향을 다루려고 했지만 자료를 정리하는 김에 최근 진행한 실제 사례 연구로 방향을 바꾸는 것이 청중들에게 더 유익할 것 같습니다. 새 주제로 프로필도 함께 업데이트하는 김에 사진도 최신 것으로 교체하려고 합니다. 변경된 제목과 요약본은 목요일까지 보내 드리겠습니다. 프로그램북 디자인에 문제가 없는지 미리 확인해 주시면 감사하겠습니다. 좋은 컨퍼런스가 되길 기대합니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 이번 달 북클럽 모임을 평소보다 하루 앞당겨서 이번 주 목요일 저녁에 진행하려고 하는데 다들 괜찮으실까요?",
    stimulus_en:
      "Hello, we're thinking of moving this month's book club meeting up by a day to this Thursday evening. Would that work for everyone?",
    prompt_kr:
      "북클럽 일정 변경 제안에 참석이 어려움을 전하는 답장을 여섯 문장 이상 써 보세요. '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a book club schedule change proposal, explaining that attendance is difficult. Use the grammar pattern '-을 정도로'.",
    example_kr:
      "안내해 주셔서 감사합니다. 그런데 이번 주는 회사 마감이 겹쳐서 저녁 시간을 내기 어려울 정도로 바쁜 상황입니다. 목요일에는 야근이 확실할 정도로 업무가 밀려 있어서 참석이 힘들 것 같습니다. 이번 책을 정말 재미있게 읽어서 아쉬움이 클 정도로 참석하고 싶은 마음은 큽니다. 혹시 원래 예정대로 금요일에 진행하는 것은 어려울까요? 그것도 어렵다면 다음 주로 미루는 방법도 고려해 주시면 좋겠습니다. 다른 분들 의견도 들어 보고 편하신 대로 정해 주세요.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 세무서입니다. 지난해 신고하신 소득세 내역 중 일부 항목에서 신고 금액과 실제 자료가 일치하지 않아 소명 자료를 요청드립니다.",
    stimulus_en:
      "Hello, this is the tax office. Some items in your income tax filing from last year don't match the actual records, so we're requesting supporting documentation.",
    prompt_kr:
      "세금 신고 불일치에 대해 소명하는 답장을 여섯 문장 이상 써 보세요. '-는 반면에'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply providing an explanation for a tax filing discrepancy. Use the grammar pattern '-는 반면에'.",
    example_kr:
      "연락 주셔서 감사합니다. 불일치 내역을 확인해 보니 프리랜서 수입 일부는 세금계산서로 처리한 반면에 나머지는 현금영수증으로 처리해서 합산 과정에서 오류가 생긴 것 같습니다. 신고 당시에는 정확하다고 생각했던 반면에 다시 확인해 보니 일부 항목에서 중복 누락이 있었던 것으로 보입니다. 관련 증빙 자료는 모두 보관하고 있는 반면에 정리하는 데 며칠 정도 시간이 필요할 것 같습니다. 고의적인 누락이 아니라 단순 계산 실수였다는 점을 소명 자료와 함께 말씀드리고 싶습니다. 이번 주 안으로 관련 자료를 모두 정리해서 제출하겠습니다. 확인 부탁드립니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "환자분, 지난달 입원 치료비 중 일부 항목이 실손 보험 적용 대상에서 제외되어 본인 부담금이 추가로 발생했습니다. 확인 부탁드립니다.",
    stimulus_en:
      "Dear patient, some items from your hospitalization costs last month were excluded from your private insurance coverage, resulting in additional out-of-pocket charges. Please confirm.",
    prompt_kr:
      "의료비 청구 내역에 이의를 제기하는 답장을 여섯 문장 이상 써 보세요. '을 리가 없다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply disputing a hospital billing statement. Use the grammar pattern '-을 리가 없다'.",
    example_kr:
      "안내해 주셔서 감사합니다만 청구 내역이 이해가 잘 안 됩니다. 입원 당시 담당 의사 선생님께서 분명 보험 적용이 가능한 항목이라고 말씀하셨는데 제외될 리가 없다고 생각했습니다. 같은 검사를 받은 다른 환자는 전액 보험 처리가 되었다고 들었는데 저만 제외될 리가 없어서 더욱 의아합니다. 원무과에서 착오로 항목을 잘못 입력했을 가능성은 없을까요? 만약 정말 제외 대상이 맞다면 정확한 근거 규정을 함께 안내해 주시면 좋겠습니다. 확인 후 다시 연락 주시면 감사하겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "고객님, 이용 중이신 온라인 강의 구독이 다음 달 자동으로 연장되어 결제될 예정입니다. 계속 이용하시겠습니까?",
    stimulus_en:
      "Dear customer, your online course subscription will automatically renew and be charged next month. Would you like to continue?",
    prompt_kr:
      "구독 자동 연장 안내에 해지 사유를 밝히며 답하는 답장을 여섯 문장 이상 써 보세요. '느니 차라리'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a subscription auto-renewal notice, explaining the reason for canceling. Use the grammar pattern '-느니 차라리'.",
    example_kr:
      "안내해 주셔서 감사합니다. 지난 몇 달간 강의를 거의 듣지 못해서 이번에는 해지를 요청드리고 싶습니다. 쓰지도 않는 구독을 계속 유지하느니 차라리 해지하고 필요할 때 다시 가입하는 편이 나을 것 같습니다. 매달 자동으로 결제되는 것을 잊고 있느니 차라리 지금 정확히 정리하는 것이 낫다고 판단했습니다. 콘텐츠 자체는 만족스러웠지만 요즘 시간을 내기가 어려운 것이 가장 큰 이유입니다. 혹시 해지 후에도 이전에 수강했던 강의는 계속 볼 수 있는지 확인해 주시겠어요? 필요할 때 다시 이용하도록 하겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "탑승객님, 기상 악화로 예약하신 항공편이 결항되었습니다. 다음 편은 이틀 뒤에나 가능하며 자세한 보상 절차는 안내해 드리겠습니다.",
    stimulus_en:
      "Dear passenger, your booked flight has been canceled due to bad weather. The next available flight is in two days, and we will guide you through the compensation process.",
    prompt_kr:
      "항공편 결항 안내에 보상과 대안을 요청하는 답장을 여섯 문장 이상 써 보세요. '-을 수밖에 없다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply requesting compensation and alternatives after a flight cancellation notice. Use the grammar pattern '-을 수밖에 없다'.",
    example_kr:
      "안내해 주셔서 감사합니다만 상황이 매우 난감합니다. 이틀 뒤 편을 기다리면 예정된 회의 일정을 놓칠 수밖에 없어서 다른 대안이 꼭 필요합니다. 기상 악화가 원인이라는 것은 이해하지만 저로서는 급하게 다른 교통편을 알아볼 수밖에 없는 상황입니다. 혹시 타 항공사 좌석으로 대체 발권이 가능하다면 오늘 안에 확인해 주시면 감사하겠습니다. 그것도 어렵다면 숙박비와 식비 등 추가 발생 비용에 대한 보상을 받을 수밖에 없다고 생각합니다. 관련 절차와 필요한 서류를 자세히 안내해 주시겠어요? 빠른 답변 부탁드립니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "선배, 이번 주 토요일 근무를 저랑 좀 바꿔 주실 수 있어요? 가족 행사가 갑자기 잡혀서 그런데 대신 다음 주 아무 요일이나 제가 맞춰 드릴게요.",
    stimulus_en:
      "Hey, could you swap Saturday's shift with me? A family event just came up, but I'll cover any day you want next week in return.",
    prompt_kr:
      "근무 교대를 요청한 동료에게 답하는 답장을 여섯 문장 이상 써 보세요. '-는 편이 낫다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a coworker's request to swap work shifts. Use the grammar pattern '-는 편이 낫다'.",
    example_kr:
      "사정 말해 줘서 고마워요, 저도 도와주고 싶어요. 다만 토요일은 이미 병원 예약이 잡혀 있어서 그냥 바꾸느니 다른 방법을 찾는 편이 나을 것 같아요. 저 대신 재훈 씨한테 한번 물어보는 편이 나을 것 같은데 어때요? 만약 안 된다면 제가 병원 예약을 오후로 옮길 수 있는지 알아보고 다시 연락드릴게요. 무리해서 억지로 맞추느니 미리 확실하게 정하는 편이 서로한테 좋을 것 같아요. 오늘 중으로 다시 알려 드릴게요.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "도윤 씨, 이번 주말 프로젝트 마감을 앞두고 있어서 토요일에 추가 근무가 필요할 것 같습니다. 가능하신지 알려 주세요.",
    stimulus_en:
      "Do-yoon, with the project deadline coming up this weekend, we may need overtime on Saturday. Please let me know if that's possible for you.",
    prompt_kr:
      "주말 추가 근무를 요청한 팀장님에게 답하는 답장을 여섯 문장 이상 써 보세요. '을 따름이다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a manager's request for weekend overtime. Use the grammar pattern '-을 따름이다'.",
    example_kr:
      "팀장님, 상황을 알려 주셔서 감사합니다. 다만 이번 주말은 이미 가족 여행이 예약되어 있어서 참석하기 어려울 따름입니다. 미리 알았다면 조정이 가능했을 텐데 갑작스러운 요청이라 아쉬울 따름입니다. 대신 금요일 저녁까지 제가 맡은 부분을 최대한 마무리해 두겠습니다. 주말에 급한 확인이 필요하시면 전화로라도 도와드릴 수 있을 따름이니 편하게 연락 주세요. 다음번에는 미리 일정을 여쭤봐 주시면 더 유연하게 협조할 수 있을 것 같습니다. 이해해 주셔서 감사합니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 지난달 진행한 로고 디자인 건에 대해 청구하신 금액이 처음 견적서보다 30만 원 높은데 사유를 알 수 있을까요?",
    stimulus_en:
      "Hello, the invoice for last month's logo design work is 300,000 won higher than the original estimate. Could you explain the reason?",
    prompt_kr:
      "인보이스 금액 차이에 이의를 제기한 클라이언트에게 근거를 설명하는 프리랜서의 답장을 여섯 문장 이상 써 보세요. '-을 뿐만 아니라'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence freelancer reply explaining the reasoning to a client who questioned an invoice discrepancy. Use the grammar pattern '-을 뿐만 아니라'.",
    example_kr:
      "문의해 주셔서 감사합니다, 설명이 부족했던 것 같아 죄송합니다. 처음 견적 이후 시안 요청이 세 차례에서 다섯 차례로 늘어났을 뿐만 아니라 최종 파일 형식도 추가로 요청받아서 작업 시간이 더 늘어났습니다. 마감을 앞당겨 달라는 요청도 있었을 뿐만 아니라 색상 팔레트를 전면적으로 다시 검토해야 했던 점도 추가 비용에 반영되었습니다. 견적 변경 사항은 그때그때 안내해 드렸어야 했는데 그러지 못한 부분은 제 실수입니다. 자세한 작업 내역은 시안별로 정리해서 다시 보내 드리겠습니다. 금액에 대해 조율이 필요하시면 편하게 말씀해 주세요. 앞으로는 변경 사항이 생길 때마다 미리 안내드리겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "저기요, 우리 집이랑 경계에 있는 담장이 많이 낡아서 수리가 필요한 것 같은데 비용을 반반씩 부담하는 게 어떨까요?",
    stimulus_en:
      "Excuse me, the fence on our shared property line looks quite worn and needs repair — what do you think about splitting the cost 50/50?",
    prompt_kr:
      "담장 수리 비용 분담을 제안한 이웃에게 답하는 답장을 여섯 문장 이상 써 보세요. '에 비해'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply to a neighbor's proposal to split fence repair costs. Use the grammar pattern '-에 비해'.",
    example_kr:
      "말씀해 주셔서 감사합니다, 저도 담장 상태가 걱정되던 참이었습니다. 다만 자세히 보니 저희 쪽에 비해 그쪽 방향의 손상이 훨씬 심한 것 같아서 반반 부담이 맞는지 조금 고민이 됩니다. 예전 태풍 때 그쪽 나무가 쓰러지면서 생긴 손상이 저희 쪽 문제에 비해 더 크게 작용한 것 같습니다. 그래도 이웃 간에 얼굴 붉히고 싶지 않으니 정확한 견적을 받아서 손상 비율에 비해 합리적으로 나누는 방법을 제안하고 싶습니다. 업체 두어 곳에서 견적을 받아 보고 다시 상의하는 게 어떨까요? 좋은 방향으로 해결되었으면 좋겠습니다.",
  },
  {
    level: "B2",
    genre: "reply",
    stimulus_kr:
      "야, 나 이번 달에 정말 급하게 돈이 필요한데 200만 원만 빌려줄 수 있어? 다음 달 월급 받으면 바로 갚을게.",
    stimulus_en:
      "Hey, I really need money urgently this month — could you lend me 2 million won? I'll pay you back as soon as I get my paycheck next month.",
    prompt_kr:
      "돈을 빌려 달라는 친구의 부탁을 정중히 거절하는 답장을 여섯 문장 이상 써 보세요. '-는 데 그치다'를 사용하세요.",
    prompt_en:
      "Write a six-or-more-sentence reply politely declining a friend's request to borrow money. Use the grammar pattern '-는 데 그치다'.",
    example_kr:
      "연락해 줘서 고마워, 얼마나 급하면 나한테 연락했을까 싶어서 마음이 쓰인다. 그런데 솔직히 말하면 요즘 내 상황도 여유가 없어서 조금이라도 도와주는 데 그칠 것 같아 미안해. 큰돈을 빌려주기보다는 위로의 말을 건네는 데 그치는 것 같아서 나도 마음이 무거워. 대신 급한 부분이라도 30만 원 정도는 도와줄 수 있을 것 같은데 괜찮을까? 그것으로는 부족한 도움에 그칠 수도 있지만 다른 대출 상품이나 지원 제도도 함께 알아봐 줄게. 혼자 끙끙 앓지 말고 필요하면 언제든 다시 얘기해 줘.",
  },
];
