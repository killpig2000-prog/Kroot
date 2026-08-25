import type { RawPrompt } from "./types";

export const WRITING_B1_B: RawPrompt[] = [
  // --- Work and career episodes ---
  {
    level: "B1",
    prompt_kr:
      "요즘 회사나 학교에서 바쁜 일과에 대해 다섯 문장으로 써 보세요. '-는 편이에요'를 사용하세요.",
    prompt_en:
      "Write five sentences about how busy your work or school schedule has been lately. Use the pattern '-는 편이에요' (tend to be / relatively).",
    example_kr:
      "요즘 회사 일이 많아서 바쁜 편이에요. 아침 일찍 출근해서 저녁 늦게 퇴근해요. 그래도 동료들이 잘 도와줘서 견딜 만해요. 업무는 힘들지만 배우는 것도 많은 편이에요. 다음 달부터는 조금 여유가 생길 것 같아요.",
  },
  {
    level: "B1",
    prompt_kr:
      "새로운 프로젝트를 맡았던 경험을 다섯 문장으로 써 보세요. '-기 마련이다'를 사용하세요.",
    prompt_en:
      "Write five sentences about an experience of being assigned a new project. Use the pattern '-기 마련이다' (it's only natural that / bound to happen).",
    example_kr:
      "지난달에 처음으로 큰 프로젝트를 맡게 되었어요. 처음에는 실수도 하기 마련이라고 생각하고 마음을 편하게 먹었어요. 그래서 모르는 부분은 선배에게 바로 물어봤어요. 시간이 지나면서 점점 익숙해졌어요. 결국 프로젝트를 무사히 끝낼 수 있었어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "회의나 발표 때문에 긴장했던 순간을 다섯 문장으로 써 보세요. '-을 텐데'를 사용하세요.",
    prompt_en:
      "Write five sentences about a moment you were nervous before a meeting or presentation. Use the pattern '-을 텐데' (it probably will, but...).",
    example_kr:
      "지난주에 처음으로 팀 회의에서 발표를 했어요. 준비를 많이 안 하면 실수할 텐데 걱정이 됐어요. 그래서 전날 밤늦게까지 자료를 다시 확인했어요. 발표할 때는 목소리가 조금 떨렸어요. 그래도 끝까지 잘 마쳐서 다행이었어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "퇴근하는 길에 겸사겸사 처리한 일에 대해 다섯 문장으로 써 보세요. '-는 김에'를 사용하세요.",
    prompt_en:
      "Write five sentences about running an errand while on your way home from work. Use the pattern '-는 김에' (while doing X, also do Y).",
    example_kr:
      "어제 퇴근하는 김에 은행에 들러서 볼일을 봤어요. 은행에 간 김에 근처 마트에서 장도 봤어요. 마트에 간 김에 저녁 재료도 미리 사 뒀어요. 덕분에 다음 날 시간을 절약할 수 있었어요. 앞으로도 이렇게 일을 한꺼번에 처리하려고 해요.",
  },
  {
    level: "B1",
    prompt_kr:
      "지금 하는 일이 적성에 맞는지 다섯 문장으로 써 보세요. '-기는 하지만'을 사용하세요.",
    prompt_en:
      "Write five sentences about whether your current job suits you. Use the pattern '-기는 하지만' (it's true that X, but...).",
    example_kr:
      "지금 하는 일이 적성에 맞기는 하지만 가끔 힘들 때도 있어요. 사람들과 이야기하는 건 좋아하기는 하지만 매일 반복되면 지치기도 해요. 월급은 만족스럽기는 하지만 시간이 부족한 게 아쉬워요. 그래도 이 일을 통해 많이 성장한 것 같아요. 앞으로도 이 분야에서 계속 일하고 싶어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "이직이나 부서 이동을 고민했던 경험을 다섯 문장으로 써 보세요. '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write five sentences about a time you considered changing jobs or departments. Use the pattern '-을 정도로' (to the extent that).",
    example_kr:
      "작년에는 회사를 그만두고 싶을 정도로 스트레스가 심했어요. 잠을 못 잘 정도로 걱정도 많이 했어요. 그래서 다른 회사에 이력서를 낸 적도 있어요. 하지만 상사와 이야기한 후에 마음을 바꿨어요. 지금은 예전보다 훨씬 만족하면서 일하고 있어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "상사나 선배가 시키는 대로 일을 처리했던 경험을 다섯 문장으로 써 보세요. '-는 대로'를 사용하세요.",
    prompt_en:
      "Write five sentences about following instructions from a boss or senior coworker exactly as told. Use the pattern '-는 대로' (as soon as / exactly as).",
    example_kr:
      "부장님이 말씀하시는 대로 보고서를 작성했어요. 자료가 준비되는 대로 바로 팀원들에게 공유했어요. 지시받는 대로 하니까 실수가 줄어들었어요. 회의가 끝나는 대로 다음 계획을 세웠어요. 앞으로도 정확하게 지시를 따르려고 노력할 거예요.",
  },
  {
    level: "B1",
    prompt_kr:
      "신입치고는 실수를 많이 안 했던 경험이나 반대의 경험을 다섯 문장으로 써 보세요. '-치고는'을 사용하세요.",
    prompt_en:
      "Write five sentences about a time as a newcomer you either made few mistakes or many, more/less than expected for a beginner. Use the pattern '-치고는' (for X, unusually...).",
    example_kr:
      "저는 신입치고는 실수를 적게 하는 편이라는 말을 들었어요. 첫 달치고는 업무 속도도 빠르다고 칭찬받았어요. 하지만 신입치고는 질문을 너무 안 한다는 지적도 받았어요. 그래서 요즘은 궁금한 점을 더 적극적으로 물어봐요. 앞으로 경력치고는 부족한 부분도 계속 채워 나가고 싶어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "야근을 했더니 생긴 변화에 대해 다섯 문장으로 써 보세요. '-았더니'를 사용하세요.",
    prompt_en:
      "Write five sentences about the results of working overtime one night. Use the pattern '-았더니' (upon doing X, then...).",
    example_kr:
      "지난주에 며칠 동안 야근을 했더니 몸이 많이 피곤해졌어요. 잠을 충분히 못 잤더니 다음 날 집중이 잘 안 됐어요. 그래도 마감을 지켰더니 상사가 칭찬해 주셨어요. 야근을 계속했더니 건강에도 신경 써야겠다는 생각이 들었어요. 그래서 요즘은 일을 미리 끝내려고 노력해요.",
  },
  {
    level: "B1",
    prompt_kr:
      "직장에서 정해진 규칙을 지키는 한 자유롭게 일할 수 있었던 경험을 다섯 문장으로 써 보세요. '-는 한'을 사용하세요.",
    prompt_en:
      "Write five sentences about being free to work your own way at your job as long as you follow certain rules. Use the pattern '-는 한' (as long as).",
    example_kr:
      "우리 회사는 마감을 지키는 한 근무 시간을 자유롭게 정할 수 있어요. 성과가 있는 한 재택근무도 허용해 줘요. 규칙을 어기지 않는 한 별다른 간섭이 없어요. 그래서 저는 제가 편한 시간에 집중해서 일해요. 이런 분위기가 계속되는 한 오래 일하고 싶어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "면접을 본 경험을 다섯 문장으로 써 보세요. '-을 텐데'와 '-는 편이에요'를 사용하세요.",
    prompt_en:
      "Write five sentences about a job interview experience. Use both '-을 텐데' and '-는 편이에요'.",
    example_kr:
      "저는 낯선 사람 앞에서 긴장하는 편이에요. 준비를 안 하면 대답을 못 할 텐데 걱정이 많이 됐어요. 그래서 예상 질문을 미리 정리해서 연습했어요. 실제 면접에서는 생각보다 편하게 대답한 편이었어요. 결과를 기다리는 시간이 제일 힘들 텐데 지금도 초조하게 기다리고 있어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "동료와 협업하면서 힘들었던 순간을 다섯 문장으로 써 보세요. '-기는 하지만'과 '-았더니'를 사용하세요.",
    prompt_en:
      "Write five sentences about a difficult moment while collaborating with a coworker. Use both '-기는 하지만' and '-았더니'.",
    example_kr:
      "그 동료는 실력이 좋기는 하지만 의견을 잘 안 들어 주는 편이었어요. 처음에는 참기는 하지만 스트레스가 쌓였어요. 결국 솔직하게 이야기했더니 오해가 조금 풀렸어요. 이야기를 나눴더니 서로의 입장을 이해하게 됐어요. 지금은 예전보다 훨씬 편하게 협업하고 있어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "출장을 다녀온 경험을 다섯 문장으로 써 보세요. '-는 김에'와 '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write five sentences about a business trip you went on. Use both '-는 김에' and '-을 정도로'.",
    example_kr:
      "지난달에 부산으로 출장을 다녀왔어요. 출장을 간 김에 하루 더 머물면서 관광도 했어요. 회의가 예상보다 길어져서 목이 아플 정도로 계속 이야기했어요. 그래도 출장을 간 김에 현지 음식도 맛있게 먹었어요. 다음에도 기회가 되면 출장을 가고 싶을 정도로 좋은 경험이었어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "업무 매뉴얼이나 지침이 있어서 도움이 됐던 경험을 다섯 문장으로 써 보세요. '-는 대로'와 '-는 한'을 사용하세요.",
    prompt_en:
      "Write five sentences about a time a work manual or guideline helped you. Use both '-는 대로' and '-는 한'.",
    example_kr:
      "새로운 프로그램을 배울 때 매뉴얼에 나온 대로 따라 했어요. 순서대로 하는 한 큰 문제가 생기지 않았어요. 모르는 부분이 생기는 대로 바로 매뉴얼을 찾아봤어요. 매뉴얼을 잘 참고하는 한 실수를 줄일 수 있었어요. 그래서 이제는 새 업무를 맡아도 크게 걱정하지 않아요.",
  },
  {
    level: "B1",
    prompt_kr:
      "일과 개인 생활의 균형을 찾으려고 했던 경험을 다섯 문장으로 써 보세요. '-치고는'을 사용하세요.",
    prompt_en:
      "Write five sentences about trying to find a balance between work and personal life. Use the pattern '-치고는'.",
    example_kr:
      "저는 회사원치고는 저녁 시간을 잘 지키는 편이에요. 바쁜 부서치고는 야근이 적은 편이라고 생각해요. 그래도 가끔은 직장인치고는 여유가 없다고 느낄 때가 있어요. 그래서 주말에는 일을 완전히 잊고 쉬려고 해요. 이런 습관 덕분에 요즘은 마음이 훨씬 편해졌어요.",
  },

  // --- Money and finance episodes ---
  {
    level: "B1",
    prompt_kr:
      "매달 용돈이나 월급을 계획적으로 쓰려고 했던 경험을 다섯 문장으로 써 보세요. '-는 편이에요'를 사용하세요.",
    prompt_en:
      "Write five sentences about trying to spend your monthly allowance or salary according to a plan. Use the pattern '-는 편이에요'.",
    example_kr:
      "저는 월급을 받으면 항목별로 나눠서 쓰는 편이에요. 식비와 교통비는 미리 정해 놓는 편이에요. 그래서 이번 달에는 예산을 크게 넘기지 않은 편이었어요. 저축도 조금씩 늘려 가는 편이에요. 이렇게 계획을 세우니까 마음이 훨씬 편해졌어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "충동구매를 했던 경험을 다섯 문장으로 써 보세요. '-았더니'를 사용하세요.",
    prompt_en:
      "Write five sentences about a time you made an impulse purchase. Use the pattern '-았더니'.",
    example_kr:
      "지난주에 세일한다는 광고를 봤더니 갑자기 사고 싶어졌어요. 고민하지 않고 바로 결제했더니 다음 날 후회가 밀려왔어요. 카드 내역을 확인했더니 생각보다 많은 돈을 썼더라고요. 그래서 반품이 가능한지 알아봤더니 다행히 환불받을 수 있었어요. 그 후로는 사기 전에 하루 정도 더 생각해 보게 됐어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "친구나 가족과 돈 문제로 고민했던 경험을 다섯 문장으로 써 보세요. '-을 텐데'를 사용하세요.",
    prompt_en:
      "Write five sentences about worrying over a money issue with a friend or family member. Use the pattern '-을 텐데'.",
    example_kr:
      "친구에게 돈을 빌려주면 관계가 어색해질 텐데 고민이 많이 됐어요. 안 빌려주면 서운해할 텐데 거절하기도 힘들었어요. 결국 조금만 빌려주기로 했어요. 나중에 갚기 힘들면 다시 이야기하기 힘들 텐데 미리 조건을 정해 뒀어요. 다행히 친구가 약속대로 잘 갚아 줬어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "적금이나 저축을 시작하면서 생긴 습관을 다섯 문장으로 써 보세요. '-는 김에'를 사용하세요.",
    prompt_en:
      "Write five sentences about a habit that started when you began saving money or opened a savings account. Use the pattern '-는 김에'.",
    example_kr:
      "은행에 간 김에 새로운 적금 통장을 만들었어요. 통장을 만든 김에 자동이체도 신청했어요. 가계부를 쓰는 김에 불필요한 지출도 함께 점검했어요. 지출을 줄인 김에 커피값도 아끼기 시작했어요. 이렇게 조금씩 신경 쓰다 보니 저축이 늘어났어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "비싼 물건을 살지 말지 고민했던 경험을 다섯 문장으로 써 보세요. '-기는 하지만'을 사용하세요.",
    prompt_en:
      "Write five sentences about hesitating over whether to buy an expensive item. Use the pattern '-기는 하지만'.",
    example_kr:
      "그 노트북은 마음에 들기는 하지만 가격이 너무 비쌌어요. 성능이 좋기는 하지만 지금 당장 꼭 필요한 건 아니었어요. 할부로 사면 부담이 덜하기는 하지만 이자가 걱정됐어요. 결국 몇 달 더 고민한 끝에 구매를 결정했어요. 사용해 보니 만족스럽기는 하지만 조금 더 신중했어야 했다는 생각도 들어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "돈을 아끼려고 실천했던 습관을 다섯 문장으로 써 보세요. '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write five sentences about a money-saving habit you practiced. Use the pattern '-을 정도로'.",
    example_kr:
      "요즘 저는 도시락을 쌀 정도로 외식비를 줄이려고 노력해요. 배달 음식을 아예 안 시킬 정도로 결심을 단단히 했어요. 남들이 놀랄 정도로 커피값도 많이 아꼈어요. 그렇게 했더니 한 달에 저축액이 두 배로 늘었어요. 앞으로도 이 정도로 절약하는 습관을 유지하고 싶어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "정해진 예산대로 지출을 관리했던 경험을 다섯 문장으로 써 보세요. '-는 대로'를 사용하세요.",
    prompt_en:
      "Write five sentences about managing your spending exactly according to a budget. Use the pattern '-는 대로'.",
    example_kr:
      "이번 달에는 세운 계획대로 돈을 쓰려고 노력했어요. 예산이 정해지는 대로 항목마다 금액을 나눴어요. 필요한 게 생기는 대로 미리 적어 놓고 확인했어요. 계획한 대로 지출했더니 마지막 주에도 여유가 있었어요. 이 방법을 다음 달에도 그대로 써 볼 생각이에요.",
  },
  {
    level: "B1",
    prompt_kr:
      "학생치고는 저축을 많이 했거나 반대로 소비가 컸던 경험을 다섯 문장으로 써 보세요. '-치고는'을 사용하세요.",
    prompt_en:
      "Write five sentences about, as a student, saving more (or spending more) than expected. Use the pattern '-치고는'.",
    example_kr:
      "저는 학생치고는 저축을 꽤 많이 하는 편이라는 이야기를 들어요. 아르바이트생치고는 수입도 적지 않은 편이에요. 하지만 이번 달은 학생치고는 지출이 큰 편이었어요. 그래도 필요한 물건이었으니 후회하지는 않아요. 다음 달부터는 다시 학생치고는 알뜰하게 생활할 계획이에요.",
  },
  {
    level: "B1",
    prompt_kr:
      "지출을 줄이기로 결심한 한 원하는 목표를 이룰 수 있었던 경험을 다섯 문장으로 써 보세요. '-는 한'을 사용하세요.",
    prompt_en:
      "Write five sentences about reaching a savings goal as long as you kept cutting spending. Use the pattern '-는 한'.",
    example_kr:
      "지출을 줄이는 한 목표한 금액을 모을 수 있다고 생각했어요. 계획을 지키는 한 큰 어려움 없이 저축할 수 있었어요. 유혹에 흔들리지 않는 한 목표를 지킬 수 있다고 믿었어요. 매달 확인하는 한 예산이 크게 벗어나지 않았어요. 결국 계획대로 목표 금액을 모두 모을 수 있었어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "가계부를 쓰면서 깨달은 점을 다섯 문장으로 써 보세요. '-았더니'와 '-는 편이에요'를 사용하세요.",
    prompt_en:
      "Write five sentences about something you realized while keeping a household budget. Use both '-았더니' and '-는 편이에요'.",
    example_kr:
      "매일 가계부를 썼더니 제 소비 습관을 자세히 알게 됐어요. 저는 원래 계획 없이 돈을 쓰는 편이었어요. 기록을 계속했더니 불필요한 지출이 눈에 보이기 시작했어요. 이제는 필요한 것만 사는 편이에요. 가계부 덕분에 저축액도 조금씩 늘고 있어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "친구와 여행 경비를 나눠 냈던 경험을 다섯 문장으로 써 보세요. '-는 김에'와 '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write five sentences about splitting travel expenses with a friend. Use both '-는 김에' and '-을 정도로'.",
    example_kr:
      "친구와 여행을 계획하는 김에 경비도 미리 나눠서 정했어요. 숙소비를 계산한 김에 교통비도 함께 정리했어요. 둘 다 놀랄 정도로 예상보다 비용이 많이 나왔어요. 그래서 여행 가는 김에 저렴한 식당도 많이 찾아다녔어요. 결국 걱정했던 것과 달리 예산 안에서 잘 다녀올 수 있었어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "중고 거래로 돈을 절약했던 경험을 다섯 문장으로 써 보세요. '-기는 하지만'과 '-는 대로'를 사용하세요.",
    prompt_en:
      "Write five sentences about saving money through a secondhand transaction. Use both '-기는 하지만' and '-는 대로'.",
    example_kr:
      "중고 물건을 사는 게 조금 걱정되기는 하지만 가격이 훨씬 저렴해요. 상태가 좋기는 하지만 새 제품과는 다를 수 있어요. 그래서 판매자가 사진을 보내는 대로 꼼꼼히 확인했어요. 거래 장소가 정해지는 대로 바로 약속을 잡았어요. 덕분에 필요한 물건을 싸게 구할 수 있었어요.",
  },

  // --- Food and cooking episodes ---
  {
    level: "B1",
    prompt_kr:
      "직접 요리를 해 본 경험을 다섯 문장으로 써 보세요. '-는 편이에요'를 사용하세요.",
    prompt_en:
      "Write five sentences about an experience cooking a meal yourself. Use the pattern '-는 편이에요'.",
    example_kr:
      "저는 주말마다 직접 요리를 하는 편이에요. 간단한 한식은 자신 있게 만드는 편이에요. 지난 주말에는 김치찌개를 끓여 봤어요. 처음보다 맛이 훨씬 좋아진 편이었어요. 앞으로 더 다양한 요리에 도전해 보고 싶어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "요리에 실패했던 경험을 다섯 문장으로 써 보세요. '-기 마련이다'를 사용하세요.",
    prompt_en:
      "Write five sentences about a cooking failure. Use the pattern '-기 마련이다'.",
    example_kr:
      "처음 요리를 배울 때는 실수하기 마련이라고 생각했어요. 지난주에 국을 끓이다가 소금을 너무 많이 넣었어요. 초보자는 양 조절을 잘못하기 마련이니까 크게 신경 쓰지 않았어요. 그래서 물을 더 넣고 간을 다시 맞췄어요. 다음에는 레시피를 더 정확하게 지켜야겠다고 생각했어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "손님을 초대해서 음식을 준비했던 경험을 다섯 문장으로 써 보세요. '-을 텐데'를 사용하세요.",
    prompt_en:
      "Write five sentences about preparing food for guests you invited. Use the pattern '-을 텐데'.",
    example_kr:
      "손님이 많이 오면 음식이 부족할 텐데 걱정이 됐어요. 그래서 평소보다 재료를 더 넉넉하게 준비했어요. 매운 걸 못 먹는 사람도 있을 텐데 순한 맛도 따로 만들었어요. 시간이 부족하면 서두르다가 실수할 텐데 미리 계획을 세워 두었어요. 덕분에 손님들이 맛있게 잘 먹어 줘서 기뻤어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "장을 보러 간 김에 새로운 재료를 시도해 본 경험을 다섯 문장으로 써 보세요. '-는 김에'를 사용하세요.",
    prompt_en:
      "Write five sentences about trying a new ingredient while grocery shopping. Use the pattern '-는 김에'.",
    example_kr:
      "마트에 간 김에 처음 보는 채소를 하나 사 봤어요. 새로운 재료를 산 김에 인터넷에서 요리법도 찾아봤어요. 요리를 시작한 김에 다른 반찬도 함께 만들었어요. 재료를 다듬는 김에 냉장고 정리도 했어요. 이렇게 한 번에 여러 가지를 하니까 시간이 절약됐어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "매운 음식을 먹었던 경험을 다섯 문장으로 써 보세요. '-기는 하지만'을 사용하세요.",
    prompt_en:
      "Write five sentences about eating spicy food. Use the pattern '-기는 하지만'.",
    example_kr:
      "저는 매운 음식을 좋아하기는 하지만 너무 매우면 힘들어요. 그 식당 떡볶이는 맛있기는 하지만 눈물이 날 정도로 매웠어요. 물을 계속 마시기는 하지만 매운맛이 쉽게 가시지 않았어요. 그래도 다 먹고 나니 속이 시원하기는 했어요. 다음에는 조금 덜 매운 걸로 주문해야겠어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "식당에서 음식이 늦게 나와서 배가 고팠던 경험을 다섯 문장으로 써 보세요. '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write five sentences about being so hungry the food was late at a restaurant. Use the pattern '-을 정도로'.",
    example_kr:
      "그날은 배가 고파서 쓰러질 정도로 힘들었어요. 하지만 손님이 많아서 음식이 나오는 데 한 시간이 걸릴 정도로 오래 걸렸어요. 참기 힘들 정도로 배가 고팠지만 어쩔 수 없이 기다렸어요. 드디어 음식이 나왔을 때는 눈물이 날 정도로 반가웠어요. 결국 맛있게 다 먹고 만족스러운 마음으로 나왔어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "레시피대로 요리를 따라 했던 경험을 다섯 문장으로 써 보세요. '-는 대로'를 사용하세요.",
    prompt_en:
      "Write five sentences about following a recipe step by step. Use the pattern '-는 대로'.",
    example_kr:
      "인터넷에서 찾은 레시피대로 요리를 만들어 봤어요. 순서가 나오는 대로 하나씩 따라 했어요. 재료를 준비하는 대로 바로바로 손질했어요. 시간이 되는 대로 불을 줄이고 뚜껑을 닫았어요. 레시피대로 했더니 처음치고는 맛있게 완성됐어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "초보 요리사치고는 잘한 요리나 부족했던 요리에 대해 다섯 문장으로 써 보세요. '-치고는'을 사용하세요.",
    prompt_en:
      "Write five sentences about a dish that turned out surprisingly good or bad for a beginner cook. Use the pattern '-치고는'.",
    example_kr:
      "저는 초보치고는 볶음 요리를 꽤 잘하는 편이에요. 처음 만든 파스타치고는 맛이 나쁘지 않았어요. 하지만 첫 시도치고는 국물 요리는 조금 짰어요. 그래도 초보자치고는 잘했다는 칭찬을 들어서 기뻤어요. 앞으로 요리 실력을 더 키우고 싶어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "요리를 다르게 했더니 맛이 달라진 경험을 다섯 문장으로 써 보세요. '-았더니'를 사용하세요.",
    prompt_en:
      "Write five sentences about how changing your cooking method changed the taste. Use the pattern '-았더니'.",
    example_kr:
      "설탕 대신 꿀을 넣었더니 맛이 훨씬 부드러워졌어요. 불을 약하게 줄였더니 재료가 타지 않았어요. 국물을 조금 더 넣었더니 간이 딱 맞았어요. 새로운 방법으로 만들었더니 가족들도 맛있다고 했어요. 앞으로도 이 방법을 계속 써 봐야겠어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "정해진 재료가 있는 한 어떤 요리든 만들 수 있게 된 경험을 다섯 문장으로 써 보세요. '-는 한'을 사용하세요.",
    prompt_en:
      "Write five sentences about being able to cook almost anything as long as you have the basic ingredients. Use the pattern '-는 한'.",
    example_kr:
      "냉장고에 기본 재료가 있는 한 간단한 요리는 다 만들 수 있어요. 레시피를 따라 하는 한 큰 실수는 하지 않아요. 시간이 있는 한 반찬도 여러 가지 준비하려고 해요. 재료가 신선한 한 맛도 크게 걱정하지 않아요. 이렇게 요리에 자신감이 생기는 한 계속 새로운 음식에 도전할 거예요.",
  },
  {
    level: "B1",
    prompt_kr:
      "친구와 함께 요리했던 경험을 다섯 문장으로 써 보세요. '-는 김에'와 '-았더니'를 사용하세요.",
    prompt_en:
      "Write five sentences about cooking together with a friend. Use both '-는 김에' and '-았더니'.",
    example_kr:
      "친구가 놀러 온 김에 같이 저녁을 만들기로 했어요. 재료를 산 김에 디저트도 함께 준비했어요. 둘이 힘을 합쳤더니 요리가 훨씬 빨리 끝났어요. 새로운 방법을 시도했더니 생각보다 맛이 좋았어요. 다음에도 친구가 오는 김에 같이 요리해 보고 싶어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "배달 음식 대신 직접 요리하기로 결심한 경험을 다섯 문장으로 써 보세요. '-기는 하지만'과 '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write five sentences about deciding to cook at home instead of ordering delivery. Use both '-기는 하지만' and '-을 정도로'.",
    example_kr:
      "배달 음식이 편하기는 하지만 건강에는 좋지 않은 것 같았어요. 직접 요리하는 게 번거롭기는 하지만 훨씬 저렴했어요. 그래서 요즘은 배달을 끊을 정도로 요리에 신경 쓰고 있어요. 처음에는 시간이 부족할 정도로 서툴렀어요. 이제는 조금씩 익숙해져서 마음이 뿌듯해요.",
  },

  // --- Technology and app use in daily life ---
  {
    level: "B1",
    prompt_kr:
      "매일 사용하는 스마트폰 앱에 대해 다섯 문장으로 써 보세요. '-는 편이에요'를 사용하세요.",
    prompt_en:
      "Write five sentences about a smartphone app you use every day. Use the pattern '-는 편이에요'.",
    example_kr:
      "저는 지도 앱을 자주 쓰는 편이에요. 길을 찾을 때 항상 확인하는 편이에요. 대중교통 시간도 그 앱으로 확인하는 편이에요. 요즘은 맛집을 찾을 때도 사용하는 편이에요. 이 앱 덕분에 생활이 훨씬 편리해졌어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "새로운 기술 제품을 처음 사용했던 경험을 다섯 문장으로 써 보세요. '-기 마련이다'를 사용하세요.",
    prompt_en:
      "Write five sentences about the first time you used a new tech product. Use the pattern '-기 마련이다'.",
    example_kr:
      "새 기기를 처음 쓸 때는 헤매기 마련이라고 생각했어요. 처음에는 설정 방법을 몰라서 시간이 오래 걸렸어요. 새로운 기술은 처음에 어색하기 마련이니까 조급해하지 않았어요. 유튜브 영상을 보면서 하나씩 배웠어요. 지금은 익숙해져서 편하게 사용하고 있어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "앱 업데이트 때문에 불편했던 경험을 다섯 문장으로 써 보세요. '-을 텐데'를 사용하세요.",
    prompt_en:
      "Write five sentences about inconvenience caused by an app update. Use the pattern '-을 텐데'.",
    example_kr:
      "업데이트를 하면 더 편리해질 텐데 오히려 사용하기 어려워졌어요. 예전 버전이 더 익숙할 텐데 갑자기 화면이 바뀌어서 당황했어요. 설명을 읽으면 도움이 될 텐데 시간이 없어서 그냥 써 봤어요. 계속 쓰다 보면 익숙해질 텐데 지금은 조금 불편해요. 그래도 며칠 지나니 조금씩 적응이 됐어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "새 휴대폰을 산 김에 정리했던 앱과 데이터에 대해 다섯 문장으로 써 보세요. '-는 김에'를 사용하세요.",
    prompt_en:
      "Write five sentences about organizing apps and data while getting a new phone. Use the pattern '-는 김에'.",
    example_kr:
      "새 휴대폰을 산 김에 필요 없는 앱을 다 지웠어요. 앱을 정리한 김에 사진도 백업해 뒀어요. 백업을 하는 김에 오래된 파일도 삭제했어요. 설정을 새로 한 김에 비밀번호도 더 안전하게 바꿨어요. 덕분에 휴대폰이 훨씬 가벼워지고 빨라졌어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "온라인 강의나 앱으로 공부했던 경험을 다섯 문장으로 써 보세요. '-기는 하지만'을 사용하세요.",
    prompt_en:
      "Write five sentences about studying through an online course or app. Use the pattern '-기는 하지만'.",
    example_kr:
      "온라인 강의는 편리하기는 하지만 집중하기가 쉽지 않아요. 시간을 자유롭게 정할 수 있기는 하지만 미루기도 쉬워요. 그래서 매일 조금씩 듣기는 하지만 진도는 느린 편이에요. 그래도 원하는 시간에 반복해서 볼 수 있기는 해요. 앞으로 계획을 더 철저히 세워야겠다고 생각했어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "스마트폰을 너무 오래 사용해서 놀랐던 경험을 다섯 문장으로 써 보세요. '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write five sentences about being surprised at how much time you spent on your phone. Use the pattern '-을 정도로'.",
    example_kr:
      "사용 시간을 확인하고 놀랄 정도로 스마트폰을 오래 썼더라고요. 눈이 아플 정도로 화면을 계속 봤어요. 손목이 저릴 정도로 오랫동안 화면을 넘겼어요. 그래서 사용 시간을 제한하는 앱을 설치했어요. 요즘은 예전보다 훨씬 줄어들 정도로 습관이 좋아졌어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "앱에서 안내하는 대로 결제나 설정을 했던 경험을 다섯 문장으로 써 보세요. '-는 대로'를 사용하세요.",
    prompt_en:
      "Write five sentences about following in-app instructions to complete a payment or a setting. Use the pattern '-는 대로'.",
    example_kr:
      "앱에서 안내하는 대로 순서대로 결제를 진행했어요. 화면에 나오는 대로 정보를 입력했어요. 인증 번호가 오는 대로 바로 입력했어요. 설정이 끝나는 대로 확인 메시지가 떴어요. 안내를 잘 따라간 대로 큰 문제 없이 마칠 수 있었어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "무료 앱치고는 기능이 좋았거나 아쉬웠던 경험을 다섯 문장으로 써 보세요. '-치고는'을 사용하세요.",
    prompt_en:
      "Write five sentences about a free app that had surprisingly good or lacking features. Use the pattern '-치고는'.",
    example_kr:
      "그 앱은 무료치고는 기능이 정말 다양했어요. 처음 나온 서비스치고는 사용법도 어렵지 않았어요. 하지만 무료 버전치고는 광고가 조금 많은 편이었어요. 그래도 초보자치고는 쉽게 배울 수 있어서 만족스러웠어요. 앞으로 유료 버전도 한번 써 볼까 고민하고 있어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "알림 설정을 바꿨더니 생긴 변화에 대해 다섯 문장으로 써 보세요. '-았더니'를 사용하세요.",
    prompt_en:
      "Write five sentences about the change after adjusting your notification settings. Use the pattern '-았더니'.",
    example_kr:
      "불필요한 알림을 껐더니 휴대폰을 덜 보게 됐어요. 알림을 줄였더니 일에 더 집중할 수 있었어요. 조용한 시간을 설정했더니 잠도 더 잘 잤어요. 화면을 덜 확인했더니 시간이 훨씬 여유롭게 느껴졌어요. 그래서 이 설정을 계속 유지하기로 했어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "와이파이나 인터넷이 되는 한 어디서든 일할 수 있었던 경험을 다섯 문장으로 써 보세요. '-는 한'을 사용하세요.",
    prompt_en:
      "Write five sentences about being able to work anywhere as long as there was wifi or internet. Use the pattern '-는 한'.",
    example_kr:
      "인터넷이 연결되는 한 카페에서도 편하게 일할 수 있어요. 노트북이 있는 한 장소는 크게 상관없어요. 배터리가 남아 있는 한 밖에서도 오래 작업할 수 있어요. 와이파이가 안정적인 한 화상 회의도 문제없이 진행돼요. 이런 환경이 계속되는 한 재택근무도 어렵지 않을 것 같아요.",
  },
  {
    level: "B1",
    prompt_kr:
      "앱으로 물건을 주문한 김에 다른 것도 함께 처리했던 경험을 다섯 문장으로 써 보세요. '-는 김에'와 '-았더니'를 사용하세요.",
    prompt_en:
      "Write five sentences about ordering an item through an app and handling other tasks at the same time. Use both '-는 김에' and '-았더니'.",
    example_kr:
      "앱에서 물건을 주문하는 김에 쿠폰도 함께 사용했어요. 장바구니를 확인한 김에 필요했던 다른 물건도 담았어요. 결제를 마쳤더니 곧바로 배송 예정일이 표시됐어요. 리뷰를 확인했더니 다른 사람들도 만족스러워했어요. 결국 필요한 물건들을 한 번에 편리하게 구매할 수 있었어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "새로운 결제 앱을 처음 써 봤던 경험을 다섯 문장으로 써 보세요. '-기는 하지만'과 '-는 대로'를 사용하세요.",
    prompt_en:
      "Write five sentences about the first time you used a new payment app. Use both '-기는 하지만' and '-는 대로'.",
    example_kr:
      "새 결제 앱은 편리하기는 하지만 처음에는 사용법이 낯설었어요. 화면이 간단하기는 하지만 정보를 정확히 입력해야 했어요. 그래서 안내가 나오는 대로 하나씩 따라 했어요. 인증이 되는 대로 결제가 바로 완료됐어요. 몇 번 써 보니 편리하기는 확실히 편리하다고 느꼈어요.",
  },

  // --- Additional work episodes ---
  {
    level: "B1",
    prompt_kr:
      "회사에서 승진하거나 인정받았던 경험을 다섯 문장으로 써 보세요. '-을 정도로'와 '-는 편이에요'를 사용하세요.",
    prompt_en:
      "Write five sentences about being promoted or recognized at work. Use both '-을 정도로' and '-는 편이에요'.",
    example_kr:
      "저는 원래 눈에 잘 안 띄는 편이에요. 그런데 이번에는 동료들이 놀랄 정도로 좋은 성과를 냈어요. 상사가 믿을 정도로 꾸준히 노력한 결과였어요. 저는 칭찬을 잘 안 받는 편인데 이번에는 특별히 인정받았어요. 이 경험 덕분에 자신감이 훨씬 커졌어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "업무 마감 기한을 지키려고 애썼던 경험을 다섯 문장으로 써 보세요. '-을 텐데'와 '-는 대로'를 사용하세요.",
    prompt_en:
      "Write five sentences about struggling to meet a work deadline. Use both '-을 텐데' and '-는 대로'.",
    example_kr:
      "이대로 하면 마감을 못 지킬 텐데 걱정이 됐어요. 그래서 일이 끝나는 대로 바로 다음 작업을 시작했어요. 자료가 도착하는 대로 정리해서 보고서를 완성했어요. 늦어지면 팀 전체가 힘들어질 텐데 다행히 시간을 맞출 수 있었어요. 마감을 지킨 후에는 정말 홀가분했어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "회식 자리에서 있었던 일을 다섯 문장으로 써 보세요. '-는 김에'와 '-치고는'을 사용하세요.",
    prompt_en:
      "Write five sentences about something that happened at a company dinner. Use both '-는 김에' and '-치고는'.",
    example_kr:
      "회식을 하는 김에 오랜만에 팀원들과 편하게 이야기를 나눴어요. 첫 회식치고는 분위기가 아주 좋았어요. 이야기가 나온 김에 다음 프로젝트 계획도 자연스럽게 논의했어요. 신입사원치고는 사람들과도 금방 친해졌어요. 덕분에 다음 날 업무도 더 즐거운 마음으로 시작할 수 있었어요.",
  },

  // --- Additional money episodes ---
  {
    level: "B1",
    prompt_kr:
      "구독 서비스를 정리했던 경험을 다섯 문장으로 써 보세요. '-았더니'와 '-는 편이에요'를 사용하세요.",
    prompt_en:
      "Write five sentences about canceling subscription services. Use both '-았더니' and '-는 편이에요'.",
    example_kr:
      "저는 여러 구독 서비스를 한꺼번에 신청하는 편이에요. 사용하지 않는 것들을 정리했더니 매달 지출이 줄었어요. 목록을 확인했더니 잊고 있던 결제가 몇 개나 있었어요. 그래서 필요한 것만 남기고 다 취소했어요. 이제는 구독을 신중하게 결정하는 편이에요.",
  },
  {
    level: "B1",
    prompt_kr:
      "세금이나 공과금을 처음 내 본 경험을 다섯 문장으로 써 보세요. '-기 마련이다'와 '-는 한'을 사용하세요.",
    prompt_en:
      "Write five sentences about paying taxes or utility bills for the first time. Use both '-기 마련이다' and '-는 한'.",
    example_kr:
      "처음 세금을 낼 때는 실수하기 마련이라고 생각했어요. 서류를 잘 확인하는 한 큰 문제는 없다고 들었어요. 그래도 모르는 부분이 많아서 여러 번 물어봤어요. 기한을 지키는 한 벌금은 걱정하지 않아도 됐어요. 결국 큰 어려움 없이 첫 납부를 마칠 수 있었어요.",
  },

  // --- Additional food episodes ---
  {
    level: "B1",
    prompt_kr:
      "채식이나 특별한 식단에 도전했던 경험을 다섯 문장으로 써 보세요. '-기는 하지만'과 '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write five sentences about trying a vegetarian or special diet. Use both '-기는 하지만' and '-을 정도로'.",
    example_kr:
      "채식은 건강에 좋기는 하지만 처음에는 적응하기 힘들었어요. 고기 생각이 날 정도로 참기 어려운 날도 있었어요. 그래도 몸이 가벼워질 정도로 효과를 느꼈어요. 요리법을 새로 배우기는 하지만 점점 재미있어졌어요. 앞으로도 건강한 식습관을 유지하고 싶어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "가족의 전통 음식을 배웠던 경험을 다섯 문장으로 써 보세요. '-는 대로'와 '-치고는'을 사용하세요.",
    prompt_en:
      "Write five sentences about learning a traditional family recipe. Use both '-는 대로' and '-치고는'.",
    example_kr:
      "할머니가 알려 주시는 대로 김장을 따라 해 봤어요. 처음 만든 것치고는 맛이 꽤 괜찮았어요. 재료를 준비하는 대로 순서를 하나씩 배웠어요. 초보자치고는 손이 빠르다는 칭찬도 들었어요. 앞으로도 가족의 요리 비법을 계속 배우고 싶어요.",
  },

  // --- Additional technology episodes ---
  {
    level: "B1",
    prompt_kr:
      "인공지능 서비스를 처음 사용해 본 경험을 다섯 문장으로 써 보세요. '-을 정도로'와 '-았더니'를 사용하세요.",
    prompt_en:
      "Write five sentences about the first time you used an AI service. Use both '-을 정도로' and '-았더니'.",
    example_kr:
      "인공지능 서비스를 처음 써 봤을 때 신기할 정도로 편리했어요. 질문을 입력했더니 빠르게 답을 알려 줬어요. 놀랄 정도로 정확한 정보를 얻은 적도 있었어요. 몇 번 사용했더니 점점 익숙해졌어요. 이제는 일상생활에서도 자주 활용하고 있어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "SNS 사용 시간을 줄이려고 했던 경험을 다섯 문장으로 써 보세요. '-는 한'과 '-기는 하지만'을 사용하세요.",
    prompt_en:
      "Write five sentences about trying to reduce your social media usage time. Use both '-는 한' and '-기는 하지만'.",
    example_kr:
      "SNS는 재미있기는 하지만 시간을 너무 많이 쓰게 돼요. 사용 시간을 정해 두는 한 조절이 가능하다고 생각했어요. 그래서 하루 삼십 분으로 제한을 두기는 했어요. 계획을 지키는 한 다른 일에도 집중할 수 있었어요. 앞으로도 이 습관을 계속 지켜 나가고 싶어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "스마트 기기로 집안일을 편리하게 했던 경험을 다섯 문장으로 써 보세요. '-는 김에'와 '-는 대로'를 사용하세요.",
    prompt_en:
      "Write five sentences about using a smart device to make household chores more convenient. Use both '-는 김에' and '-는 대로'.",
    example_kr:
      "로봇 청소기를 산 김에 다른 스마트 기기도 함께 알아봤어요. 청소가 끝나는 대로 알림이 와서 편리했어요. 기기를 설치한 김에 조명도 자동으로 조절되게 만들었어요. 설정한 시간이 되는 대로 자동으로 작동해서 편했어요. 덕분에 집안일에 드는 시간이 많이 줄었어요.",
  },

  // --- Round two: broader variety across the four topics ---
  {
    level: "B1",
    prompt_kr:
      "재택근무를 하면서 겪은 어려움을 다섯 문장으로 써 보세요. '-을 텐데'와 '-치고는'을 사용하세요.",
    prompt_en:
      "Write five sentences about difficulties experienced while working from home. Use both '-을 텐데' and '-치고는'.",
    example_kr:
      "재택근무를 하면 더 편할 텐데 오히려 집중하기가 어려웠어요. 처음치고는 나쁘지 않게 적응했다고 생각했어요. 하지만 계속 집에 있으면 답답할 텐데 밖에 나갈 시간도 없었어요. 재택근무자치고는 규칙적으로 생활하려고 노력한 편이에요. 이제는 저만의 방법을 찾아서 훨씬 편해졌어요.",
  },
  {
    level: "B1",
    prompt_kr:
      "회사 동료에게 조언을 구했던 경험을 다섯 문장으로 써 보세요. '-는 대로'와 '-았더니'를 사용하세요.",
    prompt_en:
      "Write five sentences about asking a coworker for advice. Use both '-는 대로' and '-았더니'.",
    example_kr:
      "선배가 조언해 주는 대로 업무 순서를 바꿔 봤어요. 방법을 바꿨더니 일이 훨씬 수월해졌어요. 궁금한 점이 생기는 대로 바로 물어봤어요. 자세히 설명을 들었더니 이해가 빨라졌어요. 앞으로도 어려운 일이 있으면 주저하지 않고 물어보려고 해요.",
  },
  {
    level: "B1",
    prompt_kr:
      "명절 용돈을 어떻게 썼는지 다섯 문장으로 써 보세요. '-는 김에'와 '-을 정도로'를 사용하세요.",
    prompt_en:
      "Write five sentences about how you spent holiday money you received. Use both '-는 김에' and '-을 정도로'.",
    example_kr:
      "명절에 용돈을 받은 김에 갖고 싶었던 물건을 하나 샀어요. 기분이 좋을 정도로 오랜만에 여유롭게 쇼핑했어요. 쇼핑한 김에 남은 돈은 저축 통장에 넣어 뒀어요. 가족들이 놀랄 정도로 계획적으로 돈을 나눠서 썼어요. 다음 명절에도 이렇게 현명하게 쓰고 싶어요.",
  },
];
