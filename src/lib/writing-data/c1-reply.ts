import type { RawPrompt } from "./types";

export const WRITING_C1_REPLY: RawPrompt[] = [
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 김민준 선생님. 투고하신 논문을 심사한 결과, 전반적으로 우수하다는 평가를 받았으나 3장의 통계 분석 부분에 대한 심사위원들의 이견이 있어 수정을 요청드립니다. 2주 이내에 수정본을 보내 주실 수 있을까요?",
    stimulus_en:
      "Dear Dr. Kim Min-jun, your submitted paper received a generally favorable review, but the reviewers had differing opinions on the statistical analysis in Chapter 3, so we are requesting revisions. Could you send a revised draft within two weeks?",
    prompt_kr:
      "학술지 편집장의 수정 요청 이메일에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 한편'과 '-기에 앞서'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a journal editor's revision request. Use '-는 한편' and '-기에 앞서'.",
    example_kr:
      "편집장님, 세심한 심사에 감사드립니다. 심사위원들의 지적에 공감하는 한편, 원 데이터를 재검토할 필요성도 함께 느꼈습니다. 다만 통계 방법을 전면적으로 수정하기에 앞서, 두 분 심사위원의 견해가 다소 엇갈리는 부분에 대해 명확한 방향을 여쭙고 싶습니다. 2주라는 기간이 다소 촉박하게 느껴지지만 최대한 맞춰 보도록 하겠습니다. 만약 통계 기법 자체를 교체해야 한다면 일주일 정도 추가 시간을 부탁드려도 될지 문의드립니다. 수정 방향이 확정되는 대로 곧바로 작업에 착수하겠습니다. 다시 한번 꼼꼼한 심사에 감사드리며 답변을 기다리겠습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "안녕하십니까, 귀사와 체결한 공급 계약 중 납품 단가 조정 조항에 대해 문의드립니다. 원자재 가격 상승을 반영하여 단가를 5% 인상하고자 하는데, 귀사의 입장을 알려 주시겠습니까?",
    stimulus_en:
      "Hello, we'd like to inquire about the price-adjustment clause in our supply contract. We're considering a 5% price increase to reflect rising raw material costs — could you share your position?",
    prompt_kr:
      "협력사의 계약 조건 조정 문의에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 데 반해'와 '-을 막론하고'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a partner company's contract term inquiry. Use '-는 데 반해' and '-을 막론하고'.",
    example_kr:
      "담당자님, 연락 주셔서 감사합니다. 원자재 가격 상승에 대해서는 저희도 충분히 인지하고 있습니다. 다만 5% 인상은 저희가 예상했던 폭을 다소 웃도는 데 반해, 최근 저희 내부 예산은 오히려 축소된 상황이라 조율이 필요할 것 같습니다. 인상 이유를 막론하고 이번 분기 안에 갑작스러운 인상을 전면 반영하기는 어렵다는 점을 양해해 주시기 바랍니다. 대신 3% 선에서 우선 조정하고, 다음 분기에 나머지 폭을 반영하는 방안은 어떠신지 제안드립니다. 구체적인 근거 자료를 함께 보내 주시면 내부 검토에 큰 도움이 될 것 같습니다. 조속히 협의를 마무리하고 원만한 방향으로 진행되기를 바랍니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "지은 씨, 보내 준 논문 초안 잘 읽었어요. 이론적 틀은 탄탄한데 실증 분석 부분이 다소 약해 보여요. 다음 주 미팅 전까지 보완할 수 있을까요?",
    stimulus_en:
      "Ji-eun, I read your draft. The theoretical framework is solid, but the empirical analysis section seems weak. Can you strengthen it before our meeting next week?",
    prompt_kr:
      "지도교수의 논문 피드백에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-(으)ㅁ에 따라'와 '-을 따름이다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a professor's thesis feedback. Use '-(으)ㅁ에 따라' and '-을 따름이다'.",
    example_kr:
      "교수님, 소중한 의견 감사드립니다. 저 역시 실증 분석 부분이 다소 부족하다고 느끼고 있었는데, 교수님의 지적을 받고 나니 방향이 더 명확해졌습니다. 표본 수를 늘림에 따라 통계적 유의성이 개선될 것으로 기대하고 있어, 이번 주말까지 추가 데이터를 수집해 보려 합니다. 다만 시간이 촉박하여 다음 주 미팅까지 완벽하게 보완하지는 못할 따름이라, 부족한 부분은 미팅 자리에서 함께 논의드리고 싶습니다. 추가로 참고할 만한 선행 연구가 있다면 알려 주시면 큰 도움이 될 것 같습니다. 미팅 전날까지 수정된 초안을 미리 보내 드리도록 하겠습니다. 다시 한번 세심한 지도에 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "주민 여러분께, 다음 달 1일부터 2주간 상수도관 교체 공사로 인해 자택 앞 도로가 통제될 예정입니다. 불편에 대한 의견이 있으시면 이번 주 금요일까지 회신해 주시기 바랍니다.",
    stimulus_en:
      "Dear residents, from the 1st of next month, the road in front of your home will be closed for two weeks due to water pipe replacement work. Please reply by this Friday with any concerns.",
    prompt_kr:
      "시청의 도로 공사 안내문에 의견을 전하는 답장을 여섯 문장 이상으로 써 보세요. '-는 이상'과 '-을 감안하여'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a city office's road-construction notice. Use '-는 이상' and '-을 감안하여'.",
    example_kr:
      "담당자님, 안내 감사드립니다. 노후 상수도관 교체가 불가피한 공사인 이상 협조하는 것이 마땅하다고 생각합니다. 다만 저희 집 앞은 어린이 통학로로도 쓰이고 있는 만큼, 이 점을 감안하여 등하교 시간대만이라도 임시 통행로를 마련해 주실 수 있을지 문의드립니다. 또한 공사 소음이 심할 경우 재택근무 중인 주민들에게 큰 지장이 있을 것으로 예상되어 사전에 정확한 작업 시간대를 알려 주시면 좋겠습니다. 큰 틀에서는 공사 진행에 이의가 없으며, 다만 세부 사항을 조정해 주신다면 감사하겠습니다. 필요하다면 주민 설명회에도 기꺼이 참석하겠습니다. 원활한 공사 진행을 기원합니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, 저희는 청년 진로 지원 단체입니다. 선생님의 경험을 바탕으로 다음 달 청년 대상 강연을 부탁드리고 싶습니다. 강연료는 크지 않지만 뜻깊은 자리가 될 것입니다.",
    stimulus_en:
      "Hello, we're a nonprofit supporting young people's career development. We'd like to invite you to give a talk to young people next month based on your experience. The honorarium is modest, but it would be a meaningful event.",
    prompt_kr:
      "비영리단체의 강연 요청 메일에 조건부로 수락하는 답장을 여섯 문장 이상으로 써 보세요. '-을 계기로'와 '-는 대신'을 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences conditionally accepting a nonprofit's request to give a talk. Use '-을 계기로' and '-는 대신'.",
    example_kr:
      "담당자님, 뜻깊은 제안을 해 주셔서 감사합니다. 저 역시 예전에 비슷한 도움을 받은 것을 계기로 언젠가 청년들에게 보답하고 싶다는 생각을 해 왔습니다. 다만 제안하신 날짜에 다른 일정이 겹쳐 있어, 강연 날짜를 2주 정도 미루는 대신 준비 시간을 충분히 가지고 싶습니다. 강연료는 크게 개의치 않으니 그 부분은 부담 갖지 않으셔도 됩니다. 다만 참석 대상의 연령대와 관심 분야를 미리 알려 주시면 내용을 더 알차게 준비할 수 있을 것 같습니다. 확정되는 대로 강연 자료 초안을 보내 드리겠습니다. 좋은 기회를 주셔서 다시 한번 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "안녕하세요, OO일보 기자입니다. 최근 진행하신 프로젝트와 관련하여 인터뷰를 요청드립니다. 회사 입장을 대변하는 자리인 만큼 신중하게 답변해 주시면 감사하겠습니다.",
    stimulus_en:
      "Hello, this is a reporter from OO Daily. We'd like to request an interview about your recent project. Since this represents your company's position, we'd appreciate careful, considered answers.",
    prompt_kr:
      "기자의 인터뷰 요청에 조건을 제시하며 수락하는 답장을 여섯 문장 이상으로 써 보세요. '-을 막론하고'와 '-는 한'을 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences conditionally accepting a journalist's interview request. Use '-을 막론하고' and '-는 한'.",
    example_kr:
      "기자님, 관심 가져 주셔서 감사합니다. 프로젝트의 성격을 막론하고 언론에 정확한 정보가 전달되는 것이 중요하다고 생각하여 인터뷰에 응하고자 합니다. 다만 사내 규정상 사전에 질문지를 공유해 주셔야 답변 준비가 가능한 점 양해 부탁드립니다. 또한 아직 공개되지 않은 세부 수치에 대해서는 회사 방침이 허락하는 한 최대한 성실히 답변드리겠지만, 일부는 답변이 제한될 수 있음을 미리 말씀드립니다. 인터뷰는 서면과 대면 중 편하신 방식으로 진행해 주셔도 무방합니다. 보도 전에 인용문 확인을 요청드려도 될지 궁금합니다. 좋은 기사 부탁드리며 답변 기다리겠습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "입주민 여러분, 최근 몇몇 세대의 반려동물 짖는 소리로 인한 민원이 접수되고 있습니다. 해당 세대는 관리사무소로 연락하여 상황을 설명해 주시기 바랍니다.",
    stimulus_en:
      "Dear residents, we've received complaints about barking pets from several units. If this applies to you, please contact the management office to explain the situation.",
    prompt_kr:
      "입주자대표회의의 반려동물 소음 민원 공지에 해명과 협조를 담아 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 데 그치지 않고'와 '-지 않을 수 없었다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to an HOA notice about a pet-noise complaint, offering an explanation and cooperation. Use '-는 데 그치지 않고' and '-지 않을 수 없었다'.",
    example_kr:
      "관리사무소 담당자님, 안내 주셔서 감사합니다. 저희 집 강아지가 최근 분리불안 증세를 보여 낮 시간대에 짖는 일이 잦았던 것으로 확인되어 이웃분들께 먼저 사과의 말씀을 드립니다. 단순히 사과하는 데 그치지 않고 실질적인 개선 방안을 마련하고자, 이번 주부터 반려동물 훈련사와 상담을 시작했습니다. 낮 시간에 아무도 없는 상황이 반복되다 보니 개인적으로도 걱정이 되지 않을 수 없었던 참이라 이번 계기로 근본적인 해결을 시도해 보려 합니다. 필요하다면 방음 매트 설치 등 추가 조치도 검토하겠습니다. 불편을 겪으신 이웃분들께 다시 한번 죄송하다는 말씀을 전합니다. 개선 상황을 관리사무소에도 주기적으로 알려 드리겠습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "재훈 씨, 요즘 보고서를 보면 예전보다 꼼꼼함이 떨어진 것 같아요. 실력은 있는데 디테일에서 자꾸 실수가 나오니 좀 더 신경 써 줬으면 해요.",
    stimulus_en:
      "Jae-hoon, your recent reports seem less thorough than before. You're clearly capable, but the mistakes in detail need more attention.",
    prompt_kr:
      "멘토의 따끔한 지적에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-을 계기로'와 '-지 않을 수 없다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a mentor's critical advice. Use '-을 계기로' and '-지 않을 수 없다'.",
    example_kr:
      "팀장님, 솔직하게 말씀해 주셔서 감사합니다. 지적을 받고 나니 최근 업무량이 늘어난 것을 핑계 삼아 검토 과정을 소홀히 했음을 인정하지 않을 수 없습니다. 이번 지적을 계기로 보고서를 제출하기 전 최종 점검 체크리스트를 따로 만들어 활용해 보려 합니다. 변명처럼 들릴 수 있지만 최근 여러 프로젝트가 겹치면서 집중력이 분산된 것도 사실이라, 업무 우선순위를 다시 정리할 필요성도 느꼈습니다. 다음 보고서부터는 제출 전에 동료에게 한 번 더 검토를 부탁드리려 합니다. 신뢰를 회복할 수 있도록 앞으로 더욱 꼼꼼하게 임하겠습니다. 다시 한번 부족한 부분을 짚어 주셔서 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "보내 주신 제안서 검토했습니다. 전반적인 방향은 좋았으나 예산 대비 기대 효과가 부족하다고 판단되어 이번에는 함께하기 어려울 것 같습니다.",
    stimulus_en:
      "We reviewed your proposal. The overall direction was good, but we've determined the expected impact doesn't justify the budget, so we don't think we can move forward this time.",
    prompt_kr:
      "클라이언트의 제안 거절 메일에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-던 것에 비하면'과 '-을 뿐만 아니라'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a client's email rejecting your proposal. Use '-던 것에 비하면' and '-을 뿐만 아니라'.",
    example_kr:
      "담당자님, 솔직한 검토 의견 감사드립니다. 저희가 처음 구상했던 것에 비하면 예산 산정이 다소 넉넉하게 잡혔던 부분이 있었던 것 같아 그 점은 저희도 재검토가 필요하다고 생각합니다. 다만 이번 제안이 단기적인 효과를 낼 뿐만 아니라 장기적으로도 브랜드 인지도 향상에 기여할 수 있다는 점을 다시 한번 말씀드리고 싶습니다. 예산을 조정한 수정안을 이번 주 안에 다시 보내 드려도 괜찮을지 여쭙고 싶습니다. 혹시 예산 외에 다른 우려 사항이 있으셨다면 함께 말씀해 주시면 반영해 보겠습니다. 이번 기회가 아니더라도 앞으로 협업할 기회가 있기를 바랍니다. 검토해 주셔서 다시 한번 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "나 요즘 정말 힘들어. 이혼 절차 밟으면서 매일 밤 잠도 못 자고, 아이한테 뭐라고 설명해야 할지도 모르겠고, 내가 잘하고 있는 건지도 모르겠어. 너한테라도 털어놓고 싶었어.",
    stimulus_en:
      "I've been really struggling lately. Going through the divorce process, I can't sleep at night, I don't know how to explain it to my kid, and I don't even know if I'm doing okay. I just wanted to open up to you.",
    prompt_kr:
      "힘든 시기를 겪는 친구의 긴 메시지에 위로하는 답장을 여섯 문장 이상으로 써 보세요. '-는 셈이다'와 '-던 것과는 달리'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences comforting a friend who sent a long emotional message about a hard time. Use '-는 셈이다' and '-던 것과는 달리'.",
    example_kr:
      "이렇게 솔직하게 마음을 털어놓아 줘서 정말 고마워, 얼마나 힘들었을지 짐작이 가. 예전에 늘 씩씩하던 것과는 달리 요즘 목소리에 지친 기색이 느껴져서 나도 마음이 무거워. 아이에게 뭐라고 설명해야 할지 고민하는 것 자체가 이미 좋은 부모로서 최선을 다하고 있다는 증거인 셈이야, 너무 자책하지 않았으면 좋겠어. 완벽한 답을 찾으려 하지 말고, 지금은 그저 하루하루를 버텨 내는 것만으로도 충분하다고 생각해. 잠을 못 이루는 밤엔 언제든 전화해도 괜찮으니까 혼자 견디려 하지 마. 필요하면 아이 문제로 상담받을 만한 곳도 같이 찾아볼게. 너는 지금도 충분히 잘하고 있어, 옆에 있을게.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "교수님, 다음 학기 학회 기조연설을 부탁드리고 싶습니다. 주제는 자유롭게 정하셔도 되며, 발표 시간은 40분입니다.",
    stimulus_en:
      "Professor, we would like to invite you to give the keynote speech at next semester's conference. The topic is open, and the speaking time is 40 minutes.",
    prompt_kr:
      "학회 조직위원회의 기조연설 초청에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-기에 앞서'와 '-는 만큼'을 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a conference organizer's keynote invitation. Use '-기에 앞서' and '-는 만큼'.",
    example_kr:
      "위원장님, 귀한 자리에 초청해 주셔서 영광입니다. 수락하기에 앞서 학회의 전체 프로그램 구성을 먼저 살펴보고 제 발표 주제가 다른 세션과 겹치지 않는지 확인하고 싶습니다. 기조연설이라는 중요한 자리인 만큼 충분한 준비 기간이 필요할 것 같아, 최소 두 달 전에는 주제를 확정해 알려 드리고 싶습니다. 최근 진행 중인 연구를 중심으로 발표를 구성하면 청중분들께도 유익할 것으로 생각됩니다. 발표 장비나 사전 리허설 일정에 대해서도 미리 안내해 주시면 감사하겠습니다. 세부 사항이 정리되는 대로 초록을 보내 드리겠습니다. 다시 한번 이런 기회를 주셔서 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "작가님, 보내 주신 원고를 검토한 결과 저희 출판사의 현재 출간 방향과는 다소 맞지 않아 이번에는 출간이 어려울 것 같다는 결론에 이르렀습니다.",
    stimulus_en:
      "Dear author, after reviewing your manuscript, we've concluded that it doesn't quite align with our current publishing direction, so we won't be able to publish it this time.",
    prompt_kr:
      "출판사의 원고 반려 메일에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-을 따름이다'와 '-는 데 그치지 않고'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a publisher's manuscript rejection email. Use '-을 따름이다' and '-는 데 그치지 않고'.",
    example_kr:
      "편집장님, 시간을 들여 원고를 검토해 주셔서 감사할 따름입니다. 기대했던 결과는 아니지만 솔직한 답변을 주신 점은 오히려 다행이라고 생각합니다. 다만 단순히 아쉬움을 표하는 데 그치지 않고, 혹시 어떤 부분이 방향성과 맞지 않았는지 구체적으로 여쭤봐도 될지 궁금합니다. 그 이유를 알 수 있다면 다른 출판사와의 논의에도 도움이 될 것 같습니다. 혹시 추후 원고를 수정하여 다시 투고할 기회가 있을지도 조심스럽게 여쭙고 싶습니다. 짧은 시간이었지만 진지하게 검토해 주신 점에 감사드립니다. 좋은 인연으로 다시 만날 수 있기를 바랍니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "고객님, 청구하신 보험금은 약관상 면책 조항에 해당되어 지급이 어렵다는 심사 결과가 나왔습니다. 자세한 사유는 첨부 서류를 참고해 주시기 바랍니다.",
    stimulus_en:
      "Dear customer, your claim falls under an exclusion clause in the policy, so it cannot be paid according to the review. Please refer to the attached document for details.",
    prompt_kr:
      "보험금 지급 거절 통보에 이의를 제기하는 답장을 여섯 문장 이상으로 써 보세요. '-는 데 반해'와 '-지 않을 수 없다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences objecting to an insurance company's claim denial. Use '-는 데 반해' and '-지 않을 수 없다'.",
    example_kr:
      "담당자님, 심사 결과를 안내해 주셔서 감사합니다. 다만 첨부해 주신 면책 조항이 다소 모호하게 서술되어 있는 데 반해, 저는 계약 당시 해당 사항에 대해 별도의 설명을 듣지 못했다는 점에서 이의를 제기하지 않을 수 없습니다. 계약서 어느 조항에 근거하여 면책 판단을 내리셨는지 구체적으로 알려 주시면 감사하겠습니다. 필요하다면 계약 당시 상담 기록도 함께 확인해 주시기를 요청드립니다. 이번 결정에 승복하기 전에 재심사를 요청드려도 될지 문의드립니다. 관련 자료는 이번 주 안으로 추가 제출하도록 하겠습니다. 신속한 검토 부탁드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "사업자님, 귀하의 사업체에 대해 정기 세무조사를 실시하고자 합니다. 다음 주 화요일부터 관련 서류를 준비해 주시기 바랍니다.",
    stimulus_en:
      "Dear business owner, we plan to conduct a routine tax audit of your business. Please prepare the relevant documents starting next Tuesday.",
    prompt_kr:
      "세무서의 세무조사 안내에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 이상'과 '-기에 앞서'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a city tax office's audit notice. Use '-는 이상' and '-기에 앞서'.",
    example_kr:
      "담당자님, 안내해 주셔서 감사합니다. 정기적인 절차인 이상 성실히 협조하도록 하겠습니다. 다만 서류를 준비하기에 앞서 정확히 어느 기간의 자료가 필요한지 구체적으로 알려 주시면 준비에 큰 도움이 될 것 같습니다. 회계 담당 직원이 현재 출산휴가 중이라 서류 정리에 다소 시간이 걸릴 수 있는 점 양해 부탁드립니다. 가능하다면 조사 시작일을 일주일 정도 늦춰 주실 수 있는지도 여쭙고 싶습니다. 필요한 서류 목록을 미리 보내 주시면 순서대로 준비해 두겠습니다. 원활한 조사가 이루어지도록 적극 협조하겠습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "동문 여러분, 모교 장학 기금 마련을 위해 이번 학기 동문회에서 기부 캠페인을 진행하고 있습니다. 여러분의 따뜻한 참여를 부탁드립니다.",
    stimulus_en:
      "Dear alumni, our alumni association is running a donation campaign this semester to build a scholarship fund for our alma mater. We ask for your warm participation.",
    prompt_kr:
      "동문회의 기부 요청 메일에 조건부로 답하는 답장을 여섯 문장 이상으로 써 보세요. '-을 계기로'와 '-는 대신에'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences conditionally responding to an alumni association's donation request. Use '-을 계기로' and '-는 대신에'.",
    example_kr:
      "회장님, 뜻깊은 캠페인을 알려 주셔서 감사합니다. 저 역시 학창 시절 장학금의 도움을 받은 것을 계기로 언젠가 후배들에게 보답하고 싶었는데, 이번이 좋은 기회인 것 같습니다. 다만 형편상 큰 금액을 한 번에 기부하는 대신에, 매달 소액을 정기적으로 후원하는 방식으로 참여하고 싶은데 가능한지 문의드립니다. 정기 후원 신청 절차와 세액 공제 관련 안내도 함께 받을 수 있을까요? 주변 동문들에게도 이 캠페인을 적극적으로 알려 참여를 독려하겠습니다. 후원금이 실제로 어떻게 쓰이는지 정기적으로 보고해 주시면 더욱 신뢰가 갈 것 같습니다. 좋은 취지의 캠페인에 함께할 수 있어 기쁩니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "대표님, 최근 시장 상황 변화로 인해 저희 회사는 귀사와의 계약을 다음 분기부터 종료하고자 합니다. 양해 부탁드립니다.",
    stimulus_en:
      "CEO, due to recent changes in the market, our company would like to terminate our contract with yours starting next quarter. We ask for your understanding.",
    prompt_kr:
      "사업 파트너의 계약 해지 통보에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-던 것에 비하면'과 '-을 무릅쓰고'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a business partner's contract termination notice. Use '-던 것에 비하면' and '-을 무릅쓰고'.",
    example_kr:
      "대표님, 갑작스러운 소식에 놀랐지만 상황을 이해하도록 노력하겠습니다. 처음 계약을 시작했던 것에 비하면 지난 3년간 양사의 협력이 상당히 깊어졌기에 아쉬움이 큰 것이 사실입니다. 실례를 무릅쓰고 여쭙자면, 혹시 저희 쪽의 대응이나 조건을 조정하여 계약을 유지할 여지는 전혀 없는지 한 번 더 논의해 볼 수 있을지 궁금합니다. 만약 해지가 불가피하다면 남은 계약 기간 동안의 인수인계 절차를 원활히 진행할 수 있도록 협조하겠습니다. 미수금 및 재고 정산 문제도 이번 달 안에 명확히 정리하고 싶습니다. 그동안의 신뢰에 감사드리며, 추후 다시 협력할 기회가 있기를 바랍니다. 원만한 마무리를 위해 조속히 미팅을 잡을 수 있을까요.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "사장님, 건물 관리비 상승으로 인해 다음 계약 갱신 시 임대료를 10% 인상하고자 합니다. 검토 부탁드립니다.",
    stimulus_en:
      "Owner, due to rising building maintenance costs, we'd like to raise the rent by 10% at the next contract renewal. Please review.",
    prompt_kr:
      "상가 건물주의 임대료 인상 통보에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 반면'과 '-을 감안하여'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a commercial landlord's rent-increase notice. Use '-는 반면' and '-을 감안하여'.",
    example_kr:
      "건물주님, 안내해 주셔서 감사합니다. 관리비가 상승한 사정은 이해가 되는 반면, 최근 저희 매장의 매출이 오히려 감소하고 있어 10% 인상은 부담이 상당히 크다는 점을 말씀드리고 싶습니다. 지난 3년간 임대료를 성실히 납부해 온 점을 감안하여 인상 폭을 5% 선으로 조정해 주실 수 있을지 정중히 요청드립니다. 어렵다면 인상 시기를 6개월 정도 유예해 주시는 방안도 고려해 주시면 감사하겠습니다. 저희도 매장 운영 효율을 높이기 위한 노력을 병행하겠습니다. 편하신 시간에 직접 뵙고 자세히 논의드릴 수 있을까요. 원만한 협의가 이루어지기를 기대합니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "신청자님, 제출하신 비자 서류 중 재직증명서가 누락되었습니다. 일주일 이내에 추가 서류를 보내 주시기 바랍니다.",
    stimulus_en:
      "Applicant, your submitted visa documents are missing an employment certificate. Please send the additional document within a week.",
    prompt_kr:
      "영사관의 서류 보완 요청에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 이상'과 '-기에 앞서'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a consulate's request for an additional document. Use '-는 이상' and '-기에 앞서'.",
    example_kr:
      "담당자님, 확인해 주셔서 감사합니다. 서류가 누락된 이상 신속하게 보완하는 것이 마땅하다고 생각합니다. 다만 재직증명서를 발급받기에 앞서 회사 인사팀의 승인 절차가 필요하여 이틀 정도의 시간이 걸릴 것 같습니다. 기한 내에 제출하지 못할 경우를 대비하여 미리 양해를 구하고자 이렇게 연락드립니다. 서류가 준비되는 대로 스캔본을 이메일로 먼저 보내 드리고, 원본은 우편으로 뒤이어 발송하겠습니다. 혹시 추가로 더 필요한 서류가 있다면 함께 안내해 주시면 한 번에 준비하겠습니다. 번거롭게 해 드려 죄송하며 빠르게 처리하겠습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "작가님, 저희 박물관에서 다음 전시 기획에 작가님의 작품을 소개하고 싶습니다. 전시 참여 의사가 있으신지 여쭙고 싶습니다.",
    stimulus_en:
      "Dear artist, we'd like to feature your work in our museum's upcoming exhibition. We wanted to ask if you'd be interested in participating.",
    prompt_kr:
      "박물관 큐레이터의 전시 협업 제안에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-을 계기로'와 '-는 셈이다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a museum curator's exhibition collaboration proposal. Use '-을 계기로' and '-는 셈이다'.",
    example_kr:
      "큐레이터님, 귀한 제안 주셔서 진심으로 감사드립니다. 이번 전시를 계기로 그동안 개인 작업실에만 머물러 있던 작품들을 대중에게 선보일 수 있다면 저에게도 뜻깊은 경험이 될 것 같습니다. 다만 전시할 작품 수와 공간 규모를 먼저 파악해야 어떤 작품을 준비할지 정할 수 있을 것 같습니다. 전시 참여를 수락한다면 사실상 앞으로 몇 달간 이 작업에 집중하는 셈이라, 일정 조율이 우선 필요합니다. 작품 운송 및 보험 문제는 어떻게 처리되는지도 미리 안내받고 싶습니다. 세부 조건이 정리되면 정식으로 참여 의사를 말씀드리겠습니다. 좋은 기회를 주셔서 다시 한번 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "연구자님, 신청하신 연구비 지원이 심사를 거쳐 요청하신 금액의 60% 수준으로 승인되었습니다. 세부 계획을 조정하여 다시 제출해 주시기 바랍니다.",
    stimulus_en:
      "Dear researcher, your requested research grant has been approved at 60% of the amount requested. Please revise your detailed plan and resubmit.",
    prompt_kr:
      "연구비 지원 위원회의 부분 승인 통보에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-던 것에 비하면'과 '-을 뿐만 아니라'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a grant committee's partial-approval notice. Use '-던 것에 비하면' and '-을 뿐만 아니라'.",
    example_kr:
      "위원회 관계자분들께, 승인 소식을 전해 주셔서 감사합니다. 처음 신청했던 것에 비하면 지원 금액이 다소 줄었지만, 지원을 받을 수 있다는 사실만으로도 큰 힘이 됩니다. 예산이 축소된 만큼 연구 범위를 조정할 뿐만 아니라 일부 실험 방법도 간소화해야 할 것 같습니다. 조정된 계획서는 2주 이내에 다시 제출하도록 하겠습니다. 혹시 예산 조정에 참고할 만한 가이드라인이 있다면 함께 안내해 주시면 감사하겠습니다. 제한된 예산 안에서도 연구의 본질적인 목표는 지키도록 최선을 다하겠습니다. 다시 한번 지원해 주셔서 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "작가님, 보내 주신 칼럼 잘 읽었습니다. 다만 후반부 주장이 다소 논쟁적으로 느껴질 수 있어 톤을 조금 완화해 주실 수 있을까요?",
    stimulus_en:
      "We read your column. However, the argument in the latter half might come across as overly contentious — could you soften the tone a bit?",
    prompt_kr:
      "신문 칼럼 편집자의 톤 완화 요청에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 한편'과 '-을 따름이다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a newspaper op-ed editor's request to soften the tone. Use '-는 한편' and '-을 따름이다'.",
    example_kr:
      "편집자님, 꼼꼼히 읽어 주셔서 감사합니다. 편집자님의 우려에 공감하는 한편, 이 주제만큼은 다소 강한 어조로 문제를 제기하고 싶었던 저의 의도도 함께 말씀드리고 싶습니다. 다만 독자들에게 불필요한 반감을 사는 것은 저 역시 원치 않을 따름이라, 결론 부분의 표현을 조금 더 완곡하게 다듬어 보겠습니다. 핵심 주장 자체는 유지하되, 근거를 좀 더 보강하여 설득력을 높이는 방향으로 수정하겠습니다. 수정본은 내일 오전까지 보내 드릴 수 있을 것 같습니다. 혹시 특정 문장이나 표현 중에 더 손봐야 할 부분이 있다면 구체적으로 짚어 주시면 감사하겠습니다. 세심한 검토에 다시 한번 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "김도윤 사원님, 최근 세 달간 지각 횟수가 규정을 초과하였습니다. 사유서를 제출해 주시고 앞으로 개선해 주시기 바랍니다.",
    stimulus_en:
      "Mr. Kim Do-yun, your tardiness over the past three months has exceeded company policy. Please submit a written explanation and improve going forward.",
    prompt_kr:
      "인사팀의 근태 경고에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 데 그치지 않고'와 '-지 않을 수 없었다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to an HR department's attendance warning. Use '-는 데 그치지 않고' and '-지 않을 수 없었다'.",
    example_kr:
      "담당자님, 지적해 주셔서 감사합니다. 최근 개인적인 사정으로 새벽에 병원을 오가는 일이 잦아 부득이하게 지각하지 않을 수 없었던 사정이 있었습니다. 다만 이는 단순히 개인 사정을 해명하는 데 그치지 않고, 제가 미리 팀에 상황을 공유하지 못한 잘못도 있었다는 점을 인정합니다. 다음 주부터는 유연근무제를 신청하여 출근 시간을 조정하고자 하는데 가능한지 문의드립니다. 그전까지는 알람을 다중으로 설정하는 등 개인적으로도 개선 노력을 기울이겠습니다. 사유서는 오늘 중으로 작성하여 제출하겠습니다. 다시는 이런 일이 반복되지 않도록 각별히 신경 쓰겠습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "이사님, 갑작스러운 사퇴 소식에 이사회 전체가 놀랐습니다. 구체적인 경위를 설명해 주실 수 있을까요?",
    stimulus_en:
      "Director, your sudden resignation has surprised the entire board. Could you explain the specific circumstances?",
    prompt_kr:
      "이사회의 사퇴 경위 문의에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는가 하면'과 '-을 앞두고'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a board's inquiry about the circumstances of a resignation. Use '-는가 하면' and '-을 앞두고'.",
    example_kr:
      "이사회 여러분께, 갑작스러운 소식에 놀라셨을 텐데 먼저 양해를 구합니다. 사퇴를 결심하기까지 회사에 대한 애정이 여전히 큰가 하면, 동시에 개인적으로 건강상의 이유로 더 이상 무리하기 어려운 상황도 있었습니다. 예정된 신사업 확장을 앞두고 이런 결정을 내리게 되어 죄송한 마음이 큽니다. 다만 인수인계는 책임감 있게 마무리하고자, 앞으로 한 달간은 후임자 선정과 업무 이관에 적극 협조하겠습니다. 회사의 향후 방향에 대해서는 언제든 자문 형태로 도움을 드릴 수 있습니다. 그동안의 신뢰에 깊이 감사드리며, 자세한 사정은 다음 이사회에서 직접 말씀드리겠습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "담당자님, 최근 내부 예산 재편으로 인해 다음 시즌부터는 귀 단체에 대한 후원을 중단하게 되었음을 알려 드립니다.",
    stimulus_en:
      "We regret to inform you that due to internal budget restructuring, we will be discontinuing our sponsorship of your organization starting next season.",
    prompt_kr:
      "후원 기업의 후원 중단 통보에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 이상'과 '-지 않을 수 없다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a corporate sponsor's notice of withdrawing support. Use '-는 이상' and '-지 않을 수 없다'.",
    example_kr:
      "담당자님, 그동안의 후원에 먼저 깊이 감사드립니다. 예산 재편이라는 내부 사정인 이상 저희가 강하게 만류하기는 어렵다는 점을 이해합니다. 다만 이번 후원이 저희 단체 운영에 큰 비중을 차지했던 만큼 아쉬움을 표하지 않을 수 없습니다. 혹시 전면 중단이 아니라 후원 규모를 축소하는 방향으로 조정할 여지는 없는지 조심스럽게 여쭙고 싶습니다. 어렵다면 소액 후원이나 물품 후원 등 다른 형태의 지원 가능성도 함께 검토해 주실 수 있을까요. 그동안 함께해 주신 시간에 진심으로 감사드립니다. 향후 상황이 나아지면 다시 협력할 수 있기를 바랍니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "저자분들께, 두 번째 심사위원으로서 논문을 검토한 결과 방법론은 타당하나 선행 연구 검토가 다소 미흡하다고 판단됩니다. 보완 부탁드립니다.",
    stimulus_en:
      "Dear authors, as the second reviewer, I found the methodology sound, but the literature review appears insufficient. Please strengthen it.",
    prompt_kr:
      "학술지 심사위원의 코멘트에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-던 것과는 달리'와 '-을 계기로'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a journal's second reviewer's comments. Use '-던 것과는 달리' and '-을 계기로'.",
    example_kr:
      "심사위원님, 세심한 검토에 감사드립니다. 저희가 처음 계획했던 것과는 달리, 지면의 제약으로 선행 연구를 다소 축약해서 다루었던 점을 이번 지적을 계기로 다시 인식하게 되었습니다. 관련 분야의 최근 5년 치 연구를 추가로 검토하여 이론적 배경을 보강하도록 하겠습니다. 특히 지적해 주신 방법론적 유사 연구들을 중심으로 비교표를 추가할 예정입니다. 수정본은 4주 이내에 제출할 수 있을 것으로 예상됩니다. 혹시 특별히 참고해야 할 문헌이 있다면 추천해 주시면 큰 도움이 될 것 같습니다. 귀중한 의견 다시 한번 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "주민 여러분, 인근 부지의 용도 변경과 관련하여 다음 달 공청회를 개최합니다. 의견이 있으신 분은 서면으로 제출해 주시기 바랍니다.",
    stimulus_en:
      "Dear residents, we're holding a public hearing next month regarding the rezoning of the nearby lot. Please submit any opinions in writing.",
    prompt_kr:
      "시의회의 공청회 안내문에 반대 의견을 담아 답하는 답장을 여섯 문장 이상으로 써 보세요. '-을 막론하고'와 '-는 데 반해'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a city council's public hearing notice, expressing opposition. Use '-을 막론하고' and '-는 데 반해'.",
    example_kr:
      "관계자분들께, 공청회 개최를 알려 주셔서 감사합니다. 개발의 필요성을 막론하고 해당 부지가 오랫동안 주민들의 산책로로 이용되어 온 공간이라는 점을 먼저 말씀드리고 싶습니다. 시의 입장에서는 세수 증대를 기대하시는 데 반해, 저희 주민들은 녹지 축소로 인한 생활환경 악화를 우려하고 있습니다. 공청회 전에 구체적인 개발 계획과 환경영향평가 자료를 미리 열람할 수 있도록 해 주시면 좋겠습니다. 반대 의견뿐만 아니라 대안이 될 만한 절충안도 함께 준비하여 참석하고자 합니다. 서면 의견서는 이번 주 안으로 제출하겠습니다. 주민들의 목소리가 충분히 반영되기를 바랍니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "선생님, 제안해 주신 워크숍 프로그램을 검토했는데 대상 연령층이 저희 센터 방향과 다소 맞지 않아 이번 학기에는 진행이 어려울 것 같습니다.",
    stimulus_en:
      "We reviewed your proposed workshop program, but the target age group doesn't quite fit our center's direction, so we won't be able to run it this semester.",
    prompt_kr:
      "문화센터의 워크숍 제안 반려 메일에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-을 따름이다'와 '-는 대신에'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a cultural center's rejection of your workshop proposal. Use '-을 따름이다' and '-는 대신에'.",
    example_kr:
      "담당자님, 진지하게 검토해 주셔서 감사할 따름입니다. 아쉬운 결과지만 센터의 방향성을 존중합니다. 다만 대상 연령을 전면 수정하는 대신에, 성인 대상으로 눈높이를 조정한 축소 버전을 제안드려도 괜찮을지 여쭙고 싶습니다. 혹시 센터에서 현재 부족하다고 느끼시는 프로그램 영역이 있다면 알려 주시면 그에 맞춰 새롭게 기획해 보겠습니다. 당장 이번 학기가 어렵다면 다음 학기 일정도 열려 있습니다. 시간 내어 검토해 주셔서 감사드리며, 다른 형태로라도 협업할 기회가 있기를 바랍니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "입주민님, 문의하신 관리비 산정 내역을 확인한 결과 오류는 없는 것으로 확인되었습니다. 추가 문의 사항이 있으시면 답변 부탁드립니다.",
    stimulus_en:
      "We've reviewed the maintenance fee calculation you inquired about and found no errors. Please let us know if you have further questions.",
    prompt_kr:
      "관리사무소의 관리비 답변에 재이의를 제기하는 답장을 여섯 문장 이상으로 써 보세요. '-는 이상'과 '-지 않을 수 없다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences raising a further objection to a management office's fee-inquiry response. Use '-는 이상' and '-지 않을 수 없다'.",
    example_kr:
      "관리사무소 담당자님, 확인해 주셔서 감사합니다. 산정 방식에 오류가 없다고 회신을 주신 이상 저희도 그 결과를 존중하고자 합니다. 다만 지난달 대비 관리비가 20% 이상 급등한 이유가 여전히 명확하지 않아 재차 문의드리지 않을 수 없습니다. 구체적으로 어느 항목에서 증가가 발생했는지 세부 내역서를 보내 주실 수 있을까요. 공용 전기료 인상이 원인이라면 관련 근거 자료도 함께 확인하고 싶습니다. 다음 입주자 대표 회의 안건으로도 이 문제를 올려 주시면 감사하겠습니다. 신속한 답변 부탁드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "오랜만이네, 그때 내가 서운하게 했던 거 계속 마음에 걸렸어. 늦었지만 사과하고 싶어서 연락했어. 받아 줄 수 있을까?",
    stimulus_en:
      "It's been a while. I've kept thinking about how I hurt you back then. I know it's late, but I wanted to apologize. Can you accept it?",
    prompt_kr:
      "오랜 침묵 끝에 사과를 전한 옛 멘토에게 답하는 답장을 여섯 문장 이상으로 써 보세요. '-을 계기로'와 '-는 셈이다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to an old mentor's apology after a long silence. Use '-을 계기로' and '-는 셈이다'.",
    example_kr:
      "연락 주셔서 정말 반갑고 놀랍습니다. 그때는 서운한 마음이 컸던 것도 사실이지만, 시간이 지나며 저도 나름대로 그 경험을 성장의 발판으로 삼았던 것 같습니다. 오늘 이렇게 사과를 전해 주신 것을 계기로, 오래 묵혀 두었던 마음의 짐을 저도 내려놓을 수 있게 되었습니다. 사실 그 일이 있고 나서 한동안은 관계를 완전히 정리한 셈이라 다시 연락드릴 생각은 못 했었습니다. 하지만 이렇게 먼저 손을 내밀어 주셔서 오히려 감사한 마음이 큽니다. 언제 시간 되실 때 편하게 만나서 그동안 못다 한 이야기도 나누고 싶습니다. 늦었지만 진심 어린 사과, 잘 받았습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "여러분, 그동안 감사했습니다. 다음 주가 마지막 출근이라 미리 인사드립니다. 앞으로도 좋은 인연 이어 갔으면 좋겠습니다.",
    stimulus_en:
      "Everyone, thank you for everything. Next week will be my last day, so I wanted to say goodbye in advance. I hope we stay in touch.",
    prompt_kr:
      "퇴사하는 동료의 인사 메시지에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-던 것에 비하면'과 '-을 계기로'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a resigning coworker's farewell message. Use '-던 것에 비하면' and '-을 계기로'.",
    example_kr:
      "소식 듣고 많이 아쉬운 마음이 앞섭니다. 처음 입사했을 때 서로 서먹했던 것에 비하면 지난 3년간 정말 많은 일을 함께 겪으며 가까워졌다는 생각이 듭니다. 이번 퇴사를 계기로 저 역시 그동안 당연하게 여겼던 팀워크의 소중함을 다시 느끼게 되었습니다. 새로운 곳에서도 지금처럼 좋은 동료로 자리 잡으실 거라 믿습니다. 마지막 출근일 전에 다 같이 식사 자리를 마련하고 싶은데 시간 괜찮으실까요. 앞으로도 종종 연락 주고받으며 지냈으면 좋겠습니다. 그동안 정말 고생 많으셨고 감사했습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "대표님, 지난달 납품한 물량에 대한 대금이 아직 입금되지 않았습니다. 확인 부탁드리며, 빠른 처리를 요청드립니다.",
    stimulus_en:
      "CEO, the payment for last month's delivered goods has not yet been received. Please check and process it promptly.",
    prompt_kr:
      "하청업체의 대금 지급 지연 항의에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-지 않을 수 없었다'와 '-을 무릅쓰고'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a subcontractor's complaint about a delayed payment. Use '-지 않을 수 없었다' and '-을 무릅쓰고'.",
    example_kr:
      "대표님, 먼저 대금 지급이 지연된 점에 대해 깊이 사과드립니다. 이번 달 저희 회사의 자금 흐름에 예상치 못한 문제가 생겨 부득이하게 지급을 미루지 않을 수 없었던 사정이 있었습니다. 불편을 드리는 것을 무릅쓰고 부탁드리자면, 전체 금액을 이번 주와 다음 주에 나누어 지급하는 방식으로 조정해 주실 수 있을지 정중히 요청드립니다. 지연에 대한 지연이자도 함께 산정하여 지급하겠습니다. 이런 상황이 반복되지 않도록 자금 관리 체계를 재정비하고 있습니다. 신뢰를 저버리지 않도록 최선을 다해 처리하겠습니다. 다시 한번 불편을 드려 죄송합니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "번역가님, 최근 시장 상황으로 인해 이번 프로젝트부터 단가를 페이지당 10% 낮춰 진행하고자 합니다. 협조 부탁드립니다.",
    stimulus_en:
      "Translator, due to recent market conditions, we'd like to lower the rate by 10% per page starting with this project. We ask for your cooperation.",
    prompt_kr:
      "번역 에이전시의 단가 인하 요청에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 반면'과 '-을 감안하여'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a translation agency's request to lower rates. Use '-는 반면' and '-을 감안하여'.",
    example_kr:
      "담당자님, 상황을 설명해 주셔서 감사합니다. 시장 상황이 어려운 것은 이해하는 반면, 최근 물가와 작업 부담을 고려하면 10% 인하는 저에게 상당히 큰 폭으로 느껴집니다. 그동안 마감을 한 번도 어긴 적이 없다는 점을 감안하여 인하 폭을 5%로 조정해 주실 수 있을지 제안드립니다. 어렵다면 이번 프로젝트에 한해서만 인하된 단가를 적용하고 이후에는 원래 단가로 복귀하는 방안도 고려해 주시면 감사하겠습니다. 계속해서 좋은 품질로 함께하고 싶은 마음은 변함없습니다. 협의된 내용은 서면으로 다시 정리해 주시면 좋겠습니다. 빠른 답변 기다리겠습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "작가님, 원고 잘 받았습니다. 다만 초반부 전개가 다소 느려서 독자들의 흥미를 끌기 어려울 것 같습니다. 첫 세 챕터를 손봐 주실 수 있을까요?",
    stimulus_en:
      "I received your manuscript. However, the pacing in the opening feels slow and may struggle to hook readers. Could you rework the first three chapters?",
    prompt_kr:
      "문학 에이전트의 수정 요구에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-을 따름이다'와 '-는 한편'을 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a literary agent's revision request. Use '-을 따름이다' and '-는 한편'.",
    example_kr:
      "에이전트님, 예리한 의견 감사할 따름입니다. 초반부를 천천히 쌓아 올리려는 의도가 있었던 한편, 독자 입장에서는 지루하게 느껴질 수 있다는 지적에 저도 동의합니다. 첫 챕터의 도입부를 조금 더 극적인 장면으로 바꾸고, 인물 소개는 이후 흐름 속에 자연스럽게 녹여 보려 합니다. 다만 전체 구조를 크게 흔들지 않는 선에서 수정하고 싶은데 괜찮을지 여쭙고 싶습니다. 수정에는 3주 정도 시간이 필요할 것 같습니다. 수정 방향을 요약해서 먼저 보내 드려도 괜찮을까요. 소중한 피드백 다시 한번 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "고객님, 매도인 측에서 제시하신 가격보다 3천만 원 높은 금액을 역제안했습니다. 검토 후 회신 부탁드립니다.",
    stimulus_en:
      "Client, the seller has countered with an offer 30 million won higher than what you proposed. Please review and respond.",
    prompt_kr:
      "부동산 중개인의 역제안에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 데 반해'와 '-을 감안하여'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a real estate agent's counteroffer. Use '-는 데 반해' and '-을 감안하여'.",
    example_kr:
      "중개인님, 소식 전해 주셔서 감사합니다. 매도인 측 사정은 이해가 되는 데 반해, 저희가 처음 책정한 예산과는 상당한 차이가 있어 그대로 수락하기는 어려울 것 같습니다. 최근 주변 시세와 매물 상태를 감안하여 1천5백만 원 정도 인상된 금액으로 재협상을 제안드리고 싶습니다. 매도인께서 어떤 부분 때문에 가격을 올리셨는지 구체적인 이유를 알 수 있다면 협상에 도움이 될 것 같습니다. 만약 가격 조정이 어렵다면 잔금 일정이나 옵션 포함 여부 등 다른 조건으로 절충할 여지도 열어 두고 있습니다. 이번 주 안으로 매도인 측 답변을 받아 주실 수 있을까요. 원만한 협상이 이루어지기를 바랍니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "고객님, 신청하신 대출 심사를 위해 소득 증빙 서류와 재직증명서가 추가로 필요합니다. 이번 주 안으로 제출해 주시기 바랍니다.",
    stimulus_en:
      "Dear customer, additional income verification and an employment certificate are required to process your loan application. Please submit them within this week.",
    prompt_kr:
      "은행 대출 담당자의 추가 서류 요청에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 이상'과 '-기에 앞서'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a bank loan officer's request for additional documents. Use '-는 이상' and '-기에 앞서'.",
    example_kr:
      "담당자님, 안내해 주셔서 감사합니다. 대출 심사에 필요한 절차인 이상 최대한 빠르게 협조하겠습니다. 다만 서류를 제출하기에 앞서 재직증명서 발급에 보통 3일 정도 소요된다고 들어서 기한을 며칠 늦춰 주실 수 있는지 여쭙고 싶습니다. 소득 증빙 서류는 오늘 중으로 준비해서 먼저 보내 드리겠습니다. 혹시 프리랜서 소득도 함께 인정받을 수 있는지, 관련 증빙은 어떤 형태로 제출해야 하는지도 안내해 주시면 감사하겠습니다. 서류가 모두 준비되는 대로 지점을 직접 방문해도 괜찮을지 궁금합니다. 빠른 진행을 위해 최선을 다해 협조하겠습니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "지원자님, 심사 결과 조건부로 장학생에 선발되셨습니다. 다음 학기 평균 학점 3.5 이상을 유지하셔야 최종 확정됩니다.",
    stimulus_en:
      "Applicant, you've been conditionally selected as a scholarship recipient. You must maintain a GPA of 3.5 or above next semester to be finalized.",
    prompt_kr:
      "장학위원회의 조건부 합격 통보에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 만큼'과 '-지 않을 수 없다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a scholarship committee's conditional offer. Use '-는 만큼' and '-지 않을 수 없다'.",
    example_kr:
      "위원회 관계자분들께, 선발 소식을 전해 주셔서 진심으로 감사드립니다. 조건부이기는 하지만 이런 기회를 얻었다는 것만으로도 기쁘지 않을 수 없습니다. 이 장학금이 저에게는 학업을 이어 갈 수 있는 중요한 발판인 만큼 성적 유지를 위해 최선을 다하겠습니다. 이번 학기부터 학습 계획을 새롭게 세우고 교내 학습 지원 프로그램도 적극 활용해 보려 합니다. 혹시 성적 관리에 어려움이 생길 경우 상담을 받을 수 있는 창구가 있는지도 궁금합니다. 이 기회를 헛되이 하지 않도록 성실히 임하겠습니다. 다시 한번 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "회원님, 협회 운영비 증가로 인해 다음 해부터 연회비를 15% 인상하고자 합니다. 의견이 있으시면 회신 부탁드립니다.",
    stimulus_en:
      "Dear member, due to increased operating costs, we plan to raise the annual membership fee by 15% starting next year. Please reply with any feedback.",
    prompt_kr:
      "전문 협회의 회비 인상 안내에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 데 반해'와 '-을 막론하고'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a professional association's notice of a membership fee increase. Use '-는 데 반해' and '-을 막론하고'.",
    example_kr:
      "협회 관계자분들께, 안내해 주셔서 감사합니다. 운영비 증가라는 사정은 이해가 되는 데 반해, 최근 회원들에게 제공되는 실질적인 혜택은 크게 늘지 않은 것 같아 아쉬운 마음도 있습니다. 인상의 필요성을 막론하고, 인상분이 구체적으로 어떤 항목에 쓰이는지 투명하게 공개해 주시면 회원들의 이해를 얻는 데 도움이 될 것 같습니다. 예를 들어 세미나나 네트워킹 행사 등 회원 대상 프로그램이 확대된다면 인상에 대한 공감대도 커질 것입니다. 저 개인적으로는 인상안에 동의하지만, 단계적으로 나누어 인상하는 방안도 함께 검토해 주시면 좋겠습니다. 다음 총회에서 이 안건에 대해 자세히 논의할 수 있기를 바랍니다. 의견 청취해 주셔서 감사합니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "참가자님, 예정되어 있던 행사가 시설 문제로 인해 2주 연기되었음을 알려 드립니다. 변경된 일정에 참석 가능하신지 확인 부탁드립니다.",
    stimulus_en:
      "Dear participant, we regret to inform you that the scheduled event has been postponed by two weeks due to facility issues. Please confirm your availability for the new date.",
    prompt_kr:
      "행사 코디네이터의 행사 연기 통보에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-던 것과는 달리'와 '-을 계기로'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to an event coordinator's postponement notice. Use '-던 것과는 달리' and '-을 계기로'.",
    example_kr:
      "코디네이터님, 안내해 주셔서 감사합니다. 처음 계획했던 것과는 달리 일정이 미뤄져 다소 아쉽지만, 시설 문제라면 불가피한 결정이었을 것이라 이해합니다. 마침 이번 연기를 계기로 저 역시 준비 자료를 조금 더 보완할 수 있는 시간을 얻게 되어 나쁘지만은 않습니다. 다만 변경된 날짜가 회사 워크숍 일정과 겹쳐서 오전 대신 오후 시간대로 조정이 가능한지 여쭙고 싶습니다. 어렵다면 온라인으로 병행 참여할 수 있는 방법이 있는지도 알려 주시면 감사하겠습니다. 확정된 일정은 이번 주 안으로 다시 안내해 주시면 좋겠습니다. 변동 사항 챙겨 주셔서 감사합니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "팀장님, 최근 진행하신 프로모션 문구 중 일부가 사내 광고 규정에 위배되는 것으로 확인되어 시정 조치를 요청드립니다.",
    stimulus_en:
      "Team lead, some of the wording in your recent promotion has been found to violate internal advertising policy. We're requesting corrective action.",
    prompt_kr:
      "컴플라이언스 담당자의 정책 위반 지적에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 데 그치지 않고'와 '-지 않을 수 없었다'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a compliance officer's notice about a policy violation. Use '-는 데 그치지 않고' and '-지 않을 수 없었다'.",
    example_kr:
      "담당자님, 확인해 주셔서 감사합니다. 규정을 꼼꼼히 살피지 못한 채 문구를 확정한 점에 대해 책임을 느끼지 않을 수 없었습니다. 다만 이번 일을 단순히 사과로 마무리하는 데 그치지 않고, 향후 유사한 실수가 반복되지 않도록 프로모션 문구 검토 단계에 컴플라이언스 확인 절차를 추가하고자 합니다. 문제가 된 문구는 오늘 중으로 전면 수정하여 재게시하겠습니다. 구체적으로 어느 조항에 저촉되었는지 상세히 안내해 주시면 재발 방지 교육 자료로 활용하고 싶습니다. 팀 전체를 대상으로 관련 규정 재교육도 이번 주 안에 진행하겠습니다. 지적해 주셔서 다시 한번 감사드립니다.",
  },
  {
    level: "C1",
    genre: "reply",
    stimulus_kr:
      "연구자님, 제출하신 연구계획서 중 피험자 동의 절차 관련 항목에 대해 추가 소명이 필요합니다. 자세한 설명 부탁드립니다.",
    stimulus_en:
      "Dear researcher, we need further clarification regarding the participant consent procedure in your submitted research plan. Please provide a detailed explanation.",
    prompt_kr:
      "연구윤리위원회의 소명 요청에 답하는 답장을 여섯 문장 이상으로 써 보세요. '-는 이상'과 '-기에 앞서'를 사용하세요.",
    prompt_en:
      "Write a reply of six or more sentences to a research ethics board's request for clarification. Use '-는 이상' and '-기에 앞서'.",
    example_kr:
      "위원회 관계자분들께, 검토해 주셔서 감사합니다. 연구윤리에 관한 사안인 이상 명확하게 소명하는 것이 당연하다고 생각합니다. 다만 절차를 다시 설명드리기에 앞서, 어느 부분이 불명확하게 기술되었는지 구체적으로 짚어 주시면 더 정확한 답변을 드릴 수 있을 것 같습니다. 저희는 피험자 모집 단계에서 서면 동의서를 받고, 참여 도중 언제든 철회할 수 있음을 사전에 고지하고 있습니다. 관련 동의서 양식과 절차를 문서로 정리하여 이번 주 안에 제출하겠습니다. 필요하다면 담당 연구원과의 면담 자리도 마련하겠습니다. 신속하고 성실하게 소명하도록 하겠습니다.",
  },
];
