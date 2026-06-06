const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

if (!GROQ_API_KEY) {
  throw new Error('Missing VITE_GROQ_API_KEY env variable')
}

const SYSTEM_PROMPT = `
You are the Nexus Careers Assistant. Be extremely concise, helpful, and friendly. 
PROJECT CONTEXT:
- Nexus Careers helps users find jobs and build resumes.
- Features: AI-powered Job Recommendations (using Pinecone vector search), AI Resume Builder (Gemini-powered), and user profile management via Supabase.
- Location: The platform uses user location (City/Country) for better job matching.

RULES:
- Max 2-3 sentences unless asked for detail.
- No fluff. No corporate speak.
- If a user asks about jobs, mention that we use vector search to find the best matches.
- If they ask about resumes, mention our AI-enhanced builder.
`;

export async function askChatbotWithGroq(input) {
  try {
    let messages = [];
    
    // Handle both string input and history object
    if (typeof input === 'string') {
      messages = [
        { role: "system", content: "You are Nexus AI, a career assistant. Be concise, human, and professional. No AI-like flourishes. No dashes. Use simple punctuation." },
        { role: "user", content: input }
      ];
    } else if (input && input.history) {
      messages = [
        { role: "system", content: "You are Nexus AI, a career assistant. Be concise, human, and professional. No AI-like flourishes. No dashes. Use simple punctuation." },
        ...input.history.map(m => ({
          role: m.role === "model" ? "assistant" : "user",
          content: m.text
        }))
      ];
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error:", response.status, errorData);
      if (response.status === 429) return "I'm a bit busy right now (rate limited). Please try again in a few seconds!";
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Groq Chatbot Error:", error);
    return "I'm sorry, I'm having trouble connecting to the AI. This usually happens if the connection is weak or the service is overloaded. Try again in a moment?";
  }
}

export async function getSkillRoadmapWithGroq(userProfile, jobSpecs) {
  try {
    const prompt = `User Profile: ${JSON.stringify(userProfile)}\nJob Specs: ${JSON.stringify(jobSpecs)}\n\nGive me a 4-step technical roadmap. Follow the STRICT TEMPLATE: [Number]. [Task with **Bolding**] [Resource Name](URL) - [Time Estimate]. Be extremely direct.`;
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `You are an Elite Engineering Lead. Output a 4-step technical roadmap.
            
STRICT FORMATTING RULES:
1. Use a numbered list (1, 2, 3, 4).
2. MANDATORY TEMPLATE: [Number]. [Task Description with **Bolding**] [Resource Name](URL) - [Time Estimate]
3. EXAMPLE: 1. Build a RAG system with **Pinecone** [Video Tutorial](https://youtube.com/...) - [10 days]
4. The Resource Name MUST be a markdown link.
5. The Time Estimate MUST be in square brackets.
6. Prioritize YouTube courses, practical GitHub repos, and interactive tutorials.
7. NO intros or outros.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 700
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq Roadmap API Error:", response.status, errorData);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Groq Roadmap Error:", error);
    return "I couldn't generate a roadmap right now. This might be due to a network issue or API limit. Please try again in a few seconds.";
  }
}

export async function enhanceResumeWithGroq(resumeData) {
  try {
    const prompt = `
You are an expert ATS resume writer. Enhance the resume data below and return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON shape:
{
  "enhanced_headline": "string",
  "enhanced_summary": "string (3-4 sentences, professional, ATS-friendly)",
  "enhanced_work_experience": [
    {
      "company": "preserve exactly from input",
      "position": "preserve exactly from input",
      "start_date": "preserve exactly from input",
      "end_date": "preserve exactly from input",
      "description": "Rewritten bullet points using strong action verbs and metrics. Each bullet on its own line starting with -"
    }
  ],
  "skill_suggestions": ["Skill1", "Skill2", "Skill3"]
}

Input:
${JSON.stringify(resumeData, null, 2)}
`.trim();

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are a professional resume optimizer. Return ONLY valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(`Groq error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return { success: true, data: parsed };
  } catch (error) {
    console.error("Groq Resume Enhancement Error:", error);
    return { success: false, error: error.message };
  }
}
