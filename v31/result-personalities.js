const labels = {
  en: {
    motivation: "Motivation",
    therapist: "Therapist",
    bestie: "Bestie",
    darkTriad: "Dark Triad",
    consensus: "What All Four Agree On"
  },
  "zh-Hant": {
    motivation: "行動動力",
    therapist: "治療師角度",
    bestie: "好友直言",
    darkTriad: "暗黑視角",
    consensus: "四個角度的共同結論"
  }
};

function englishVoices(packet) {
  const primary = packet.primaryLabel.toLowerCase();
  const secondary = packet.secondaryLabel.toLowerCase();
  return {
    motivation: [
      "Stop waiting for one more sign. You already know enough to treat " + primary + " as the leading pattern and decide what standard you will accept.",
      "Accountability means owning your next move without blaming yourself; " + secondary + " may add nuance, but it does not get to keep your life on hold.",
      "Choose one action you can take now—ask directly, state the boundary, or redirect your energy—and judge what happens next by behaviour, not promises."
    ],
    therapist: [
      "Your feelings make sense, especially if " + primary + " touches attachment, hope, or self-protection. They deserve care, but they do not have to become evidence.",
      "Notice the relational dynamic between what you observe and what your nervous system predicts; " + secondary + " may explain some uncertainty without cancelling your main reading.",
      "Give yourself enough regulation to ask what feels emotionally safe, then set one boundary that protects you from carrying the whole connection alone."
    ],
    bestie: [
      "Bestie, listen. We’re not turning every weird detail into a full investigation. The strongest read is " + primary + ", so let what they actually do count.",
      "The pull toward " + secondary + " can be part of the picture, but I’m still side-eyeing any explanation that leaves you confused while doing all the work.",
      "Keep what feels mutual, say what you need, and stop volunteering for crumbs; you deserve a situation that does not require forensic texting."
    ],
    darkTriad: [
      "Strip the feelings out for a second. Your strongest signal is " + primary + ", and your attention has value.",
      "If you are investing more time, access, and energy than you receive back, the resource allocation is weak; " + secondary + " may remain possible, but possibility alone earns no premium access.",
      "Protect your leverage by keeping alternatives open, requiring reciprocal investment, and watching the opportunity cost before you commit more."
    ]
  };
}

function chineseVoices(packet) {
  const primary = packet.primaryLabel;
  const secondary = packet.secondaryLabel;
  return {
    motivation: [
      "不要再等多一個訊號。你已知道足夠，可以把「" + primary + "」視為主要模式，決定自己願意接受甚麼標準。",
      "承擔下一步不等於責怪自己；「" + secondary + "」可以補充細節，但你不需要因此把生活繼續停在原地。",
      "現在選一個你能做到的行動：直接提問、說清界線，或把精力轉回自己，再按實際行為而不是承諾判斷下一步。"
    ],
    therapist: [
      "你的感受很合理，尤其當「" + primary + "」碰到依附、期望或自我保護。感受值得被照顧，但不必自動變成證據。",
      "留意你真正觀察到的互動，和神經系統預測的危險之間有多大距離；「" + secondary + "」可以解釋部分不確定，卻不會推翻主要模式。",
      "先給自己足夠空間調節情緒，再問甚麼才算情緒安全，並訂下一條能保護你、不再獨力承擔整段關係的界線。"
    ],
    bestie: [
      "聽我說，我們不要把每個奇怪細節都變成大型調查。「" + primary + "」是最明顯的方向，所以讓對方真正做過的事算數。",
      "「" + secondary + "」可以是其中一部分，但如果一個解釋令你繼續混亂、又要獨力做所有功夫，我仍然會側目。",
      "留下互相的部分，說清楚你需要甚麼，別再主動接收零碎回應；你值得一段不用開訊息鑑證大會的關係。"
    ],
    darkTriad: [
      "先把感受抽走一會。你最強的訊號是「" + primary + "」，而你的注意力有價值。",
      "如果你投入的時間、接近資格和精力，比收到的回報更多，資源分配便很差；「" + secondary + "」可以保留為可能，但可能性本身不值得你給它更多注意，或更多接近你的空間。",
      "保護你的籌碼，保留其他選項，要求對等投入，並在付出更多之前計算機會成本。"
    ]
  };
}

export function buildResultPersonalities({ packet, locale = "en" }) {
  const l = labels[locale];
  const paragraphs = locale === "zh-Hant" ? chineseVoices(packet) : englishVoices(packet);
  const personalities = Object.fromEntries(Object.entries(paragraphs).map(([key, voiceParagraphs]) => [
    key,
    { title: l[key], paragraphs: voiceParagraphs }
  ]));
  const consensus = locale === "zh-Hant"
    ? "以持續行為為準，守住自己的標準和界線，再按接下來真正發生的事決定下一步。"
    : "Judge the pattern by consistent behaviour, keep your standards and boundaries intact, and let what happens next—not imagined potential—guide your decision.";
  return {
    personalities,
    consensus: { title: l.consensus, content: consensus }
  };
}
