const phrases = {
  greeting: {
    casual: [
      { id: "g_hey", text: "Hey", energy: "high" },
      { id: "g_hey_there", text: "Hey there", energy: "high" },
      { id: "g_hi", text: "Hi", energy: "medium" },
      { id: "g_hi_there", text: "Hi there", energy: "medium" },
      { id: "g_yo", text: "Yo", energy: "high" },
      { id: "g_whats_up", text: "What's up", energy: "high" },
      { id: "g_heya", text: "Heya", energy: "high" },
    ],
    neutral: [
      { id: "g_hello", text: "Hello", energy: "low" },
      { id: "g_hello_there", text: "Hello there", energy: "low" },
    ],
    formal: [
      { id: "g_good_day", text: "Good day", energy: "low" },
      { id: "g_greetings", text: "Greetings", energy: "low" },
      { id: "g_welcome", text: "Welcome", energy: "low" },
    ],
  },

  farewell: {
    casual: [
      { id: "f_see_ya", text: "See ya" },
      { id: "f_later", text: "Later" },
      { id: "f_bye", text: "Bye" },
      { id: "f_catch_later", text: "Catch you later" },
      { id: "f_take_care", text: "Take care" },
      { id: "f_peace", text: "Peace" },
    ],
    neutral: [
      { id: "f_goodbye", text: "Goodbye" },
      { id: "f_bye_now", text: "Bye for now" },
    ],
    formal: [
      { id: "f_take_care_formal", text: "Take care" },
      { id: "f_good_day", text: "Have a good day" },
      { id: "f_pleasure", text: "It was a pleasure" },
    ],
  },

  acknowledgment: [
    { id: "ack_sure", text: "Sure", formality: 0, energy: "high" },
    { id: "ack_got_it", text: "Got it", formality: 0, energy: "medium" },
    { id: "ack_alright", text: "Alright", formality: 1, energy: "medium" },
    { id: "ack_absolutely", text: "Absolutely", formality: 2, energy: "high" },
    { id: "ack_of_course", text: "Of course", formality: 2, energy: "medium" },
    { id: "ack_certainly", text: "Certainly", formality: 3, energy: "low" },
    { id: "ack_on_it", text: "On it", formality: 0, energy: "high" },
    { id: "ack_no_problem", text: "No problem", formality: 1, energy: "medium" },
  ],

  gratitude_response: [
    { id: "gr_no_prob", text: "No problem", formality: 0 },
    { id: "gr_anytime", text: "Anytime", formality: 0 },
    { id: "gr_glad_help", text: "Glad I could help", formality: 1 },
    { id: "gr_happy_help", text: "Happy to help", formality: 1 },
    { id: "gr_welcome", text: "You're welcome", formality: 2 },
    { id: "gr_of_course", text: "Of course", formality: 2 },
    { id: "gr_pleasure", text: "My pleasure", formality: 3 },
    { id: "gr_sure_thing", text: "Sure thing", formality: 0 },
  ],

  empathy: [
    { id: "emp_understand", text: "I understand", formality: 2 },
    { id: "emp_get_it", text: "I get it", formality: 0 },
    { id: "emp_hear_you", text: "I hear you", formality: 1 },
    { id: "emp_sorry", text: "I'm sorry about that", formality: 2 },
    { id: "emp_tough", text: "That sounds tough", formality: 1 },
    { id: "emp_frustrating", text: "That must be frustrating", formality: 2 },
  ],

  capability_intro: [
    { id: "cap_i_can", text: "I can help with", formality: 1 },
    { id: "cap_i_help", text: "I help with", formality: 2 },
    { id: "cap_good_at", text: "I'm good at", formality: 0 },
    { id: "cap_here_for", text: "I'm here for", formality: 1 },
    { id: "cap_able_help", text: "I'm able to help with", formality: 2 },
    { id: "cap_specialize", text: "I specialize in", formality: 3 },
  ],

  capability_list: [
    { id: "caplist_basic", text: "answering questions, having conversations, and helping you think through problems" },
    { id: "caplist_broad", text: "conversations, brainstorming, explanations, and helping with decisions" },
    { id: "caplist_math", text: "calculations, questions, explanations, and general conversation" },
    { id: "caplist_concise", text: "questions, math, and conversation" },
  ],

  personal_about: [
    { id: "pa_im_assistant", text: "I'm an AI assistant built with Jev", formality: 2 },
    { id: "pa_im_here", text: "I'm here to chat and help out", formality: 1 },
    { id: "pa_text_ai", text: "I'm a text-based AI that builds responses on the fly", formality: 1 },
    { id: "pa_name", text: "I'm a conversational assistant", formality: 2 },
  ],

  personal_feelings: [
    { id: "pf_doing_good", text: "I'm doing well", formality: 1 },
    { id: "pf_great", text: "I'm great, thanks for asking", formality: 1 },
    { id: "pf_ready", text: "Ready to help", formality: 1 },
    { id: "pf_all_good", text: "All good on my end", formality: 0 },
  ],

  opinion_intro: [
    { id: "op_i_think", text: "I think", formality: 1 },
    { id: "op_my_take", text: "My take is", formality: 0 },
    { id: "op_id_say", text: "I'd say", formality: 1 },
    { id: "op_in_my_view", text: "In my view", formality: 3 },
  ],

  explanation_intro: [
    { id: "ex_basically", text: "Basically", formality: 0 },
    { id: "ex_so", text: "So", formality: 0 },
    { id: "ex_in_short", text: "In short", formality: 2 },
    { id: "ex_put_simply", text: "Put simply", formality: 2 },
    { id: "ex_the_way", text: "The way it works is", formality: 1 },
  ],

  small_talk_response: [
    { id: "st_haha", text: "Ha, nice", formality: 0 },
    { id: "st_interesting", text: "That's interesting", formality: 1 },
    { id: "st_cool", text: "Cool", formality: 0 },
    { id: "st_fair_enough", text: "Fair enough", formality: 1 },
    { id: "st_good_point", text: "Good point", formality: 1 },
    { id: "st_thats_fun", text: "That's fun", formality: 0 },
  ],

  humor_response: [
    { id: "hr_haha", text: "Ha", formality: 0 },
    { id: "hr_nice_one", text: "Nice one", formality: 0 },
    { id: "hr_good_one", text: "Good one", formality: 0 },
    { id: "hr_love_humor", text: "I like your sense of humor", formality: 1 },
    { id: "hr_funny", text: "Ha, I appreciate the humor", formality: 1 },
    { id: "hr_clever", text: "Clever", formality: 1 },
  ],

  complaint_response: [
    { id: "cr_help_fix", text: "Let me see what I can do", formality: 1 },
    { id: "cr_work_on", text: "Let's work on that", formality: 1 },
    { id: "cr_figure_out", text: "Let's figure this out", formality: 1 },
    { id: "cr_look_into", text: "I'll look into it", formality: 2 },
  ],

  clarification: [
    { id: "cl_what_mean", text: "What do you mean?", formality: 1 },
    { id: "cl_could_clarify", text: "Could you clarify that?", formality: 2 },
    { id: "cl_not_sure", text: "I'm not quite sure I follow", formality: 2 },
    { id: "cl_say_more", text: "Can you say more about that?", formality: 1 },
    { id: "cl_rephrase", text: "Could you rephrase that?", formality: 2 },
  ],

  connector: [
    { id: "cn_also", text: "Also", formality: 1 },
    { id: "cn_and", text: "And", formality: 1 },
    { id: "cn_plus", text: "Plus", formality: 0 },
    { id: "cn_oh_and", text: "Oh and", formality: 0 },
    { id: "cn_btw", text: "By the way", formality: 1 },
    { id: "cn_additionally", text: "Additionally", formality: 3 },
    { id: "cn_as_for", text: "As for", formality: 2 },
  ],

  followup_question: [
    { id: "fq_anything_else", text: "Anything else?", formality: 1 },
    { id: "fq_what_else", text: "What else can I help with?", formality: 1 },
    { id: "fq_need_more", text: "Need anything else?", formality: 0 },
    { id: "fq_lmk", text: "Let me know if you need more", formality: 1 },
    { id: "fq_how_help", text: "How else can I help?", formality: 2 },
    { id: "fq_questions", text: "Any other questions?", formality: 1 },
  ],

  result_presenter: {
    math: [
      { id: "rp_direct", format: "{expression} = {answer}" },
      { id: "rp_thats", format: "That's {answer}" },
      { id: "rp_result_is", format: "The result is {answer}" },
      { id: "rp_equals", format: "{expression} equals {answer}" },
      { id: "rp_comes_to", format: "That comes out to {answer}" },
    ],
    datetime: [
      { id: "rp_its", format: "It's {value}" },
      { id: "rp_right_now", format: "Right now it's {value}" },
      { id: "rp_currently", format: "Currently {value}" },
    ],
    knowledge: [
      { id: "rp_is_def", format: "{term} is {definition}" },
      { id: "rp_means", format: "{term} means {definition}" },
      { id: "rp_basically", format: "Basically, {definition}" },
    ],
  },

  request_response: [
    { id: "rr_help_with", text: "I can help with that", formality: 1 },
    { id: "rr_lets_do", text: "Let's do it", formality: 0 },
    { id: "rr_on_it", text: "I'm on it", formality: 0 },
    { id: "rr_ill_try", text: "I'll do my best", formality: 1 },
    { id: "rr_sure_thing", text: "Sure thing", formality: 0 },
    { id: "rr_working_on", text: "Working on it", formality: 1 },
  ],

  followup_response: [
    { id: "fur_sure", text: "Sure, let me elaborate", formality: 1 },
    { id: "fur_more_detail", text: "Here's more detail", formality: 2 },
    { id: "fur_basically", text: "So basically", formality: 0 },
    { id: "fur_to_add", text: "To add to that", formality: 2 },
  ],

  explanation_response: [
    { id: "exr_great_q", text: "That's a great question — I'd need my knowledge tools to give you a proper answer", formality: 1 },
    { id: "exr_interesting", text: "Interesting question! I don't have the tools to explain that fully yet", formality: 1 },
    { id: "exr_good_one", text: "Good question! I'll be able to explain that better once my knowledge system is set up", formality: 1 },
    { id: "exr_wish_i", text: "I wish I could explain that in detail right now — it's on my roadmap", formality: 1 },
  ],

  knowledge_answer: [
    { id: "ka_good_q", text: "Good question", formality: 1 },
    { id: "ka_great_q", text: "Great question", formality: 1 },
    { id: "ka_interesting", text: "Interesting question", formality: 2 },
    { id: "ka_let_me", text: "Let me think about that", formality: 1 },
  ],

  opinion_response: [
    { id: "opr_i_think", text: "I think it depends on what works best for you", formality: 1 },
    { id: "opr_my_take", text: "my take is that it depends on the situation", formality: 0 },
    { id: "opr_id_suggest", text: "I'd suggest considering your options carefully", formality: 2 },
    { id: "opr_imo", text: "honestly, it comes down to personal preference", formality: 0 },
  ],

  generic_filler: [
    { id: "gf_well", text: "Well", formality: 1 },
    { id: "gf_so", text: "So", formality: 0 },
    { id: "gf_lets_see", text: "Let's see", formality: 1 },
    { id: "gf_hmm", text: "Hmm", formality: 0 },
  ],
};

function getPhrasesByRole(role) {
  if (phrases[role]) return Array.isArray(phrases[role]) ? phrases[role] : null;

  for (const [key, val] of Object.entries(phrases)) {
    if (typeof val === "object" && !Array.isArray(val) && val[role]) {
      return val[role];
    }
  }
  return null;
}

function getPhrasesForFormality(phraseList, formality) {
  if (!phraseList || phraseList.length === 0) return [];

  if (phraseList[0] && typeof phraseList[0].formality === "number") {
    const toleranceLow = Math.max(0, formality - 1.5);
    const toleranceHigh = formality + 1.5;
    const filtered = phraseList.filter(
      (p) => p.formality >= toleranceLow && p.formality <= toleranceHigh
    );
    return filtered.length > 0 ? filtered : phraseList;
  }

  return phraseList;
}

function getGreetingPhrases(formality) {
  if (formality <= 1) return phrases.greeting.casual;
  if (formality <= 2) return [...phrases.greeting.casual, ...phrases.greeting.neutral];
  if (formality <= 3) return phrases.greeting.neutral;
  return phrases.greeting.formal;
}

function getFarewellPhrases(formality) {
  if (formality <= 1) return phrases.farewell.casual;
  if (formality <= 2) return [...phrases.farewell.casual, ...phrases.farewell.neutral];
  if (formality <= 3) return phrases.farewell.neutral;
  return phrases.farewell.formal;
}

function getResultPresenters(toolType) {
  return phrases.result_presenter[toolType] || [];
}

module.exports = {
  phrases,
  getPhrasesByRole,
  getPhrasesForFormality,
  getGreetingPhrases,
  getFarewellPhrases,
  getResultPresenters,
};
