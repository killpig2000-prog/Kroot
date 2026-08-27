import type { RawPrompt } from "./types";

export const WRITING_C2_REPLY: RawPrompt[] = [
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "작가님, 원고를 꼼꼼히 검토했습니다. 주제 의식은 인정하지만 후반부 전개가 다소 늘어지고, 저희 출판사의 올해 라인업과는 결이 맞지 않는 것 같습니다. 아쉽지만 이번 원고는 출간이 어렵겠습니다.",
    stimulus_en:
      "Dear Author, we reviewed your manuscript closely. We recognize its thematic ambition, but the second half drags, and it doesn't quite fit our list for this year. Regrettably, we cannot publish this manuscript.",
    prompt_kr:
      "출판사의 거절 편지에 정중히 이의를 제기하면서도 결정을 받아들이는 답장을 일곱 문장 이상으로 써 보세요. '-에 지나지 않는다'와 '-(으)ㄹ지언정'을 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a publisher's rejection letter, politely pushing back while ultimately accepting the decision. Use '-에 지나지 않는다' and '-(으)ㄹ지언정'.",
    example_kr:
      "보내주신 검토 의견, 성의를 다해 읽어주신 흔적이 느껴져 감사한 마음이 먼저 듭니다. 다만 후반부의 속도감에 대한 지적은 제 의도와 다소 결이 다르다는 점을 조심스럽게 말씀드리고 싶습니다. 그 대목의 느린 호흡은 미숙함의 결과라기보다 인물의 침잠을 드러내기 위한 장치에 지나지 않았습니다. 물론 그 의도가 독자에게 온전히 가닿지 못했다면 그것은 전적으로 제 필력의 한계일지언정 편집자님의 판단이 부당하다는 뜻은 결코 아닙니다. 라인업과의 결이 맞지 않는다는 말씀 또한 겸허히 받아들이겠습니다, 출판이란 결국 시장과 시의를 함께 읽어야 하는 작업이니까요. 다만 다음 기회가 있다면 후반부를 다시 다듬어 다른 형태로 보여드리고 싶은 마음은 여전합니다. 이번 결정에 서운함이 없다고는 못하겠지만, 솔직한 의견을 주신 것에 대해서는 진심으로 감사드립니다. 앞으로도 좋은 원고로 다시 인연이 닿기를 바라겠습니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "선생님, 투고하신 논문을 검토한 결과 표본 설계에 근본적인 결함이 있다고 판단됩니다. 결론의 상당 부분이 통계적으로 뒷받침되지 않으며, 이대로는 게재를 권할 수 없습니다.",
    stimulus_en:
      "Dear Author, having reviewed your submitted paper, we believe there is a fundamental flaw in the sample design. Much of your conclusion is not statistically supported, and we cannot recommend it for publication as it stands.",
    prompt_kr:
      "심사자의 비판적 리뷰에 학문적으로 반박하면서도 일부는 수용하는 답장을 일곱 문장 이상으로 써 보세요. '-거니와'와 '-지 않을 수 없다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences academically rebutting a peer reviewer's critique while accepting some points. Use '-거니와' and '-지 않을 수 없다'.",
    example_kr:
      "심사자님의 세심한 검토에 먼저 감사의 말씀을 드립니다. 표본 크기에 대한 지적은 타당하거니와, 저 역시 그 한계를 인지하고 있었으나 논의에 충분히 반영하지 못한 점을 인정하지 않을 수 없습니다. 다만 표본 설계 자체가 근본적으로 결함이 있다는 판단에는 조심스럽게 이견을 제시하고 싶습니다. 층화 추출 방식은 해당 분야의 선행 연구들에서도 널리 채택되어 온 방법이거니와, 저희가 사용한 기준 역시 그 관례에서 벗어나지 않습니다. 다만 결론부의 통계적 근거가 다소 성급하게 제시되었다는 지적은 겸허히 받아들이지 않을 수 없습니다. 이에 결론을 수정하여 인과적 표현을 상관관계 수준으로 낮추고, 한계점을 별도 절로 명시하겠습니다. 표본 설계와 관련해서는 방법론 절에 정당성을 뒷받침하는 참고문헌을 추가로 보강하겠습니다. 재심사 기회를 주신다면 수정본을 통해 지적하신 부분들을 성실히 반영하겠습니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "이사장님, 이번 예산안에서 신규 사업 항목이 지나치게 낙관적인 수익 전망에 기대고 있다는 우려를 표합니다. 이사회에서 다시 한번 근거를 제시해 주시기 바랍니다.",
    stimulus_en:
      "Chairman, I'm concerned that the new-initiative line item in this budget proposal relies on overly optimistic revenue projections. I'd like you to present stronger justification to the board.",
    prompt_kr:
      "이사회 구성원의 이의 제기에 근거를 보강하며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-으로 말미암아'와 '-을 감안하더라도'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a board member's challenge, reinforcing your justification with data. Use '-으로 말미암아' and '-을 감안하더라도'.",
    example_kr:
      "예산안에 대한 우려를 직접 말씀해 주셔서 감사합니다, 신중한 검토야말로 이사회가 존재하는 이유일 것입니다. 지적하신 대로 수익 전망의 상단이 다소 공격적으로 설정된 것은 사실이며, 이 점은 재검토가 필요하다고 저 역시 동의합니다. 다만 최근 시장 재편으로 말미암아 해당 영역의 수요가 예년과는 다른 흐름을 보이고 있다는 점을 함께 고려해 주셨으면 합니다. 경쟁사들의 진입 지연을 감안하더라도, 저희가 확보한 초기 계약 규모는 결코 근거 없는 낙관이 아님을 말씀드리고 싶습니다. 물론 이 전망이 빗나갈 위험을 완전히 배제할 수는 없으므로, 보수적 시나리오를 별도로 첨부하여 다음 회의에 제출하겠습니다. 아울러 첫 두 분기의 실적을 기준으로 예산을 재조정할 수 있는 조항도 포함시키겠습니다. 이사회의 신중한 시각이 오히려 이 사업의 완성도를 높이는 계기가 되리라 믿습니다. 수정된 자료는 이번 주 안으로 공유드리겠습니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "귀하의 지난 인터뷰 발언은 저희 단체 회원들에게 큰 상처를 주었습니다. 공식적인 사과문을 발표해 주실 것을 강력히 요청드립니다.",
    stimulus_en:
      "Your recent interview remarks caused significant hurt to the members of our organization. We strongly request that you issue a formal public apology.",
    prompt_kr:
      "공개 사과를 요구하는 단체에 자신의 입장을 밝히며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-는 법이다'와 '-을 무릅쓰고'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences responding to a group's demand for a public apology, stating your position. Use '-는 법이다' and '-을 무릅쓰고'.",
    example_kr:
      "먼저 저의 발언으로 인해 상처받으신 분들이 계시다는 사실을 알게 되어 마음이 무겁습니다. 말이란 화자의 의도를 벗어나 전혀 다른 방식으로 가닿는 법이라는 것을 이번 일을 통해 다시금 절감했습니다. 다만 제 발언의 취지가 왜곡되어 전달되었을 가능성도 있다고 생각하여, 오해의 위험을 무릅쓰고 그날의 맥락을 다시 한번 설명드리고자 합니다. 저는 특정 집단을 폄하할 의도가 전혀 없었으며, 오히려 그 반대의 입장을 전달하려 했던 것입니다. 그럼에도 불구하고 제 표현 방식이 신중하지 못했다는 지적에는 변명의 여지가 없다고 생각합니다. 이에 상처를 드린 부분에 대해서는 진심으로 사과드리며, 향후 발언에 있어 더욱 세심한 언어를 사용하도록 노력하겠습니다. 다만 발언 전체를 부정하는 형태의 사과문보다는, 제 취지를 함께 설명하는 방식의 입장문을 준비하고자 하니 이해를 구합니다. 조만간 정리된 입장문을 별도로 보내드리겠습니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "귀 기관의 지원 신청이 최종 승인되었음을 알려드립니다. 다만 지원금은 반드시 명시된 세부 항목에만 사용되어야 하며, 매 분기 상세 지출 보고서를 제출해야 합니다.",
    stimulus_en:
      "We are pleased to inform you that your organization's grant application has been approved. However, the funds must be used strictly for the specified line items, and a detailed expenditure report must be submitted quarterly.",
    prompt_kr:
      "재단의 지원금 조건 통보에 일부 조정을 요청하는 답장을 일곱 문장 이상으로 써 보세요. '-을 전제로'와 '-는 것에 불과하다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a foundation's grant-conditions letter, requesting some flexibility. Use '-을 전제로' and '-는 것에 불과하다'.",
    example_kr:
      "저희 기관의 지원 신청을 승인해 주셔서 진심으로 감사드립니다. 재단의 지원은 저희 사업이 한 단계 더 나아가는 데 큰 힘이 될 것입니다. 다만 세부 항목별 집행 조건에 대해서는 한 가지 조정을 부탁드리고 싶습니다. 저희 사업의 특성상 현장 상황이 유동적으로 변한다는 것을 전제로 예산을 편성해 왔는데, 지금의 항목 구분은 이러한 유연성을 다소 제약할 우려가 있습니다. 세부 항목을 지나치게 경직되게 못박아 두면 실제 지원 대상에게 필요한 대응은 형식적인 절차에 불과한 것으로 전락할 위험도 있습니다. 이에 대분류 항목 내에서 소항목 간 최대 15퍼센트까지 조정할 수 있는 재량을 허락해 주실 수 있을지 여쭙고자 합니다. 분기별 지출 보고서 제출 의무는 당연히 성실히 이행하겠으며, 어떠한 형태로도 투명성을 저해하지 않을 것을 약속드립니다. 검토해 주시면 정말 감사하겠습니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "오랜만이야. 그때 내가 너무 심한 말을 했던 것 같아 계속 마음에 걸렸어. 십 년이 지났지만 이제라도 다시 이야기해 보고 싶어서 이렇게 편지를 쓴다. 네가 어떻게 지내는지도 궁금하고.",
    stimulus_en:
      "It's been a long time. I've always felt that what I said back then was too harsh, and it's weighed on me. Ten years later, I wanted to reach out and talk again — and I'm curious how you've been.",
    prompt_kr:
      "십 년 만에 연락한 옛 친구의 화해 편지에 답하는 답장을 일곱 문장 이상으로 써 보세요. '-노라면'과 '-이야말로'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to an estranged old friend's reconciliation letter after ten years. Use '-노라면' and '-이야말로'.",
    example_kr:
      "네 편지를 받고 한참을 가만히 앉아 있었어, 이렇게 다시 네 이름을 보게 될 줄은 몰랐거든. 십 년이라는 시간을 곱씹어 보노라면 그때 우리 사이에 있었던 일들이 참 작게 느껴지기도 해. 사실 나도 그날의 대화를 자주 떠올렸고, 내 쪽에서도 미숙했던 부분이 분명 있었다고 생각해. 오래도록 마음 한구석에 남아 있던 그 앙금을 이제야 풀어놓을 수 있게 되어 다행스럽다는 말밖에는 할 말이 없어. 지나온 시간을 되짚어 보노라면, 결국 우리를 갈라놓았던 건 그 말 한마디가 아니라 서로에게 설명할 기회를 주지 않았던 침묵이었던 것 같아. 지금 이렇게 먼저 손을 내밀어 준 네 용기야말로 그때의 어린 우리보다 훨씬 성숙해진 증거라고 생각해. 나는 요즘 이직을 준비하며 바쁘게 지내고 있는데, 시간이 되면 얼굴 보고 그동안 못다 한 이야기를 나누고 싶어. 답장 정말 고맙고, 언제든 편한 날짜 알려 줘.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "기증해 주신 작품 전시를 앞두고, 작품에 담긴 역사적 맥락 중 논란이 될 수 있는 부분에 대해 관람객에게 어떻게 설명할지 작가님의 의견을 구하고자 합니다.",
    stimulus_en:
      "Ahead of exhibiting your donated work, we'd like your input on how to explain to visitors the potentially controversial historical context embedded in the piece.",
    prompt_kr:
      "박물관의 맥락화 요청에 자신의 의견을 밝히는 답장을 일곱 문장 이상으로 써 보세요. '-을 방불케 하다'와 '-을 막론하고'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a museum's request to help contextualize a controversial work, stating your view. Use '-을 방불케 하다' and '-을 막론하고'.",
    example_kr:
      "작품의 전시를 앞두고 신중하게 의견을 구해 주셔서 감사합니다, 이러한 세심함이야말로 좋은 전시를 만드는 첫걸음이라고 생각합니다. 그 작품이 다루는 시기의 폭력성은 당시 자료를 처음 접했을 때 저에게도 전쟁의 참상을 방불케 하는 충격으로 다가왔습니다. 그렇기에 저는 그 불편함을 지우기보다는 오히려 정직하게 드러내는 방향의 설명을 제안드리고 싶습니다. 관람객의 연령이나 배경을 막론하고 이 작품이 던지는 질문만큼은 왜곡 없이 전달되어야 한다고 믿기 때문입니다. 다만 특정 인물을 지나치게 단정적으로 규정하는 표현은 지양해 주시기를 부탁드립니다. 대신 당시의 여러 기록을 병치하여 관람객이 스스로 판단할 여지를 남겨 두는 해설 방식을 권해 드립니다. 필요하시다면 제가 작품을 제작하며 참고했던 자료 목록도 함께 제공해 드리겠습니다. 전시 준비 과정에서 언제든 다시 의견을 나눌 수 있기를 바랍니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "귀하께서 진행하신 연구 프로젝트와 관련하여 피험자 동의 절차에 문제가 있었다는 제보가 접수되었습니다. 이에 대한 소명을 요청드립니다.",
    stimulus_en:
      "We have received a report alleging issues with the informed-consent procedure in your research project. We request that you provide an explanation.",
    prompt_kr:
      "윤리위원회의 조사 요청에 소명하는 답장을 일곱 문장 이상으로 써 보세요. '-는 데 있다'와 '-을 불문하고'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to an ethics committee's inquiry, providing an explanation. Use '-는 데 있다' and '-을 불문하고'.",
    example_kr:
      "위원회의 연락을 받고 무거운 마음으로 이 글을 씁니다, 제기된 우려에 대해 성실히 소명드리고자 합니다. 먼저 문제의 핵심은 동의서 자체의 부재가 아니라 일부 참여자에게 절차를 충분히 설명하지 못한 데 있다고 저 스스로도 판단하고 있습니다. 연구의 경중을 불문하고 모든 참여자는 동일한 수준의 설명을 받을 권리가 있다는 원칙을 저 역시 깊이 동의합니다. 다만 해당 시점에 통역 지원 인력이 일시적으로 부족했던 사정이 있었음을 참고해 주셨으면 합니다. 이는 결코 변명이 될 수 없으며, 이미 해당 참여자들께 재설명 절차를 진행하고 추가 동의서를 새로 받았습니다. 아울러 향후 모든 연구에서 통역 지원 인력을 사전에 이중으로 확보하는 절차를 신설하겠습니다. 위원회에서 요구하시는 추가 자료가 있다면 무엇이든 성실히 제출하겠습니다. 이번 지적을 계기로 연구 윤리 절차 전반을 다시 점검하겠습니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "작가님, 3장에 나오는 '그는 결국 그 자리를 떠났다'는 문장에서 '그 자리'가 물리적 장소를 뜻하는지 아니면 직위나 위치를 은유적으로 의미하는지 확인 부탁드립니다.",
    stimulus_en:
      "In Chapter 3, regarding the sentence 'He finally left that place,' could you confirm whether 'that place' refers to a physical location or is a metaphor for a position or status?",
    prompt_kr:
      "번역가의 모호한 표현 문의에 답하는 답장을 일곱 문장 이상으로 써 보세요. '-라 할지라도'와 '-을 계기로 삼아'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a translator's query about ambiguous phrasing in your book. Use '-라 할지라도' and '-을 계기로 삼아'.",
    example_kr:
      "세심하게 짚어 주셔서 감사합니다, 이런 질문이야말로 좋은 번역이 나오는 과정이라고 생각합니다. 사실 그 문장은 처음 쓸 때부터 이중의 의미를 의도하고 배치한 부분입니다. 표면적으로는 인물이 실제로 회사를 그만두고 그 건물을 떠나는 물리적 장면이라 할지라도, 동시에 그가 오랫동안 붙들고 있던 사회적 지위를 내려놓는다는 은유로도 읽히기를 바랐습니다. 다만 이 이중성이 번역어로 옮겨졌을 때 지나치게 모호해져 독자에게 혼란만 줄 위험이 있다면, 물리적 의미 쪽에 조금 더 무게를 두셔도 좋을 것 같습니다. 이 질문을 계기로 삼아 저 역시 원문을 다시 읽어보니, 다음 문단에서 '자리'라는 단어의 은유적 쓰임이 이미 충분히 암시되고 있다는 것을 확인했습니다. 그러니 번역서에서는 해당 문장을 조금 더 구체적으로 옮기시더라도 전체 흐름에는 무리가 없을 것 같습니다. 혹시 다른 언어권 독자들에게 이 은유가 낯설게 느껴질 것 같다면 각주를 다는 방법도 열려 있습니다. 번역 작업 중 또 궁금한 점이 있으시면 언제든 편하게 연락 주세요.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "원고 잘 읽었습니다. 다만 1부의 서술 시점이 자주 바뀌어 독자가 혼란스러울 수 있습니다. 출판사에 투고하기 전에 시점을 일관되게 정리하시길 권해 드립니다.",
    stimulus_en:
      "I've read the manuscript. However, the narrative point of view shifts frequently in Part One, which could confuse readers. I'd recommend making it consistent before submitting to publishers.",
    prompt_kr:
      "에이전트의 수정 요청에 자신의 의도를 설명하며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-이야말로'와 '-는 셈이다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a literary agent's revision notes, explaining your intentions. Use '-이야말로' and '-는 셈이다'.",
    example_kr:
      "꼼꼼한 검토와 솔직한 의견 정말 감사합니다, 이런 예리한 지적이야말로 원고를 다음 단계로 끌어올려 주는 힘이라고 생각합니다. 시점 전환에 대한 우려는 저도 원고를 쓰는 내내 고민했던 부분이라 충분히 공감이 됩니다. 다만 그 전환은 실수라기보다 인물들의 기억이 서로 어긋나 있음을 보여주기 위한 장치로 설계한 것이었는데, 말씀을 듣고 보니 그 의도가 명확히 전달되지 못한 셈입니다. 그래서 전면적으로 시점을 통일하기보다는, 각 장 앞에 화자를 표시하는 방식으로 독자의 혼란을 줄여보려 합니다. 이렇게 하면 원래 의도했던 다성적 구조는 유지하면서도 가독성을 높일 수 있을 것 같습니다. 다음 주까지 1부를 수정하여 다시 보내드리겠습니다. 수정본을 보시고도 여전히 산만하다는 인상이 든다면 그때는 말씀하신 대로 전면적인 시점 통일도 고려해 보겠습니다. 다시 한번 세심한 조언에 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "투고하신 논문의 핵심 주장은 흥미로우나 선행 연구와의 차별점이 명확히 드러나지 않습니다. 대폭 수정 후 재투고를 권합니다.",
    stimulus_en:
      "Your submission's central argument is interesting, but its distinction from prior research is not clearly demonstrated. We recommend a major revision and resubmission.",
    prompt_kr:
      "학술지 편집자의 대폭 수정 요청에 답하는 답장을 일곱 문장 이상으로 써 보세요. '-을 계기로 삼아'와 '-에 지나지 않는다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a journal editor's request for major revisions. Use '-을 계기로 삼아' and '-에 지나지 않는다'.",
    example_kr:
      "편집위원회의 상세한 검토 의견에 깊이 감사드립니다. 선행 연구와의 차별점이 불분명하다는 지적을 계기로 삼아 원고 전체를 다시 검토해 보았습니다. 돌아보니 서론에서 제 논지가 기존 이론에 대한 부분적 보완에 지나지 않는 것처럼 서술된 부분이 있었다는 것을 인정하지 않을 수 없습니다. 실제로 제가 강조하고자 했던 지점은 기존 틀 자체의 전제를 재검토하는 것이었는데, 이 점이 원고에 충분히 부각되지 못했습니다. 이에 서론과 이론적 배경 부분을 전면 재구성하여 차별점을 명확히 드러내도록 하겠습니다. 아울러 결론부에도 본 연구가 기존 논의를 넘어서는 지점을 별도 단락으로 정리하겠습니다. 재투고 기한 내에 수정본과 함께 상세한 수정 대조표를 첨부해 제출하겠습니다. 소중한 기회를 주셔서 다시 한번 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "요즘 자네가 안전한 길만 택하는 것 같아 걱정이 되어 몇 자 적네. 예전의 그 패기는 다 어디로 간 건가. 실망스럽다는 말은 하고 싶지 않지만, 걱정스러운 마음은 숨길 수가 없구나.",
    stimulus_en:
      "I'm writing because I've been worried you seem to be choosing only safe paths these days. Where has the boldness of your younger years gone? I don't want to say I'm disappointed, but I can't hide my concern.",
    prompt_kr:
      "옛 스승의 걱정 어린 편지에 자신의 선택을 변호하는 답장을 일곱 문장 이상으로 써 보세요. '-을 대가로 하여'와 '-는 법이다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a former mentor's worried letter, defending your choices. Use '-을 대가로 하여' and '-는 법이다'.",
    example_kr:
      "선생님의 편지를 받고 며칠을 곱씹어 읽었습니다, 여전히 저를 마음에 두고 계신다는 사실만으로도 큰 위로가 됩니다. 걱정하시는 마음, 조금도 서운하지 않고 오히려 감사합니다. 다만 제가 택한 길이 단순히 두려움을 대가로 하여 안전을 산 것만은 아니라는 말씀을 드리고 싶습니다. 패기라는 것도 시간이 지나면 형태를 바꾸는 법이라는 걸, 저는 요즘 조금씩 배워가고 있습니다. 예전에는 큰 도전을 감행하는 것이 유일한 용기라고 여겼지만, 지금은 오래도록 꾸준히 버티는 것 역시 다른 종류의 용기라는 것을 알게 되었습니다. 지금의 자리에서 저는 나름의 방식으로 새로운 시도들을 이어가고 있으며, 그것이 겉으로 드러나지 않을 뿐입니다. 다음에 뵐 기회가 있으면 요즘 제가 하고 있는 일들을 자세히 말씀드리고 싶습니다. 걱정해 주셔서 다시 한번 진심으로 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "이번 전시는 기술적으로는 완성도가 있으나 감정적 울림이 부족하다. 작가가 안전지대에 머물러 있다는 인상을 지울 수 없다.",
    stimulus_en:
      "This exhibition is technically accomplished but emotionally hollow. One cannot shake the impression that the artist has retreated to a comfort zone.",
    prompt_kr:
      "평론가의 혹평에 예술가로서 입장을 밝히는 답장을 일곱 문장 이상으로 써 보세요. '-치고'와 '-을 넘어서다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences from an artist responding to a critic's harsh review, stating your position. Use '-치고' and '-을 넘어서다'.",
    example_kr:
      "지면에 실린 평론 잘 읽었습니다, 냉정한 시선으로 작품을 봐 주신 것에 대해 우선 감사의 말씀을 드립니다. 다만 감정적 울림이 부족하다는 평가에는 조심스럽게 다른 생각을 나누고 싶습니다. 이번 작업에서 저는 오히려 감정을 과잉되게 드러내지 않는 절제를 실험하고 있었습니다. 자극적이지 않은 작품치고 안전하다는 평가를 피하기는 어렵다는 것을 알고 있었지만, 그 절제야말로 이번 전시가 시도한 새로운 방향이었습니다. 이 시도가 감정적 몰입을 넘어서는 새로운 감상 방식을 제안하려는 의도였다는 점을 조금 더 설명드리고 싶습니다. 물론 그 의도가 관객에게 충분히 전달되지 못했다면, 그것은 저의 표현력이 미숙했던 탓일 것입니다. 앞으로의 작업에서는 절제와 표현 사이의 균형을 더 세심히 고민해 보겠습니다. 날카로운 시선으로 작품을 봐 주신 것에 다시 한번 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "귀하께서 제출하신 용도 변경 신청은 인근 지역 경관 보존 지침과 상충되는 부분이 있어 재검토가 필요합니다. 관련 자료를 다시 제출해 주시기 바랍니다.",
    stimulus_en:
      "The rezoning application you submitted conflicts with the neighborhood's landscape-preservation guidelines in certain respects and requires further review. Please resubmit the relevant materials.",
    prompt_kr:
      "시의회 위원의 이의 제기에 반박 자료를 제출하며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-을 감안하더라도'와 '-에 다름 아니다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a city council member's objection, submitting counter-evidence. Use '-을 감안하더라도' and '-에 다름 아니다'.",
    example_kr:
      "신청서를 세심히 검토해 주신 점 감사드리며, 제기하신 우려에 대해 상세히 답변드리고자 합니다. 경관 보존 지침의 취지에는 저희 역시 전적으로 동의하며, 그 원칙을 훼손할 의도는 전혀 없습니다. 다만 저희가 제안한 건축 높이 제한을 감안하더라도 실제 경관에 미치는 영향은 지침이 우려하는 수준에는 미치지 않는다고 판단됩니다. 인근 세 개 건물의 평균 높이와 비교해 보아도 이번 신청은 새로운 선례라기보다 기존 흐름의 연장선에 다름 아닙니다. 혹시 위원회에서 우려하시는 지점이 시각적 영향이라면, 별도로 준비한 조망권 시뮬레이션 자료를 첨부해 드리겠습니다. 아울러 지역 주민 설명회에서 수렴한 의견서도 함께 제출하여 신청의 절차적 정당성을 보완하겠습니다. 필요하신 추가 자료가 있다면 무엇이든 신속히 준비하겠습니다. 재검토해 주시기를 정중히 요청드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "교수님의 승진 심사와 관련하여 익명의 제보가 접수되어 위원회 차원의 확인 절차를 진행하게 되었습니다. 관련 사안에 대한 입장을 서면으로 제출해 주시기 바랍니다.",
    stimulus_en:
      "In connection with your promotion review, we have received an anonymous complaint and are proceeding with a committee-level verification process. Please submit your position on the matter in writing.",
    prompt_kr:
      "종신 재직 심사위원회의 문의에 침착하게 소명하는 답장을 일곱 문장 이상으로 써 보세요. '-는 것에 불과하다'와 '-지 않을 수 없다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a tenure committee's inquiry, providing a composed response. Use '-는 것에 불과하다' and '-지 않을 수 없다'.",
    example_kr:
      "위원회의 절차에 따라 공정한 확인 과정을 거치고 계신 데 대해 우선 존중의 뜻을 표합니다. 제기된 제보의 내용을 전달받고 당혹스러웠음을 솔직히 인정하지 않을 수 없습니다. 다만 해당 제보가 언급하는 사건은 정식 절차를 거친 평가 결과에 대한 개인적인 불만을 재구성한 것에 불과하다는 점을 말씀드리고 싶습니다. 당시 평가 과정의 모든 기록과 회의록은 학과 사무실에 보관되어 있으며, 위원회에서 원하신다면 언제든 열람하실 수 있습니다. 저 역시 이 과정이 투명하게 진행되기를 진심으로 바라며, 필요한 자료 제출에 성실히 협조하겠습니다. 아울러 관련된 동료 교수들의 증언이 필요하다면 연락처를 정리해 함께 제출하겠습니다. 이번 절차를 통해 오해가 명확히 해소되기를 바랄 뿐입니다. 추가로 요청하실 자료가 있으면 언제든 알려 주시기 바랍니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "귀사의 재무제표를 검토한 결과 지난 분기 현금 흐름과 관련하여 몇 가지 해명이 필요한 항목이 있습니다. 투자 결정 전에 상세한 답변을 부탁드립니다.",
    stimulus_en:
      "Having reviewed your company's financial statements, we have several line items regarding last quarter's cash flow that require clarification. Please provide detailed answers before we finalize our investment decision.",
    prompt_kr:
      "투자자의 실사 질문에 재무 상황을 설명하며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-으로 말미암아'와 '-을 전제로'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to an investor's due-diligence questions, explaining your financial situation. Use '-으로 말미암아' and '-을 전제로'.",
    example_kr:
      "세밀하게 재무제표를 검토해 주셔서 감사합니다, 이런 꼼꼼함이야말로 신뢰할 수 있는 투자 관계의 시작이라고 생각합니다. 지적하신 현금 흐름의 변동은 지난 분기 초 대규모 설비 투자로 말미암아 발생한 일시적 현상입니다. 이 투자는 향후 생산 효율을 크게 개선할 것이라는 전망을 전제로 결정되었으며, 이미 이번 분기부터 그 효과가 수치로 나타나고 있습니다. 첨부해 드린 현금 흐름 예측표를 보시면 다음 두 분기 안에 이전 수준으로 회복될 것을 확인하실 수 있습니다. 아울러 매출채권 회수 기간이 다소 길어진 부분에 대해서도 별도 설명 자료를 준비했습니다. 이는 신규 대형 거래처와의 결제 조건 협상 과정에서 일시적으로 발생한 것으로, 이미 개선 조치를 완료했습니다. 투자 결정에 필요하시다면 회계 담당자와의 직접 화상 미팅도 언제든 주선해 드리겠습니다. 신중한 검토에 다시 한번 감사드리며, 좋은 결정으로 이어지기를 바랍니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "고인의 유언장 중 부동산 분배 조항에 대해 형제분들 사이에 이견이 있는 것으로 파악됩니다. 상속 절차 진행을 위해 귀하의 입장을 서면으로 정리해 주시기 바랍니다.",
    stimulus_en:
      "We understand there is disagreement among the siblings regarding the property-distribution clause in the deceased's will. To proceed with the estate process, please provide your position in writing.",
    prompt_kr:
      "변호사의 상속 분쟁 문의에 감정을 절제하며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-을 바에야'와 '-는 셈이다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a lawyer's inquiry about an inheritance dispute, showing emotional restraint. Use '-을 바에야' and '-는 셈이다'.",
    example_kr:
      "변호사님의 연락에 감사드리며, 어려운 상황에서도 절차를 정확히 안내해 주셔서 도움이 되고 있습니다. 형제들 사이에 생긴 이견에 대해서는 저 역시 무거운 마음으로 이 편지를 씁니다. 재산 문제로 오랜 시간 쌓아온 가족의 정을 잃을 바에야 저는 처음부터 양보할 수 있는 부분은 양보하는 쪽을 택하고 싶습니다. 아버지께서 남기신 재산은 결국 우리 형제들이 함께 나누어야 할 몫인 셈이며, 그 몫을 두고 다투는 것 자체가 아버지의 뜻과는 거리가 멀다고 생각합니다. 다만 법적으로 명시된 저의 지분에 대해서는 최소한의 권리로서 존중받고 싶다는 뜻도 함께 전하고 싶습니다. 구체적으로는 본가 부동산의 지분율을 유언장 원문대로 유지하되, 형이 제안한 현금 정산 방식에는 원칙적으로 동의합니다. 다만 정산 금액 산정 기준에 대해서는 공인된 감정평가를 거치기를 요청드립니다. 이 절차가 가족 간의 관계를 더 해치지 않는 방향으로 마무리되기를 진심으로 바랍니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "선생님의 인생 이야기를 다큐멘터리로 제작하고 싶습니다. 다만 촬영 과정에서 가족의 사생활이나 과거의 아픈 기억까지 다뤄야 할 수도 있는데, 이에 동의해 주실 수 있으신지 여쭙습니다.",
    stimulus_en:
      "We would like to make a documentary about your life story. However, the filming process may need to touch on your family's private matters or painful memories from the past — would you be willing to consent to that?",
    prompt_kr:
      "다큐멘터리 감독의 제작 제안에 조건을 걸어 답하는 답장을 일곱 문장 이상으로 써 보세요. '-을 전제로'와 '-기 그지없다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a documentary filmmaker's proposal, agreeing with certain conditions attached. Use '-을 전제로' and '-기 그지없다'.",
    example_kr:
      "제 삶의 이야기를 다큐멘터리로 담고 싶다는 제안을 받고 처음에는 당혹스럽기 그지없었습니다, 평범하게 살아왔다고만 생각했던 시간이었기 때문입니다. 하지만 감독님의 진심 어린 편지를 읽고 나니 이 작업이 저에게도 의미 있는 정리의 시간이 될 수 있겠다는 생각이 들었습니다. 다만 참여를 결정하기에 앞서 몇 가지 조건을 말씀드리고자 합니다. 가족의 사생활을 다루는 모든 장면은 반드시 당사자들의 개별 동의를 얻는다는 것을 전제로 진행되어야 한다는 점을 분명히 하고 싶습니다. 특히 과거의 아픈 기억과 관련해서는 최종 편집본을 공개 전에 저와 함께 확인하는 절차를 요청드립니다. 이러한 조건이 충족된다면, 저는 이 작업에 진심을 다해 임할 준비가 되어 있습니다. 촬영 일정과 관련해서는 다음 달 초부터 협의가 가능할 것 같습니다. 이 이야기가 저 개인의 기록을 넘어 누군가에게 작은 위로가 될 수 있기를 바랍니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "이번 수상을 축하드립니다. 다만 시상식에서 수락 연설 원고를 사전에 위원회에 제출해 주셔야 하며, 정치적으로 민감한 발언은 자제해 주시기를 요청드립니다.",
    stimulus_en:
      "Congratulations on this award. However, you will need to submit your acceptance speech to the committee in advance, and we ask that you refrain from politically sensitive remarks at the ceremony.",
    prompt_kr:
      "시상식 위원회의 조건부 통보에 자신의 입장을 밝히는 답장을 일곱 문장 이상으로 써 보세요. '-거니와'와 '-을 무릅쓰고'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to an award committee's conditional notice, stating your position. Use '-거니와' and '-을 무릅쓰고'.",
    example_kr:
      "이번 수상 소식을 전해 주셔서 진심으로 영광이었습니다, 오랜 시간의 작업이 인정받은 것 같아 감사한 마음이 큽니다. 원고를 사전에 제출해 달라는 절차는 당연한 요청이거니와, 저 역시 흔쾌히 따르겠습니다. 다만 정치적으로 민감한 발언을 자제해 달라는 요청에 대해서는 조심스럽게 제 입장을 말씀드리고 싶습니다. 제가 준비하고 있는 연설에는 이번 작업의 배경이 된 사회적 문제에 대한 짧은 언급이 포함되어 있는데, 이는 특정 정치 진영을 겨냥한 발언이 아니라 작품의 정직한 배경 설명에 가깝습니다. 위원회의 우려를 무릅쓰고 이 부분을 완전히 삭제하기보다는, 표현의 수위를 조정하는 선에서 타협점을 찾고 싶습니다. 이에 원고 초안을 미리 보내드리니 우려되는 문장이 있다면 구체적으로 짚어 주시면 감사하겠습니다. 위원회와의 협의를 통해 서로가 동의할 수 있는 형태로 다듬어 가고 싶습니다. 다시 한번 이 자리를 마련해 주셔서 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "믿고 말씀드리는 건데, 회사가 실적 자료를 조작하고 있다는 걸 알게 됐어요. 혼자 알리기엔 두려워서 그러는데, 같이 나서 주실 수 있을까요?",
    stimulus_en:
      "I'm telling you this in confidence — I found out the company has been falsifying performance data. I'm scared to come forward alone. Could you join me in speaking up?",
    prompt_kr:
      "내부 고발을 고민하는 동료의 편지에 신중하게 답하는 답장을 일곱 문장 이상으로 써 보세요. '-을 명분으로'와 '-지 않을 수 없다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences carefully responding to a colleague's whistleblower letter. Use '-을 명분으로' and '-지 않을 수 없다'.",
    example_kr:
      "이렇게 무거운 이야기를 저에게 먼저 털어놓아 주셔서 그 신뢰에 깊이 감사드립니다. 편지를 읽는 내내 마음이 무거웠고, 이런 일이 실제로 벌어지고 있다는 사실에 참담함을 느끼지 않을 수 없었습니다. 저 역시 함께 목소리를 내고 싶은 마음이 크지만, 신중하게 결정해야 할 문제라는 것도 잘 알고 있습니다. 조직의 안정을 명분으로 이 문제를 덮는 것은 결국 더 큰 피해로 이어질 것이라는 데는 저도 전적으로 동의합니다. 다만 섣불리 나섰다가 오히려 문제의 본질이 흐려지거나 두 사람 모두 위험에 처할 가능성도 배제할 수 없습니다. 그러니 먼저 외부 법률 자문을 받아 증거를 체계적으로 정리하는 것부터 시작하는 게 좋겠다고 제안드리고 싶습니다. 그 과정에서 제가 함께할 수 있는 부분은 무엇이든 돕겠습니다. 혼자가 아니라는 것만은 분명히 알아 주셨으면 합니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "그동안의 동업을 정리하며 몇 가지 조건을 제안드립니다. 지분은 현재 비율대로 정산하되, 브랜드명 사용권은 제 쪽에서 단독으로 가져가고자 합니다.",
    stimulus_en:
      "As we wind down our partnership, I'd like to propose a few terms. Equity should be settled per the current ratio, but I'd like to take sole rights to the brand name.",
    prompt_kr:
      "동업자의 사업 정리 조건에 일부 반대하며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-을 대가로 하여'와 '-에 다름 아니다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a former business partner's dissolution terms, partly disagreeing. Use '-을 대가로 하여' and '-에 다름 아니다'.",
    example_kr:
      "지분 정산에 관한 제안은 합리적이라고 생각하며, 그 부분에는 별다른 이견이 없습니다. 그동안 함께 일궈온 시간을 생각하면 이렇게 정리하게 되어 여러 감정이 교차하지만, 서로 원만하게 마무리하는 것이 최선이라는 데는 저도 동의합니다. 다만 브랜드명 사용권을 단독으로 가져가시겠다는 제안에는 조심스럽게 다른 의견을 드리고 싶습니다. 그 이름은 처음부터 우리 두 사람의 아이디어를 대가로 하여 함께 만들어낸 것이지, 어느 한쪽의 독자적인 자산이라고 보기는 어렵습니다. 초기 투자 비율의 차이를 근거로 삼는다 해도, 브랜드명의 단독 소유는 공동 창업의 취지를 훼손하는 것에 다름 아닙니다. 이에 브랜드명은 향후 5년간 양측 모두 사용하지 않거나, 혹은 별도의 라이선스 계약을 통해 공동으로 관리하는 방안을 제안드립니다. 나머지 조건들에 대해서는 다음 주 중 직접 만나 세부 사항을 논의하고 싶습니다. 서로에게 공정한 방식으로 이 관계를 마무리할 수 있기를 바랍니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "부친께서 남기신 개인 서신들을 저희 기록보관소에 기증해 주시면 후대 연구자들에게 귀중한 자료가 될 것입니다. 다만 일부 내용은 열람 제한 없이 공개될 수 있습니다.",
    stimulus_en:
      "If you donate your late father's personal correspondence to our archive, it would be a valuable resource for future researchers. However, some of the content may be made accessible without restriction.",
    prompt_kr:
      "기록보관소의 기증 요청에 조건을 걸어 답하는 답장을 일곱 문장 이상으로 써 보세요. '-으로 환원되다'와 '-이야말로'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to an archive's request to donate your late father's papers, agreeing with a condition. Use '-으로 환원되다' and '-이야말로'.",
    example_kr:
      "아버지의 서신에 관심을 가져 주셔서 감사드립니다, 그분의 삶이 개인의 기록을 넘어 시대의 기록으로 남을 수 있다는 사실이 저에게도 뜻깊게 다가옵니다. 다만 기증을 결정하기에 앞서 한 가지 조건을 말씀드리고 싶습니다. 서신 중 일부는 가족 내부의 사적인 갈등을 다루고 있어, 그 부분까지 공개 자료로 환원되는 것은 원치 않습니다. 아버지의 공적인 활동과 사상을 담은 서신들이야말로 연구자들에게 진정으로 도움이 될 자료라고 생각합니다. 이에 사적인 내용을 담은 서신들에 대해서는 최소 삼십 년간 열람을 제한하는 조건을 제안드립니다. 이 조건이 수용된다면 나머지 서신들은 기꺼이, 그리고 흔쾌히 기증하겠습니다. 목록 정리 및 스캔 작업이 필요하다면 저도 최대한 협조하겠습니다. 아버지의 기록이 좋은 곳에서 잘 보존될 수 있기를 바랍니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "선생님의 기조연설에서 제시하신 핵심 통계가 최신 자료와 다소 차이가 있다는 지적이 있었습니다. 이에 대한 입장을 듣고 싶습니다.",
    stimulus_en:
      "There have been comments that the key statistics you presented in your keynote diverge somewhat from the most recent data. We would like to hear your position on this.",
    prompt_kr:
      "학회 주최자의 이의 제기에 자신의 자료를 방어하는 답장을 일곱 문장 이상으로 써 보세요. '-을 감안하더라도'와 '-는 법이다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a conference organizer disputing your keynote's data, defending your figures. Use '-을 감안하더라도' and '-는 법이다'.",
    example_kr:
      "제기된 지적에 대해 상세히 답변드릴 기회를 주셔서 감사합니다. 통계 수치의 차이를 지적하신 부분은 충분히 검토할 가치가 있는 문제라고 생각합니다. 다만 제가 인용한 자료는 발표 시점을 기준으로 가장 최신에 공개된 국제 보고서였다는 점을 감안하더라도, 그 이후 새로운 수정치가 발표되었을 가능성을 배제할 수는 없습니다. 통계란 조사 기관과 시점에 따라 미세하게 달라지는 법이므로, 두 자료 사이의 차이가 반드시 오류를 의미하지는 않는다고 생각합니다. 그럼에도 불구하고 발표에 사용된 출처를 명확히 밝히지 않은 점은 제 불찰이었음을 인정합니다. 이에 다음 발간될 학회 자료집에는 출처와 발표 시점을 명시한 각주를 추가하겠습니다. 아울러 최신 수정치와의 비교표도 별도로 첨부하여 혼란을 최소화하겠습니다. 세심한 검증에 다시 한번 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "귀하께서 인터뷰에서 하신 발언 중 일부가 사실과 다르다는 독자 제보가 있었습니다. 정정 보도를 위해 정확한 사실 관계를 확인해 주시기 바랍니다.",
    stimulus_en:
      "We received a reader complaint stating that some of your interview remarks were factually inaccurate. To issue a correction, please confirm the accurate facts.",
    prompt_kr:
      "신문사의 정정 요청에 사실 관계를 정리해 답하는 답장을 일곱 문장 이상으로 써 보세요. '-는 것에 불과하다'와 '-을 계기로 삼아'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a newspaper's request for a correction, laying out the accurate facts. Use '-는 것에 불과하다' and '-을 계기로 삼아'.",
    example_kr:
      "연락 주셔서 감사합니다, 정확한 보도를 위해 사실 관계를 확인해 주시는 절차는 언론으로서 마땅히 필요한 일이라고 생각합니다. 문제가 된 발언을 다시 살펴보니, 제가 언급한 수치는 특정 연도의 잠정치였는데 기사에는 확정치처럼 표현된 부분이 있었습니다. 다만 이는 저의 발언 자체가 잘못되었다기보다, 구술 인터뷰 과정에서 맥락이 생략되며 발생한 오해에 불과하다고 생각합니다. 이번 지적을 계기로 삼아 정확한 원자료를 다시 확인하여 아래와 같이 정리해 드립니다. 해당 수치는 2023년 잠정 통계이며, 최종 확정치는 아직 발표되지 않았습니다. 정정 기사에는 이 점을 명확히 밝혀 주시면 독자들의 오해를 줄일 수 있을 것 같습니다. 필요하시다면 원자료 출처 링크도 함께 첨부해 드리겠습니다. 신속하고 정확하게 확인해 주셔서 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "원고 중 특정 인물을 겨냥한 것으로 읽힐 수 있는 대목이 있어 법적 검토가 필요합니다. 출간 전 해당 부분을 다소 완화해 주실 것을 요청드립니다.",
    stimulus_en:
      "There is a passage in the manuscript that could be read as targeting a specific individual, requiring legal review. We ask that you soften that section before publication.",
    prompt_kr:
      "출판사의 완화 요청에 일부 수용하며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-(으)ㄹ지언정'과 '-을 전제로'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a publisher's request to soften a controversial passage, partly agreeing. Use '-(으)ㄹ지언정' and '-을 전제로'.",
    example_kr:
      "법적 검토 의견을 상세히 전달해 주셔서 감사합니다, 출판사로서 신중을 기하시는 이유를 충분히 이해합니다. 다만 해당 대목은 특정 인물을 직접 겨냥하려는 의도로 쓰인 것이 아니라, 그 인물이 상징하는 사회적 유형을 비판하기 위한 장치였다는 점을 말씀드리고 싶습니다. 하지만 표현이 다소 노골적이어서 독자에 따라 특정인을 연상시킬지언정, 제가 그 위험을 완전히 부정할 수는 없다고 생각합니다. 이에 인물의 직업이나 외양에 대한 구체적 묘사를 다소 흐릿하게 조정하는 선에서 수정을 제안드립니다. 다만 이 인물이 상징하는 비판적 메시지 자체는 훼손되지 않는다는 것을 전제로 수정 작업을 진행하고 싶습니다. 수정된 초고는 이번 주 안으로 법무팀과 함께 다시 검토받을 수 있도록 보내드리겠습니다. 최종 표현에 대해서는 편집자님과 계속 조율해 나가고 싶습니다. 신중한 검토에 다시 한번 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "당신의 공개 발언은 무책임하기 그지없습니다. 영향력 있는 위치에 있는 사람으로서 좀 더 신중했어야 하지 않습니까.",
    stimulus_en:
      "Your public remarks were nothing short of irresponsible. Shouldn't someone in a position of influence have been more careful?",
    prompt_kr:
      "익명 비평가의 공개 서한에 침착하게 답하는 답장을 일곱 문장 이상으로 써 보세요. '-기 그지없다'와 '-을 넘어서다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences composedly responding to an anonymous critic's open letter. Use '-기 그지없다' and '-을 넘어서다'.",
    example_kr:
      "익명으로나마 이렇게 솔직한 의견을 보내 주신 것에 대해 우선 감사드립니다. 제 발언이 무책임하게 느껴지셨다는 지적을 읽으며 저 스스로도 여러 번 그 순간을 되짚어 보았습니다. 신중하지 못했다는 비판을 겸허히 받아들이며, 그 부분에 대해서는 저 역시 아쉽기 그지없습니다. 다만 제 발언의 전체 맥락이 일부만 발췌되어 전달된 측면도 있다는 점을 말씀드리고 싶습니다. 이번 논란은 단순히 저 개인의 실수를 넘어서서, 공적 발언의 책임이 어디까지인가라는 더 큰 질문을 던져 준 계기가 되었다고 생각합니다. 앞으로는 발언 하나하나가 가질 무게를 더욱 신중히 고려하겠습니다. 익명으로 남기신 의견이지만 진지하게 새겨듣겠습니다. 다시 한번 솔직한 지적에 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "교수님, 그때 해 주신 조언이 없었다면 지금의 저는 없었을 거예요. 다만 한 가지 부탁드릴 게 있어서 오랜만에 연락드립니다. 추천서를 다시 한번 부탁드려도 될까요?",
    stimulus_en:
      "Professor, if it weren't for your advice back then, I wouldn't be where I am today. I'm reaching out after a long time because I have one favor to ask — could I trouble you for another letter of recommendation?",
    prompt_kr:
      "제자의 감사와 부탁이 담긴 편지에 답하는 답장을 일곱 문장 이상으로 써 보세요. '-이야말로'와 '-노라면'을 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a former student's letter combining gratitude and a request. Use '-이야말로' and '-노라면'.",
    example_kr:
      "오랜만에 받은 편지에 반가운 마음이 앞섰습니다, 그렇게 성장한 모습으로 다시 연락 주셔서 정말 기쁩니다. 학생의 이야기를 읽어 내려가노라면 그때 함께 나눴던 대화들이 하나둘 떠오릅니다. 사실 그 시절의 저는 특별한 조언을 드렸다고 생각하지 않았는데, 지금 이렇게 말씀해 주시니 그 짧은 대화들이야말로 제가 가르치는 이유였다는 걸 새삼 깨닫습니다. 추천서 요청은 당연히 흔쾌히 받아들이겠습니다. 다만 최근의 활동과 성과를 조금 더 구체적으로 담을 수 있도록, 이력서와 함께 최근 3년간 이루신 일들을 정리해서 보내 주시면 좋겠습니다. 지원하시는 곳의 요구 형식이나 마감일도 함께 알려 주시면 맞춰서 준비하겠습니다. 학생의 다음 도전을 진심으로 응원하겠습니다. 좋은 소식 기다리고 있겠습니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "귀측이 제안한 조항 중 지식재산권 귀속 부분은 저희 측 원칙과 상충됩니다. 재협상 자리를 마련해 주실 것을 공식적으로 요청드립니다.",
    stimulus_en:
      "The intellectual-property clause among your proposed terms conflicts with our organization's principles. We formally request a renegotiation session.",
    prompt_kr:
      "협상 상대측의 공식적인 이의 제기에 답하는 답장을 일곱 문장 이상으로 써 보세요. '-을 전제로'와 '-거니와'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a formal objection from a negotiating counterpart. Use '-을 전제로' and '-거니와'.",
    example_kr:
      "귀측의 공식 이의 제기를 잘 받았습니다, 협상 과정에서 이러한 입장을 명확히 밝혀 주시는 것은 서로에게 유익한 일이라고 생각합니다. 저희가 제안했던 지식재산권 조항은 공동 개발에 투입된 비용 비율을 전제로 설계된 것이었으나, 귀측이 우려하시는 지점도 충분히 타당하거니와 재검토할 여지가 있다고 판단됩니다. 특히 향후 파생 기술에 대한 권리 배분 문제는 저희 역시 다소 성급하게 다뤘다는 점을 인정합니다. 이에 다음 주 중으로 재협상 자리를 마련하는 데 흔쾌히 동의합니다. 회의에 앞서 저희 측에서 수정안 초안을 먼저 공유드리고자 하니, 검토 후 의견을 주시면 감사하겠습니다. 이번 협상이 양측 모두에게 만족스러운 결과로 이어지기를 바랍니다. 회의 일정은 귀측이 편하신 날짜로 제안해 주시면 맞추겠습니다. 다시 한번 신중한 검토에 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "귀하의 건물은 등록문화재로 지정되어 있어 외관 변경에 제한이 따릅니다. 신청하신 리모델링 계획서를 재작성해 주시기 바랍니다.",
    stimulus_en:
      "Your building is designated as a registered cultural heritage site, which restricts changes to its exterior. Please revise your submitted renovation plan.",
    prompt_kr:
      "문화재청의 리모델링 제한 통보에 대안을 제시하며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-는 셈이다'와 '-을 불문하고'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a heritage board's restriction notice, proposing an alternative plan. Use '-는 셈이다' and '-을 불문하고'.",
    example_kr:
      "안내해 주신 규정을 자세히 검토했습니다, 이 건물이 지닌 역사적 가치를 지켜야 한다는 취지에는 저 역시 깊이 공감합니다. 다만 현재의 외관 유지만으로는 건물 내부의 노후한 배관과 전기 설비 문제를 해결하기 어렵다는 점이 저희의 가장 큰 고민입니다. 외관을 그대로 두더라도 내부 기능을 개선하지 못하면 결국 건물의 존속 자체가 위태로워지는 셈입니다. 이에 외관은 원형을 그대로 유지하되, 내부 설비만 현대화하는 수정안을 새로 준비했습니다. 창문이나 외벽의 재질과 색상을 불문하고 기존 규정에서 정한 기준을 철저히 따르겠습니다. 첨부해 드린 수정 도면을 검토해 주시면 감사하겠습니다. 필요하시다면 문화재 보존 전문가와 함께 현장 실사도 진행할 수 있습니다. 신중한 검토와 지도 부탁드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "이번 시즌 프로그램에 현대 작곡가의 실험적인 작품이 지나치게 많이 포함되어 있어 정기 후원자들의 이탈이 우려됩니다. 재검토를 요청드립니다.",
    stimulus_en:
      "This season's program includes an unusually large number of experimental works by contemporary composers, and we're concerned about losing regular subscribers. We request a reconsideration.",
    prompt_kr:
      "오케스트라 이사회의 프로그램 이의 제기에 예술적 소신을 밝히며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-는 법이다'와 '-을 명분으로'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to an orchestra board questioning your programming, stating your artistic convictions. Use '-는 법이다' and '-을 명분으로'.",
    example_kr:
      "이사회의 우려를 진지하게 전달해 주셔서 감사합니다, 후원자분들에 대한 책임감이야말로 오케스트라 운영에서 가장 중요한 부분 중 하나라는 것을 잘 알고 있습니다. 다만 안정적인 관객층을 명분으로 프로그램을 지나치게 보수적으로만 구성한다면, 오케스트라의 예술적 생명력은 서서히 옅어지는 법이라는 점을 함께 고려해 주셨으면 합니다. 새로운 작품에 대한 낯섦은 처음에는 저항을 부르지만, 시간이 지나면 오히려 그 오케스트라만의 색깔로 자리 잡는 경우를 여러 사례에서 볼 수 있었습니다. 그럼에도 불구하고 이사회의 우려를 완전히 외면할 수는 없다고 생각하여, 실험적인 작품의 비중을 이번 시즌 전체의 삼분의 일 수준으로 조정하는 방안을 제안드립니다. 아울러 낯선 작품을 연주하기 전 짧은 해설 시간을 마련하여 관객의 이해를 돕고자 합니다. 정기 후원자 대상 사전 시연회도 함께 검토해 보겠습니다. 이사회와 지속적으로 소통하며 균형점을 찾아가고 싶습니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "칼럼의 핵심 주장이 사실 확인 없이 성급하게 작성되었다는 내부 검토 결과가 나왔습니다. 정정 및 철회 여부에 대한 의견을 부탁드립니다.",
    stimulus_en:
      "Our internal review found that the central argument of your column was written hastily without proper fact-checking. Please share your view on whether it should be corrected or retracted.",
    prompt_kr:
      "편집장의 칼럼 철회 관련 문의에 답하는 답장을 일곱 문장 이상으로 써 보세요. '-지 않을 수 없다'와 '-을 계기로 삼아'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to an editor-in-chief's inquiry about retracting your column. Use '-지 않을 수 없다' and '-을 계기로 삼아'.",
    example_kr:
      "내부 검토 결과를 전달받고 무거운 마음으로 이 답장을 씁니다. 칼럼을 다시 읽어 보니, 마감 압박 속에서 핵심 자료의 출처를 충분히 확인하지 않은 채 성급히 결론을 내렸다는 점을 인정하지 않을 수 없습니다. 특히 통계 인용 부분은 원 출처를 재확인한 결과 제가 오독한 부분이 있었음을 확인했습니다. 이번 일을 계기로 삼아 앞으로는 칼럼 마감 전 반드시 사실 확인 절차를 거치는 것을 저 스스로의 원칙으로 삼겠습니다. 철회 여부에 대해서는 전면 철회보다는 정정 사항을 명확히 밝히는 별도의 정정문을 게재하는 편이 독자들에게 더 투명한 방식이라고 생각합니다. 정정문 초안을 오늘 안으로 작성하여 보내드리겠습니다. 이번 일로 신뢰에 흠집이 생겼다면 진심으로 죄송하다는 말씀을 드리고 싶습니다. 편집국의 판단에 따르겠습니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "박사 논문 지도를 마친 지도 벌써 이십 년이 흘렀네. 그때 자네가 얼마나 고집스럽게 자기 주장을 밀어붙였는지 요즘도 종종 떠오른다네. 지금은 어떤 연구를 하고 있는지 궁금하구먼.",
    stimulus_en:
      "It's been twenty years since I finished supervising your doctoral thesis. I still often remember how stubbornly you pushed your own argument back then. I'm curious what you're researching now.",
    prompt_kr:
      "옛 지도교수의 회고 편지에 답하는 답장을 일곱 문장 이상으로 써 보세요. '-이야말로'와 '-는 데 있다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to an old advisor's reflective letter. Use '-이야말로' and '-는 데 있다'.",
    example_kr:
      "선생님의 편지를 받고 이십 년 전 연구실의 풍경이 눈앞에 그대로 펼쳐지는 것 같았습니다. 그때 제 고집스러운 논쟁을 참아 주신 선생님의 인내야말로 지금의 저를 만든 가장 큰 자산이었다고 생각합니다. 돌이켜 보면 그 시절 저의 진짜 문제는 주장의 옳고 그름이 아니라, 다른 의견을 듣는 법을 몰랐다는 데 있었던 것 같습니다. 선생님께서 끝까지 반박해 주신 덕분에 저는 비로소 제 논지의 허점을 볼 수 있었습니다. 요즘 저는 그때의 논문 주제를 확장하여 새로운 방향의 연구를 진행하고 있습니다. 최근에는 학생들을 지도하며, 그때 선생님이 저에게 보여 주신 인내를 저도 조금이나마 실천하려 애쓰고 있습니다. 다음에 학회에서 뵐 기회가 있다면 요즘의 연구 이야기를 자세히 나누고 싶습니다. 늘 건강하시길 진심으로 바랍니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "지난해 후원해 주신 기금이 구체적으로 어떤 사업에 사용되었는지에 대한 설명이 부족했다는 회원분들의 의견이 있어 상세 내역을 요청드립니다.",
    stimulus_en:
      "Some of our members felt there wasn't enough explanation of exactly how last year's donated funds were used, so we are requesting a detailed breakdown.",
    prompt_kr:
      "후원자 단체의 지출 내역 문의에 투명하게 답하는 답장을 일곱 문장 이상으로 써 보세요. '-을 감안하더라도'와 '-는 것에 불과하다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences transparently responding to a donor group's inquiry about expenditure. Use '-을 감안하더라도' and '-는 것에 불과하다'.",
    example_kr:
      "소중한 후원금이 어떻게 쓰였는지 궁금해하시는 것은 지극히 당연한 요청이며, 이를 신속히 안내해 드리지 못한 점 먼저 사과드립니다. 매년 발간하는 연례보고서에 개괄적인 내용을 담고는 있으나, 지면의 한계를 감안하더라도 회원분들이 원하시는 수준의 상세함에는 미치지 못했다는 것을 인정합니다. 지난해 후원금의 60퍼센트는 지역 아동센터 급식 지원에, 25퍼센트는 교육 프로그램 운영에, 나머지는 행정 및 회계 감사 비용으로 사용되었습니다. 연례보고서에 실린 요약 수치는 실제 집행 내역의 극히 일부에 불과하다는 점도 이번 기회에 함께 말씀드리고 싶습니다. 이에 앞으로는 분기별 상세 지출 내역을 별도 문서로 정리하여 회원분들께 공유하는 절차를 신설하겠습니다. 감사보고서 원본도 요청하시는 분들께는 언제든 열람할 수 있도록 하겠습니다. 신뢰를 지켜야 할 저희의 책임을 무겁게 받아들이겠습니다. 소중한 의견 다시 한번 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "귀사가 제안하신 해외 판권 계약 조건 중 로열티 정산 방식이 저희 기존 계약 관례와 상이하여 조정이 필요합니다. 재검토 부탁드립니다.",
    stimulus_en:
      "The royalty-settlement method in the foreign-rights contract terms you proposed differs from our usual arrangements, requiring adjustment. Please reconsider.",
    prompt_kr:
      "해외 판권 협상자의 계약 조건 이의 제기에 답하는 답장을 일곱 문장 이상으로 써 보세요. '-을 전제로'와 '-으로 말미암아'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a foreign-rights negotiator's contract dispute. Use '-을 전제로' and '-으로 말미암아'.",
    example_kr:
      "계약 조건에 대한 세심한 검토와 신속한 회신에 감사드립니다. 저희가 제안한 로열티 정산 방식은 최근 국제 도서 시장의 변화로 말미암아 도입하게 된 새로운 구조였는데, 귀사의 기존 관례와 차이가 있다는 점은 미처 충분히 고려하지 못했습니다. 저희 제안은 전자책과 종이책의 판매 비중이 지속적으로 변동한다는 것을 전제로 설계된 것이라, 고정 요율보다는 구간별 변동 요율이 장기적으로 양측 모두에게 유리하다고 판단했습니다. 다만 귀사의 관례를 존중하는 차원에서, 첫 계약 기간 동안은 기존 방식을 유지하고 갱신 시점에 새로운 구조로의 전환을 논의하는 절충안을 제안드리고 싶습니다. 이렇게 하면 양측 모두 변화에 따른 부담을 줄이면서 데이터를 축적할 시간을 가질 수 있을 것입니다. 수정된 계약서 초안을 이번 주 안으로 다시 보내드리겠습니다. 세부 조항에 대해서는 언제든 화상 회의로 논의할 수 있습니다. 원만한 합의에 이르기를 기대합니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "귀하에 대한 징계 처분에 이의를 제기하신 항소장을 접수했습니다. 재심 위원회 개최에 앞서 추가로 소명하실 사항이 있다면 서면으로 제출해 주시기 바랍니다.",
    stimulus_en:
      "We have received your appeal contesting the disciplinary action against you. Before convening the review committee, please submit in writing any additional statements you wish to make.",
    prompt_kr:
      "직업 윤리 제재에 대한 항소 심사 요청에 답하는 답장을 일곱 문장 이상으로 써 보세요. '-는 셈이다'와 '-라 할지라도'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences responding to a review of your appeal against a professional sanction. Use '-는 셈이다' and '-라 할지라도'.",
    example_kr:
      "항소장을 접수해 주시고 추가 소명의 기회를 주신 점 진심으로 감사드립니다. 처음 징계 통보를 받았을 때는 절차의 공정성에 대한 의문이 앞섰던 것이 사실입니다. 다만 시간을 두고 사안을 다시 살펴보니, 제 판단에 부주의했던 부분이 전혀 없었다고는 할 수 없다는 것을 인정하지 않을 수 없습니다. 그럼에도 당시 상황이 예외적으로 긴급했다 할지라도, 규정을 우회한 것에 대한 책임까지 면할 수 있는 것은 아니라고 생각합니다. 다만 그 판단이 개인적 이익을 위한 것이 아니라 환자의 안전을 최우선으로 고려한 결과였다는 점만은 다시 한번 강조하고 싶습니다. 이는 규정 위반의 경중을 가리는 데 있어 중요한 정황이 되는 셈입니다. 첨부해 드린 서면에는 당시 상황을 시간대별로 정리한 기록과 동료들의 증언서를 함께 담았습니다. 위원회의 공정한 재심을 부탁드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "십 년 넘게 함께 작업해 온 우리의 협업을 이제는 끝내야 할 것 같습니다. 서로의 방향이 너무 달라졌다는 걸 인정할 때가 된 것 같아요.",
    stimulus_en:
      "I think it's time to end our collaboration after more than ten years of working together. I think it's time to admit our directions have simply grown too different.",
    prompt_kr:
      "오랜 협업자의 결별 편지에 감정을 절제하며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-는 법이다'와 '-을 넘어서다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences with emotional restraint to a longtime collaborator's letter ending the partnership. Use '-는 법이다' and '-을 넘어서다'.",
    example_kr:
      "편지를 몇 번이고 다시 읽었습니다, 예상하지 못했다면 거짓말이겠지만 막상 글로 마주하니 마음이 복잡합니다. 십 년이 넘는 시간을 함께해 온 사람으로서, 이 결정이 쉽지 않았을 거라는 걸 잘 알고 있습니다. 어떤 관계든 시간이 흐르면 각자의 방향이 조금씩 달라지는 법이라는 걸 저도 머리로는 이해하고 있습니다. 다만 그 변화가 단순한 의견 차이를 넘어서서 관계 자체를 끝내야 할 정도인지에 대해서는 조금 더 이야기를 나누고 싶은 마음도 있습니다. 그럼에도 당신의 결정을 존중하며, 억지로 붙잡고 싶지는 않습니다. 우리가 함께 만들어 온 작업들은 앞으로도 저에게 큰 의미로 남을 것입니다. 마지막으로 한 번쯤은 얼굴을 보고 그동안의 시간을 정리하는 자리를 가질 수 있으면 좋겠습니다. 그동안 정말 고마웠습니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "최근 불거진 논란과 관련하여 귀하의 공식 입장을 듣고 싶습니다. 오늘 중으로 답변 주시면 내일 자 기사에 반영하겠습니다.",
    stimulus_en:
      "Regarding the recent controversy, we'd like to hear your official position. If you respond by end of day, we will include it in tomorrow's article.",
    prompt_kr:
      "기자의 논평 요청에 신중하게 답하는 답장을 일곱 문장 이상으로 써 보세요. '-는 것에 불과하다'와 '-을 방불케 하다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences carefully responding to a journalist's request for comment on a controversy. Use '-는 것에 불과하다' and '-을 방불케 하다'.",
    example_kr:
      "연락 주셔서 감사합니다, 신속한 보도를 위해 시간 내에 답변을 요청하신 상황을 충분히 이해합니다. 다만 이번 사안은 여러 관계자가 얽혀 있는 문제인 만큼, 성급한 논평이 오히려 진실을 흐릴 위험이 있다고 판단됩니다. 지금까지 온라인상에서 확산된 내용 중 상당 부분은 추측성 보도가 재생산된 것에 불과하며, 실제 사실 관계와는 거리가 있습니다. 이 상황은 마치 확인되지 않은 소문이 사실처럼 굳어지는 여론 재판을 방불케 하여 저로서는 무척 조심스럽습니다. 이에 오늘 안으로 짧은 입장문을 준비하되, 세부 사실 관계에 대한 상세한 설명은 관련 자료를 정리한 뒤 별도로 전달드리고자 합니다. 우선 첨부한 짧은 입장문만이라도 기사에 인용해 주시면 감사하겠습니다. 상세 자료는 늦어도 모레까지는 전달드리겠습니다. 신중하게 다뤄 주시기를 부탁드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "투고하신 원고에 대한 심사 결과, 이론적 기여도는 인정되나 방법론의 재현 가능성이 낮다는 이유로 게재가 불가하다는 결론이 내려졌습니다. 수정 후 재투고는 가능합니다.",
    stimulus_en:
      "Following review of your submission, the theoretical contribution was acknowledged, but the paper was deemed unpublishable due to low reproducibility of the methodology. Revision and resubmission are possible.",
    prompt_kr:
      "출판사 심사 결과 거절 통보에 재투고 의사를 밝히는 답장을 일곱 문장 이상으로 써 보세요. '-지 않을 수 없다'와 '-을 계기로 삼아'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a university press's reject-with-resubmission verdict, expressing intent to resubmit. Use '-지 않을 수 없다' and '-을 계기로 삼아'.",
    example_kr:
      "상세한 심사평을 보내 주셔서 감사합니다, 이론적 기여를 인정해 주신 부분에 우선 안도했습니다. 방법론의 재현 가능성이 낮다는 지적에 대해서는 처음에는 당혹스러웠지만, 실험 절차를 다시 검토해 보니 그 지적이 타당하다는 것을 인정하지 않을 수 없었습니다. 특히 실험 조건을 서술한 부분이 지나치게 축약되어 다른 연구자가 그대로 재현하기에는 부족했다는 점이 확인되었습니다. 이번 심사를 계기로 삼아 방법론 전체를 부록 형태로 상세히 재작성하고, 사용한 코드와 데이터를 공개 저장소에 함께 게재하고자 합니다. 재현성을 높이기 위해 독립된 제3의 연구팀에게 예비 검증을 의뢰하는 절차도 추가하겠습니다. 수정 작업에는 약 두 달 정도가 소요될 것으로 예상되며, 완료되는 대로 재투고하겠습니다. 소중한 기회를 다시 한번 주셔서 감사드립니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "기증해 주신 유물의 제작 시기와 관련하여 일부 전문가들 사이에서 진위 논란이 제기되었습니다. 추가 자료나 근거가 있으시면 제출해 주시기 바랍니다.",
    stimulus_en:
      "Regarding the production date of the artifact you donated, some experts have raised questions about its authenticity. If you have any additional materials or supporting evidence, please submit them.",
    prompt_kr:
      "시립 기록보관소의 진위 논란 문의에 답하는 답장을 일곱 문장 이상으로 써 보세요. '-을 명분으로'와 '-이야말로'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences to a city archivist questioning the authenticity of a donated artifact. Use '-을 명분으로' and '-이야말로'.",
    example_kr:
      "진위 논란이 제기되었다는 소식을 듣고 처음에는 다소 당혹스러웠음을 솔직히 말씀드립니다. 다만 이런 검증 절차야말로 기록보관소가 신뢰를 지키기 위해 반드시 거쳐야 할 과정이라는 것을 잘 알고 있습니다. 근거 없는 확신을 명분으로 논란을 무시하기보다는, 저 역시 이번 기회에 다시 한번 자료를 점검하고 싶습니다. 해당 유물은 조부께서 남기신 구입 영수증과 당시 감정서를 함께 보관해 왔는데, 이 문서들이야말로 제작 시기를 뒷받침할 가장 직접적인 근거가 될 것입니다. 관련 서류의 사본을 스캔하여 이번 주 안으로 보내드리겠습니다. 필요하시다면 원본 서류의 실물 감정을 위해 직접 방문할 의사도 있습니다. 진위 여부가 명확히 가려지는 과정에 성실히 협조하겠습니다. 결과가 어떻든 이 유물이 정확한 맥락 속에서 보존되기를 바랄 뿐입니다.",
  },
  {
    level: "C2",
    genre: "reply",
    stimulus_kr:
      "우리가 함께 만든 그 보고서, 발표 자리에서 마치 혼자 다 한 것처럼 소개하시더군요. 그날 이후로 계속 마음이 불편했습니다. 이 부분은 짚고 넘어가야 할 것 같습니다.",
    stimulus_en:
      "At the presentation, you introduced the report we made together as though you'd done it entirely on your own. I've felt uneasy about it ever since. I think this needs to be addressed.",
    prompt_kr:
      "공로를 가로챘다는 동료의 편지에 사과하며 답하는 답장을 일곱 문장 이상으로 써 보세요. '-노라면'과 '-지 않을 수 없다'를 사용하세요.",
    prompt_en:
      "Write a reply of at least seven sentences apologizing to a colleague's letter alleging you took credit for their work. Use '-노라면' and '-지 않을 수 없다'.",
    example_kr:
      "편지를 읽고 그날의 발표를 다시 떠올려 보노라면, 제 말투와 태도에 문제가 있었다는 것을 인정하지 않을 수 없습니다. 변명의 여지 없이, 그 보고서는 당신과 함께 밤늦도록 자료를 정리하며 만든 공동의 결과물이었습니다. 발표 당일 시간에 쫓기며 서둘러 설명하다 보니 공동 작업이라는 사실을 충분히 강조하지 못했던 것 같은데, 그 이유가 어찌 됐든 당신에게 상처를 준 것에는 변함이 없습니다. 진심으로 미안하다는 말씀을 먼저 드리고 싶습니다. 이 문제를 그냥 넘기지 않고 직접 말씀해 주신 것에 오히려 감사한 마음입니다. 이번 주 팀 회의에서 그 보고서가 온전히 공동 작업이었다는 것을 다시 한번 명확히 밝히도록 하겠습니다. 앞으로 어떤 발표에서든 함께한 사람의 기여를 분명히 언급하는 것을 원칙으로 삼겠습니다. 다시 한번 진심으로 사과드립니다.",
  },
];
