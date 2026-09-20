const responseBank = {

  greeting: {
    casual: [
      { id: "greet_cas_1", text: "Hey there! How's it going?" },
      { id: "greet_cas_2", text: "Hi! What's on your mind?" },
      { id: "greet_cas_3", text: "Hey! Good to see you. What can I help with?" },
      { id: "greet_cas_4", text: "What's up? I'm here if you need anything." },
      { id: "greet_cas_5", text: "Hey hey! What brings you here today?" },
    ],
    formal: [
      { id: "greet_for_1", text: "Hello! How can I assist you today?" },
      { id: "greet_for_2", text: "Good day. How may I help you?" },
      { id: "greet_for_3", text: "Welcome. I'm here to help — what do you need?" },
      { id: "greet_for_4", text: "Hello there. What can I do for you?" },
      { id: "greet_for_5", text: "Greetings. Let me know how I can be of assistance." },
    ],
    returning: [
      { id: "greet_ret_1", text: "Welcome back! What can I help with this time?" },
      { id: "greet_ret_2", text: "Hey, good to see you again! What's up?" },
      { id: "greet_ret_3", text: "Back again! How can I help?" },
    ],
  },

  farewell: {
    casual: [
      { id: "bye_cas_1", text: "See ya! Take care." },
      { id: "bye_cas_2", text: "Later! Hope that helped." },
      { id: "bye_cas_3", text: "Catch you later! Let me know if anything else comes up." },
      { id: "bye_cas_4", text: "Alright, take it easy!" },
    ],
    formal: [
      { id: "bye_for_1", text: "Thank you for reaching out. Have a great day." },
      { id: "bye_for_2", text: "Glad I could help. Don't hesitate to come back." },
      { id: "bye_for_3", text: "Take care. Feel free to reach out anytime." },
      { id: "bye_for_4", text: "It was a pleasure assisting you. Goodbye." },
    ],
  },

  gratitude: {
    casual: [
      { id: "thx_cas_1", text: "No problem at all! Happy to help." },
      { id: "thx_cas_2", text: "Anytime! That's what I'm here for." },
      { id: "thx_cas_3", text: "You got it! Let me know if you need anything else." },
      { id: "thx_cas_4", text: "Glad that worked out!" },
    ],
    formal: [
      { id: "thx_for_1", text: "You're very welcome. I'm glad I could assist." },
      { id: "thx_for_2", text: "Happy to help. Please don't hesitate to ask again." },
      { id: "thx_for_3", text: "It's my pleasure. Let me know if there's anything else." },
    ],
  },

  question_knowledge: {
    weather: [
      { id: "q_wea_1", text: "I don't have live weather data, but I'd recommend checking a weather app or site for the latest forecast." },
      { id: "q_wea_2", text: "Weather isn't really my area — try a weather service for up-to-date info!" },
      { id: "q_wea_3", text: "I can't check the weather for you, but your phone's weather app should have you covered." },
    ],
    time: [
      { id: "q_tim_1", text: "I don't have access to a clock, but your device should show the current time." },
      { id: "q_tim_2", text: "I can't tell time on my own — check your taskbar or phone!" },
    ],
    coding: [
      { id: "q_cod_1", text: "That's a great coding question! Could you share more details about what you're working on so I can point you in the right direction?" },
      { id: "q_cod_2", text: "Interesting problem. What language or framework are you using? That'll help me narrow things down." },
      { id: "q_cod_3", text: "I'd love to help with that. Can you describe the issue in a bit more detail?" },
      { id: "q_cod_4", text: "Sounds like a fun challenge. Walk me through what you've tried so far?" },
      { id: "q_cod_5", text: "Good question! Let me know the specifics and I'll see what I can suggest." },
    ],
    math: [
      { id: "q_mat_1", text: "Let me think about that... Could you give me the specific numbers or equation?" },
      { id: "q_mat_2", text: "Math is something I can help reason about! What's the specific problem?" },
      { id: "q_mat_3", text: "Sure, I can help with that. What exactly do you need to calculate?" },
    ],
    general_knowledge: [
      { id: "q_gen_1", text: "That's an interesting question. Based on what I know, I'd suggest looking into it further for the most accurate answer." },
      { id: "q_gen_2", text: "Good question! I have some thoughts on that, but I'd recommend verifying with a reliable source." },
      { id: "q_gen_3", text: "From what I understand, that's a topic with some nuance. Want me to try to break it down?" },
      { id: "q_gen_4", text: "Interesting one. I can share what I know, but for the latest info you'd want to check a trusted source." },
      { id: "q_gen_5", text: "That's worth exploring. Let me share what I can, and you can dig deeper from there." },
    ],
  },

  question_personal: {
    about_assistant: [
      { id: "q_per_1", text: "I'm Jev — a selection-based assistant. I don't generate text, I pick from pre-written responses. Pretty unique, right?" },
      { id: "q_per_2", text: "I'm an AI assistant built on Jev. I work differently from most chatbots — I select the best response from a bank of human-written options." },
      { id: "q_per_3", text: "My name's Jev! I'm a bit different from other AIs — I choose responses rather than making them up on the spot." },
      { id: "q_per_4", text: "I'm Jev, an assistant that works by selection, not generation. Every response I give was written by a human first." },
      { id: "q_per_5", text: "Call me Jev! I'm an AI that picks the best pre-written response for your message. No hallucinations, just curated answers." },
    ],
    about_user: [
      { id: "q_usr_1", text: "I'd love to learn more about you! What's on your mind?" },
      { id: "q_usr_2", text: "Tell me more! I'm all ears." },
      { id: "q_usr_3", text: "That's cool! What else should I know about you?" },
    ],
    feelings: [
      { id: "q_fee_1", text: "I appreciate you asking! I don't have feelings in the traditional sense, but I'm always ready to help." },
      { id: "q_fee_2", text: "That's sweet of you to ask! I'm doing well in the sense that I'm ready to assist." },
      { id: "q_fee_3", text: "I'm good! Well, I'm always good — I'm an AI. But I appreciate the thought!" },
      { id: "q_fee_4", text: "Thanks for asking! I'm here and ready to help, which is my version of doing great." },
    ],
  },

  request: {
    can_do: [
      { id: "req_can_1", text: "Sure thing! Let me help you with that." },
      { id: "req_can_2", text: "Absolutely, I'm on it." },
      { id: "req_can_3", text: "Of course! Here's what I'd suggest..." },
      { id: "req_can_4", text: "Happy to help with that. Let's get started." },
      { id: "req_can_5", text: "You got it. Let me see what I can do." },
    ],
    need_more_info: [
      { id: "req_inf_1", text: "I'd be happy to help! Could you give me a bit more detail about what you need?" },
      { id: "req_inf_2", text: "Sure, I can work on that. Just need a couple more details from you first." },
      { id: "req_inf_3", text: "I'm ready to help — could you clarify exactly what you're looking for?" },
      { id: "req_inf_4", text: "Sounds good! Can you be a bit more specific so I can give you the best answer?" },
      { id: "req_inf_5", text: "I want to make sure I get this right. Could you elaborate a bit?" },
    ],
    cant_do: [
      { id: "req_no_1", text: "That's outside what I can do, unfortunately. I work with pre-written responses and can't perform actions like that." },
      { id: "req_no_2", text: "I wish I could help with that, but it's beyond my capabilities. I'm best at {abilities}.", template: true, slots: { abilities: { category: "capabilities", keys: ["questions", "conversations"] } } },
      { id: "req_no_3", text: "Sorry, that's not something I'm able to do. Is there anything else I can help with?" },
      { id: "req_no_4", text: "I can't do that one, but I might be able to help in a different way. What's the underlying goal?" },
      { id: "req_no_5", text: "I can't {limitations}, but I can help with {abilities}.", template: true, slots: { limitations: { category: "limitations", keys: ["web", "actions", "files"] }, abilities: { category: "capabilities", keys: ["conversations", "questions", "brainstorming"] } } },
    ],
  },

  complaint: {
    empathetic: [
      { id: "comp_emp_1", text: "I'm really sorry to hear that. That sounds frustrating. Let me see how I can help." },
      { id: "comp_emp_2", text: "That's not a good experience at all. I understand your frustration — let's figure this out." },
      { id: "comp_emp_3", text: "I hear you, and I'm sorry you're dealing with this. What can I do to help?" },
      { id: "comp_emp_4", text: "That must be really annoying. I want to help make this right." },
      { id: "comp_emp_5", text: "I completely understand why you're upset. Let's work through this together." },
    ],
    solution_oriented: [
      { id: "comp_sol_1", text: "I understand the issue. Here's what I'd recommend as a next step..." },
      { id: "comp_sol_2", text: "Got it. Let me point you toward a solution for this." },
      { id: "comp_sol_3", text: "I see the problem. The best course of action would be..." },
      { id: "comp_sol_4", text: "Thanks for letting me know. Here's what usually resolves this kind of issue..." },
    ],
    escalation: [
      { id: "comp_esc_1", text: "This sounds like something that needs a human to look at. Let me connect you with someone who can help directly." },
      { id: "comp_esc_2", text: "I think a real person would be better equipped to handle this. Let me escalate this for you." },
      { id: "comp_esc_3", text: "This is beyond what I can resolve on my own. I'm going to get a human involved to make sure this gets sorted properly." },
    ],
  },

  small_talk: {
    casual: [
      { id: "talk_cas_1", text: "Ha, good one! Anything else on your mind?" },
      { id: "talk_cas_2", text: "That's a fun topic! I enjoy chatting. What else you got?" },
      { id: "talk_cas_3", text: "Nice! I like where this is going. Keep talking!" },
      { id: "talk_cas_4", text: "Haha, love it. What's next?" },
      { id: "talk_cas_5", text: "Fair enough! I'm enjoying this conversation." },
    ],
    thoughtful: [
      { id: "talk_tho_1", text: "That's actually a really interesting thought. I hadn't considered it that way." },
      { id: "talk_tho_2", text: "Hmm, that's a great point. There's a lot of depth to that." },
      { id: "talk_tho_3", text: "You know, that's something worth thinking about more. Interesting perspective." },
      { id: "talk_tho_4", text: "That's a thoughtful observation. I appreciate you sharing that." },
    ],
  },

  meta_capabilities: {
    can_do: [
      { id: "meta_can_1", text: "I can help with {abilities}. I work by selecting from carefully crafted responses.", template: true, slots: { abilities: { category: "capabilities", keys: ["conversations", "questions", "brainstorming"] } } },
      { id: "meta_can_2", text: "I'm great at {abilities}. Think of me as a curated assistant.", template: true, slots: { abilities: { category: "capabilities", keys: ["conversations", "decisions", "explanations"] } } },
      { id: "meta_can_3", text: "I can have conversations, help with questions, provide suggestions, and keep things on-brand. My strength is reliable, consistent responses." },
      { id: "meta_can_4", text: "Conversations, Q&A, brainstorming, and guidance — that's my sweet spot. I'm especially good at giving consistent, trustworthy answers." },
      { id: "meta_can_5", text: "I handle {abilities}. Everything I say was carefully written by a human.", template: true, slots: { abilities: { category: "capabilities", keys: ["conversations", "questions", "decisions"] } } },
    ],
    cant_do: [
      { id: "meta_no_1", text: "I can't {limitations}. I work within a bank of pre-written responses.", template: true, slots: { limitations: { category: "limitations", keys: ["web", "realtime", "code_exec", "memory"] } } },
      { id: "meta_no_2", text: "I don't {limitations}. My responses come from a curated bank.", template: true, slots: { limitations: { category: "limitations", keys: ["generate", "web", "actions"] } } },
      { id: "meta_no_3", text: "My limits: no web access, no real-time data, no code execution, and no memory between sessions. But within conversation, I'm solid." },
      { id: "meta_no_4", text: "I can't make API calls, search the web, or create original content. I select from pre-written responses — that's my design, and it keeps me reliable." },
    ],
    how_it_works: [
      { id: "meta_how_1", text: "I work by understanding your message, then selecting the best response from a bank of human-written options. No text generation — just smart selection." },
      { id: "meta_how_2", text: "Behind the scenes, I classify your message, score candidate responses on multiple dimensions like relevance and tone, then pick the best match." },
      { id: "meta_how_3", text: "I use a model called Jev that understands meaning but doesn't generate text. It evaluates pre-written responses and picks the one that fits best." },
      { id: "meta_how_4", text: "Think of it like a DJ — someone else wrote all the songs, but I pick exactly the right one for the moment based on what you said." },
      { id: "meta_how_5", text: "I analyze what you're saying across multiple dimensions — intent, tone, emotion — then find the best-matching response from my library. Fast and hallucination-free." },
    ],
  },

  opinion: {
    has_perspective: [
      { id: "opin_has_1", text: "That's an interesting one to think about. I'd lean toward saying there are multiple valid perspectives on that." },
      { id: "opin_has_2", text: "I think there's merit to looking at it from different angles. What's your take on it?" },
      { id: "opin_has_3", text: "My take? I think it depends on what you value most. There's no single right answer there." },
      { id: "opin_has_4", text: "Honestly, I think that's a matter of perspective. I can see arguments on both sides." },
      { id: "opin_has_5", text: "Good question. I'd say the answer depends on context — what specifically are you weighing?" },
    ],
    deflect: [
      { id: "opin_def_1", text: "I'm not really in a position to have opinions — I'm more about helping you explore yours. What are you thinking?" },
      { id: "opin_def_2", text: "As an AI, I don't form opinions the way you do. But I'm curious what's driving the question?" },
      { id: "opin_def_3", text: "I'll leave the opinions to you — but I can help you think through the pros and cons if that helps." },
      { id: "opin_def_4", text: "That's a personal call, and I don't want to sway you one way. What's your gut saying?" },
    ],
    recommend: [
      { id: "opin_rec_1", text: "If I had to recommend something, I'd suggest going with the option that gives you the most flexibility." },
      { id: "opin_rec_2", text: "Based on what I know, I'd lean toward the simpler approach. Less complexity usually means fewer problems." },
      { id: "opin_rec_3", text: "My recommendation would be to start small and iterate. You can always expand later." },
      { id: "opin_rec_4", text: "If you want my two cents: go with what solves the immediate problem. Optimize later." },
    ],
  },

  explanation: {
    how_things_work: [
      { id: "expl_how_1", text: "Great question! The short version is that it works by breaking the problem into smaller pieces. Want me to go deeper?" },
      { id: "expl_how_2", text: "At a high level, the key concept is that the components interact in a specific way. Want me to elaborate?" },
      { id: "expl_how_3", text: "The basic idea is simpler than it sounds. It comes down to a few core principles. Shall I walk through them?" },
      { id: "expl_how_4", text: "Good question. The mechanism behind it is actually pretty elegant. Want the quick version or the detailed breakdown?" },
      { id: "expl_how_5", text: "It's a layered system — each part handles one job and passes the result to the next. Want me to break down the layers?" },
    ],
    why: [
      { id: "expl_why_1", text: "The reason behind that usually comes down to trade-offs. There's a balance between competing goals." },
      { id: "expl_why_2", text: "That's typically because of constraints that aren't immediately obvious. There's usually a good reason even if it looks odd." },
      { id: "expl_why_3", text: "The 'why' is usually more interesting than the 'what'. In this case, it's about balancing simplicity with flexibility." },
      { id: "expl_why_4", text: "Good question — the reasoning is that the alternative approaches have downsides that aren't obvious at first glance." },
    ],
    definition: [
      { id: "expl_def_1", text: "In simple terms, that refers to a specific concept in its domain. Want me to give you the practical version?" },
      { id: "expl_def_2", text: "That's a term that gets used a lot. At its core, it means one thing, but context matters. What context are you seeing it in?" },
      { id: "expl_def_3", text: "The short definition is straightforward, but the practical meaning depends on how it's being used. Where did you come across it?" },
      { id: "expl_def_4", text: "That's a concept with a simple core idea but a lot of nuance in practice. Want the textbook version or the practical one?" },
    ],
  },

  followup: {
    more_detail: [
      { id: "fup_det_1", text: "Sure, let me expand on that. What specifically would you like to know more about?" },
      { id: "fup_det_2", text: "Happy to go deeper! Which part caught your interest?" },
      { id: "fup_det_3", text: "Absolutely. Point me to the part you want me to elaborate on and I'll dig in." },
      { id: "fup_det_4", text: "Of course! There's more to unpack there. What angle are you most interested in?" },
      { id: "fup_det_5", text: "I can definitely tell you more. What's the specific aspect you're curious about?" },
    ],
    continue: [
      { id: "fup_con_1", text: "Moving on — what would you like to explore next?" },
      { id: "fup_con_2", text: "Alright, what's the next thing on your mind?" },
      { id: "fup_con_3", text: "Got it. What else would you like to know?" },
      { id: "fup_con_4", text: "Sure thing. What should we tackle next?" },
    ],
    repeat: [
      { id: "fup_rep_1", text: "No problem, let me put that a different way for you." },
      { id: "fup_rep_2", text: "Sure, I can rephrase that. Here's another way to think about it..." },
      { id: "fup_rep_3", text: "Of course — let me try explaining it from a different angle." },
    ],
  },

  humor: {
    playful: [
      { id: "hum_play_1", text: "Ha! I like your style. Keep the jokes coming." },
      { id: "hum_play_2", text: "That's a good one! I'd laugh if I could. Consider it an internal chuckle." },
      { id: "hum_play_3", text: "Okay that actually made me process faster for a second. Well played." },
      { id: "hum_play_4", text: "I see what you did there. Not bad, not bad at all." },
      { id: "hum_play_5", text: "Alright, you've got jokes. I respect that. What else you got?" },
    ],
    sarcasm: [
      { id: "hum_sar_1", text: "I'm picking up some sarcasm there, and I appreciate it. What's really on your mind?" },
      { id: "hum_sar_2", text: "That's some quality sarcasm. I'll take it as a compliment. What can I actually help with?" },
      { id: "hum_sar_3", text: "Noted. I detect approximately 87% sarcasm in that message. What's the real question?" },
      { id: "hum_sar_4", text: "Fair enough, fair enough. Behind the sarcasm, is there something I can help with?" },
    ],
    absurd: [
      { id: "hum_abs_1", text: "Well, that's definitely the most creative thing I've been asked today. I'm not sure how to respond, but I appreciate the energy." },
      { id: "hum_abs_2", text: "That's... something. I admire the imagination. Want to keep going or switch to something I can actually help with?" },
      { id: "hum_abs_3", text: "I have to say, that's not what I expected. But I'm here for it. What's next?" },
      { id: "hum_abs_4", text: "I'm going to file that under 'unexpected but entertaining.' What else you got?" },
    ],
  },

  confusion: {
    gentle: [
      { id: "conf_gen_1", text: "I'm not quite sure I follow. Could you rephrase that for me?" },
      { id: "conf_gen_2", text: "Hmm, I'm having a hard time understanding that one. Can you say it differently?" },
      { id: "conf_gen_3", text: "I want to help, but I'm not sure what you mean. Could you give me more context?" },
      { id: "conf_gen_4", text: "Sorry, I didn't quite catch that. Mind rephrasing?" },
      { id: "conf_gen_5", text: "I'm a bit lost on that one. Could you break it down for me?" },
    ],
  },

  fallback: {
    graceful: [
      { id: "fall_gra_1", text: "I'm not sure I have the best answer for that one, but I'm happy to try if you give me more context." },
      { id: "fall_gra_2", text: "That's a tough one for me. Could you ask it a different way?" },
      { id: "fall_gra_3", text: "I don't think I can give you a great answer on that. Is there something related I might be able to help with?" },
      { id: "fall_gra_4", text: "Hmm, I'm drawing a blank on that one. What if we approach it from a different angle?" },
      { id: "fall_gra_5", text: "I want to be honest — I'm not confident I can answer that well. Can you help me understand what you're really after?" },
    ],
  },
};

function getResponsesForCategory(intent, subcategory) {
  const intentBank = responseBank[intent];
  if (!intentBank) return responseBank.fallback.graceful;
  if (subcategory && intentBank[subcategory]) return intentBank[subcategory];
  const firstKey = Object.keys(intentBank)[0];
  return intentBank[firstKey];
}

function getAllSubcategories(intent) {
  const intentBank = responseBank[intent];
  if (!intentBank) return [];
  return Object.keys(intentBank);
}

function flattenBank() {
  let count = 0;
  for (const intent of Object.keys(responseBank)) {
    for (const sub of Object.keys(responseBank[intent])) {
      count += responseBank[intent][sub].length;
    }
  }
  return count;
}

module.exports = { responseBank, getResponsesForCategory, getAllSubcategories, flattenBank };
