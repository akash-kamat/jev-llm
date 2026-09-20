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
      { id: "req_no_2", text: "I wish I could help with that, but it's beyond my capabilities. I'm best at answering questions and having conversations." },
      { id: "req_no_3", text: "Sorry, that's not something I'm able to do. Is there anything else I can help with?" },
      { id: "req_no_4", text: "I can't do that one, but I might be able to help in a different way. What's the underlying goal?" },
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
