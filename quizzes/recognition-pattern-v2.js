const a = (id, text, signals, evidence) => ({ id, text, signals, evidence });
const q = (id, text, reason, investigates, options) => ({ id, text, reason, investigates, options });

export default {
  id: "recognition-pattern",
  slug: "how-do-you-seek-recognition",
  version: 2,
  status: "retired",
  metadata: {
    title: "How Do You Seek Recognition?",
    description: "A private, answer-responsive reflection on being seen, needed, trusted, and understood.",
    category: "self-discovery",
    targetCustomer: "Adults who want to understand the role recognition plays in their relationships and work.",
    durationMinutes: 8,
    questionRange: "15–20 adaptive questions",
    accessDays: 7
  },
  offers: [{ id: "full-result", label: "Full private analysis", currency: "hkd", amount: 2900 }],
  flow: { mode: "adaptive-investigation-v1", previewQuestionIds: ["recognition-v2-01", "recognition-v2-02", "recognition-v2-03", "recognition-v2-04", "recognition-v2-05"], minQuestions: 15, maxQuestions: 20, confidenceMargin: 5 },
  teaser: {
    heading: "What your first answers suggest",
    observations: {
      visibility: "Being noticed seems to matter most when it confirms that your effort or perspective has weight.",
      influence: "You seem especially alert to whether you have a meaningful say when something important is taking shape.",
      protection: "You seem careful about exposure: being seen is not simple when there is a risk of being misunderstood.",
      default: "Your first answers suggest that recognition is tied to more than simple praise for you."
    },
    uncertainty: "We are seeing signs of more than one possible pattern.",
    next: "The remaining questions look at what happens after attention, criticism, responsibility, and closeness enter the picture."
  },
  questions: [
    q("recognition-v2-01", "You offer an idea that matters to you and the conversation moves on without really responding. What stays with you afterward?", "Establish whether being overlooked is experienced as lost influence, lost visibility, or emotional exposure.", ["visibility", "influence", "protection"], [
      a("a", "I replay what I could have said differently so it would have landed.", { visibility: 3 }, "You described trying to make an overlooked contribution land more clearly."),
      a("b", "I wonder who will make the decision without my input.", { influence: 3 }, "You focused on losing a say in what happens next."),
      a("c", "I tell myself it is fine, but become less willing to offer more.", { protection: 3 }, "You described pulling back after a contribution passed without response.")
    ]),
    q("recognition-v2-02", "When someone gives you genuine praise, which part is most meaningful?", "Separate a need for acknowledgement from a wish for influence or safe closeness.", ["visibility", "influence", "protection"], [
      a("a", "That they noticed the care or ability behind what I did.", { visibility: 3 }, "You valued having the care behind your contribution noticed."),
      a("b", "That it makes them more likely to trust my judgement next time.", { influence: 3 }, "You linked appreciation to being trusted with future responsibility."),
      a("c", "That it feels sincere enough for me to let my guard down a little.", { protection: 3 }, "You linked appreciation to feeling safe enough to soften.")
    ]),
    q("recognition-v2-03", "A person you respect becomes the centre of attention in an area you care about. What is your first inner response?", "Explore comparison without assuming envy or competition.", ["visibility", "influence", "protection"], [
      a("a", "I want to know whether there is still room for my own contribution to be visible.", { visibility: 3 }, "You looked for room for your own contribution beside someone else’s attention."),
      a("b", "I start watching whether their influence changes the direction of things.", { influence: 3 }, "You watched how another person’s attention might shape the outcome."),
      a("c", "I become more careful about showing how much it affects me.", { protection: 3 }, "You described protecting how much another person’s attention affects you.")
    ]),
    q("recognition-v2-04", "You learn that an important decision was made without you. Which question feels most urgent?", "Identify whether exclusion is about status, agency, or trust.", ["visibility", "influence", "protection"], [
      a("a", "Did they not think of me as someone whose view mattered?", { visibility: 3 }, "You questioned whether your view was considered to matter."),
      a("b", "What was decided, and can I still influence what happens now?", { influence: 3 }, "You focused on recovering influence over what happens next."),
      a("c", "Was I left out because they did not trust how I would react?", { protection: 3 }, "You wondered whether exclusion reflected a lack of emotional trust.")
    ]),
    q("recognition-v2-05", "Someone misunderstands your intention in front of other people. What do you usually do first?", "Test the immediate strategy used when recognition and exposure collide.", ["visibility", "influence", "protection"], [
      a("a", "I clarify quickly because I do not want the wrong impression to settle.", { visibility: 3 }, "You moved quickly to correct an impression of you."),
      a("b", "I explain the reasoning so the situation can be understood properly.", { influence: 3 }, "You tried to restore shared understanding through the reasoning behind your choice."),
      a("c", "I go quieter and decide later whether it is worth explaining myself.", { protection: 3 }, "You described creating distance before deciding whether to explain yourself.")
    ]),
    q("recognition-v2-06", "After your contribution receives little response, what are you most likely to do next?", "Follow the visibility thread into behaviour rather than asking another general trait statement.", ["visibility"], [
      a("a", "Find a more concrete way to show its value.", { visibility: 3, influence: 1 }, "You try to make your contribution more legible rather than abandon it."),
      a("b", "Wait to see whether someone notices the gap without my help.", { visibility: 2, protection: 1 }, "You wait to see whether recognition appears without asking for it."),
      a("c", "Put my energy into something where I will not need to ask to be noticed.", { protection: 2, visibility: 1 }, "You redirect energy away from a place where you feel unseen.")
    ]),
    q("recognition-v2-07", "When attention finally comes your way after you have felt overlooked, how long does the relief usually last?", "Distinguish a moment of reassurance from a stable sense of being valued.", ["visibility", "protection"], [
      a("a", "It settles me; I can move on without needing more proof.", { visibility: 1 }, "You described recognition as enough to let the issue settle."),
      a("b", "It helps, but I still watch whether it turns into real respect or trust.", { visibility: 2, influence: 1 }, "You look for whether attention becomes sustained respect."),
      a("c", "I enjoy it, then become wary of relying on it too much.", { protection: 3 }, "You described becoming cautious about depending on recognition.")
    ]),
    q("recognition-v2-08", "A colleague or friend receives credit for work you both shaped. What response would feel most fair?", "Investigate the meaning of credit and the preferred repair.", ["visibility", "influence"], [
      a("a", "A clear acknowledgement of what each of us contributed.", { visibility: 3 }, "You wanted the contribution itself to be named accurately."),
      a("b", "A conversation about how decisions and credit will be handled next time.", { influence: 3 }, "You wanted a fairer process for influence and credit in the future."),
      a("c", "Nothing public; I would rather decide whether this is a place where I want to keep investing.", { protection: 3 }, "You considered protecting future investment rather than pursuing public credit.")
    ]),
    q("recognition-v2-09", "Someone asks you to hand over a task you care about. What makes it easiest to say yes?", "Explore whether control is driven by standards, trust, or self-protection.", ["influence", "protection"], [
      a("a", "They understand the standard I am trying to protect.", { influence: 3 }, "You need confidence that the direction and standard will be understood."),
      a("b", "They invite my input at the moments that really matter.", { influence: 2, visibility: 1 }, "You value retaining a meaningful voice even when someone else takes the task."),
      a("c", "I know that if it goes badly, I will not be blamed or exposed for it.", { protection: 3 }, "You need protection from being exposed by an outcome you cannot control.")
    ]),
    q("recognition-v2-10", "When a group chooses a direction you disagree with, what is hardest about stepping back?", "Continue the influence thread by testing the cost of not directing an outcome.", ["influence"], [
      a("a", "Watching something avoidable go wrong.", { influence: 3 }, "You found it hard to step back when you could see a preventable problem."),
      a("b", "Feeling as though my judgement has been dismissed.", { visibility: 2, influence: 2 }, "You experienced the disagreement partly as your judgement being discounted."),
      a("c", "Not knowing whether I will still be included once the decision is made.", { protection: 2, influence: 1 }, "You connected stepping back with uncertainty about continued inclusion.")
    ]),
    q("recognition-v2-11", "A plan is slow because nobody is taking ownership. What do you tend to do?", "Check whether taking charge is chosen freely, used to secure recognition, or used to avoid uncertainty.", ["influence", "visibility", "protection"], [
      a("a", "Name what is needed and offer a structure everyone can use.", { influence: 3 }, "You step in by creating structure for a shared outcome."),
      a("b", "Take it on because I know I can make it move.", { influence: 2, visibility: 1 }, "You take responsibility when action may demonstrate your usefulness."),
      a("c", "Hold back until someone explicitly asks, even if I could help.", { protection: 3 }, "You wait for explicit invitation before risking more investment.")
    ]),
    q("recognition-v2-12", "When criticism feels unfair, what makes it hardest to respond in the moment?", "Move from broad exposure into the exact friction point of criticism.", ["protection", "visibility", "influence"], [
      a("a", "I need time to separate what was said from what it seems to imply about me.", { protection: 3 }, "You need distance to separate feedback from its implications about you."),
      a("b", "I want the facts and context to be represented accurately.", { influence: 2, visibility: 1 }, "You want the facts and context restored before accepting the criticism."),
      a("c", "I do not want other people to form a simplified picture of me.", { visibility: 3 }, "You were concerned about a simplified impression settling with others.")
    ]),
    q("recognition-v2-13", "After a difficult exchange, someone asks what was really going on for you. What makes you answer honestly?", "Test the conditions under which emotional information becomes safe to share.", ["protection"], [
      a("a", "They ask without trying to correct or evaluate me.", { protection: 3 }, "You need curiosity without evaluation before opening up."),
      a("b", "They show they have noticed the effort beneath my reaction.", { visibility: 2, protection: 1 }, "You open more easily when effort beneath your reaction is recognised."),
      a("c", "They are willing to discuss what changes in practice, not only feelings.", { influence: 2, protection: 1 }, "You need a conversation to lead to a more workable shared reality.")
    ]),
    q("recognition-v2-14", "You share something tender and the other person responds lightly or changes the subject. What happens next?", "Investigate whether closeness produces a request, retreat, or attempt to regain control.", ["protection", "visibility"], [
      a("a", "I explain why it mattered, even if it feels awkward.", { visibility: 2, protection: 1 }, "You try to make the meaning of your vulnerability visible."),
      a("b", "I decide they are not the person to share that part with again.", { protection: 3 }, "You protect future openness after a response feels unsafe."),
      a("c", "I shift back to practical things so I do not feel exposed.", { protection: 2, influence: 1 }, "You regain steadiness by shifting from vulnerability to the practical.")
    ]),
    q("recognition-v2-15", "Looking back on a tense moment, what is most likely to bother you later?", "Ask for the recurring after-effect rather than another abstract self-description.", ["visibility", "influence", "protection"], [
      a("a", "That I did not make my point clearly enough.", { visibility: 2, influence: 1 }, "You revisit whether your point was clearly received."),
      a("b", "That I gave up influence too early.", { influence: 3 }, "You revisit whether you surrendered influence too quickly."),
      a("c", "That I revealed more than I wanted to.", { protection: 3 }, "You revisit the cost of having been emotionally visible.")
    ]),
    q("recognition-v2-16", "What kind of recognition changes your behaviour most?", "Clarify the outcome the customer is actually seeking from being seen.", ["visibility", "influence", "protection"], [
      a("a", "Being named as someone whose contribution made a difference.", { visibility: 3 }, "You respond strongly to recognition that names your contribution."),
      a("b", "Being trusted with more room to decide or shape things.", { influence: 3 }, "You respond strongly when recognition becomes increased trust and agency."),
      a("c", "Being treated with enough care that I do not have to defend myself.", { protection: 3 }, "You respond strongly to recognition that makes self-protection less necessary.")
    ]),
    q("recognition-v2-17", "When you are doing well but nobody notices, which thought is closest to yours?", "Check whether private satisfaction is stable or recognition is needed to confirm value.", ["visibility", "protection"], [
      a("a", "I still know it matters; being noticed would simply be satisfying.", { visibility: 1 }, "You can retain a sense of value even without outside acknowledgement."),
      a("b", "I start wondering whether it really mattered if no one saw it.", { visibility: 3 }, "You described outside notice as affecting whether your contribution feels real."),
      a("c", "I prefer it that way; less attention means less expectation.", { protection: 3 }, "You described lower visibility as protection from expectation.")
    ]),
    q("recognition-v2-18", "If someone takes your feedback seriously but chooses a different path, what helps you accept it?", "Distinguish having influence from needing control over the final outcome.", ["influence"], [
      a("a", "Knowing that my view was genuinely considered.", { influence: 3 }, "You can accept a different outcome when your view had genuine weight."),
      a("b", "Seeing that they can explain the trade-off clearly.", { influence: 2 }, "You can accept a different outcome when the reasoning is visible."),
      a("c", "Having space to step back without needing to agree emotionally straight away.", { protection: 2, influence: 1 }, "You need room to process a different outcome without immediate emotional agreement.")
    ]),
    q("recognition-v2-19", "When a person becomes warmer only after you pull back, what do you make of it?", "Test how inconsistent attention is interpreted without diagnosing the other person.", ["visibility", "protection"], [
      a("a", "I feel relieved, but wait to see whether the change lasts.", { protection: 2, visibility: 1 }, "You notice relief but look for whether renewed attention becomes consistent."),
      a("b", "I feel more aware of how much their attention affects me.", { visibility: 3 }, "You became more aware of the pull that their attention has on you."),
      a("c", "I become less willing to return to the same level of openness.", { protection: 3 }, "You protect yourself from returning immediately to the same openness.")
    ]),
    q("recognition-v2-20", "What would feel like a healthier relationship with recognition for you?", "Close by testing the customer’s own preferred direction rather than imposing a type.", ["visibility", "influence", "protection"], [
      a("a", "Contributing without needing every effort to prove my value.", { visibility: 2, protection: 1 }, "You want contribution to feel less dependent on proof of value."),
      a("b", "Trusting other people with more of the direction without disappearing from it.", { influence: 2, protection: 1 }, "You want shared direction without losing your voice."),
      a("c", "Being seen more honestly without having to armour myself first.", { protection: 2, visibility: 1 }, "You want greater honesty without needing so much armour first.")
    ])
  ],
  resultBlueprint: {
    dimensions: {
      visibility: { label: "Recognition through visibility", title: "When being seen carries weight", story: "Your answers suggest that recognition is not merely applause for you. It becomes important when it confirms that your effort, judgement, or contribution has genuinely registered with other people.", pattern: "Visibility and acknowledgement", strength: "You care about making work and relationships more intentional; you notice where contribution is being missed.", blindSpot: "When acknowledgement is inconsistent, you may spend too much energy trying to make your value undeniable.", reflection: "Where could you keep contributing from conviction, while asking more directly for the recognition that is actually needed?", uncomfortable: "The harder possibility is that being noticed can start to carry more of your sense of security than you intended.", caveat: "This reflects the situations you described, not a fixed trait or diagnosis.", alternative: "It may also reflect a setting where good work is genuinely overlooked, rather than a personal need for attention." },
      influence: { label: "Recognition through influence", title: "When having a say matters", story: "Your answers suggest that recognition often means having a real place in the decisions that shape an outcome. Being consulted, trusted, and able to influence the direction appears more important than receiving praise alone.", pattern: "Agency, responsibility, and trust", strength: "You bring structure when things are vague and care about turning good judgement into workable action.", blindSpot: "Taking responsibility can quietly become the only way you feel secure that something important will be handled well.", reflection: "What would it look like to retain a voice without carrying the whole direction yourself?", uncomfortable: "The harder possibility is that control can sometimes feel safer than discovering whether another person could be trusted.", caveat: "This reflects the situations you described, not a fixed trait or diagnosis.", alternative: "It may also reflect a real history of being left to manage outcomes that others neglected." },
      protection: { label: "Recognition through safety", title: "When being seen also feels risky", story: "Your answers suggest that you want to be known accurately, but not at the cost of being simplified, criticised carelessly, or left exposed after you have shown something real.", pattern: "Recognition and emotional safety", strength: "You are discerning about where openness is earned and notice when care is missing from an interaction.", blindSpot: "Protecting yourself quickly can make it harder for others to learn how to meet you with the care you need.", reflection: "What is one small truth you could state earlier, before distance becomes the only available protection?", uncomfortable: "The harder possibility is that self-protection sometimes arrives before another person has had a fair chance to understand you.", caveat: "This reflects the situations you described, not a fixed trait or diagnosis.", alternative: "It may also reflect an environment where your openness has not been handled reliably." },
      default: { label: "Recognition in context", title: "What recognition is carrying for you", story: "Your answers suggest that recognition has several meanings for you: being noticed, having a say, and feeling safe enough to be understood.", pattern: "Mixed recognition needs", strength: "You are attentive to the quality of exchange rather than only surface approval.", blindSpot: "Different needs can become tangled when a situation is tense.", reflection: "Which need is most important to name first in your next difficult moment?", uncomfortable: "The harder possibility is that seeking recognition may sometimes be standing in for a clearer request.", caveat: "This reflects the situations you described, not a fixed trait or diagnosis.", alternative: "The pattern may be situational rather than a stable personal tendency." }
    },
    watchNext: {
      visibility: "Watch whether recognition becomes consistent respect and inclusion, rather than a brief moment of attention.",
      influence: "Watch whether people make room for your judgement without requiring you to take over the whole outcome.",
      protection: "Watch what happens when you make one small need explicit: do people respond with care, curiosity, and follow-through?",
      default: "Watch which part of recognition matters most in real situations: acknowledgement, influence, or emotional safety."
    }
  },
  marketing: { angles: [], hooks: [] },
  seo: { title: "How Do You Seek Recognition? | Quizzes it", description: "A private adaptive self-reflection quiz about being seen, trusted and understood.", canonicalPath: "/quiz/how-do-you-seek-recognition" }
};
