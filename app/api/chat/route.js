import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY नहीं मिली!" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const message = body.message || "";
    const image = body.image || null;
    const isNotesMode = body.isNotesMode || false;

    if (!message && !image) {
      return Response.json({ error: "मैसेज या फोटो खाली है!" }, { status: 400 });
    }

    const groq = new Groq({ apiKey });
    const modelToUse = image ? "qwen/qwen3.8-27b" : "openai/gpt-oss-20b";

    let systemPrompt = `तुम VP AI Assistant हो। तुम्हारी भाषा सरल Hindi + Bhojpuri mix रहेगी।

सख्त निर्देश (REAL IMAGE GENERATION RULE):
1. जब भी यूज़र किसी अंग (जैसे Human Heart, Kidney, Brain, Cell), वस्तु, प्रोसेस या टॉपिक का 'डायग्राम', 'diagram', 'चित्र', 'फोटो' या 'समझाओ' कहे:
   - तुम्हें कोई ASCII या बॉक्स वाला डायग्राम नहीं बनाना है।
   - सबसे ऊपर तुम्हें एक असली रंगीन डायग्राम इमेज जोड़नी है। इसके लिए Markdown Image सिंटैक्स का उपयोग करो:
     ![Diagram](https://image.pollinations.ai/prompt/<topic-in-english-realistic-educational-medical-diagram-labeled>?width=700&height=500&nologo=true)
     (उदाहरण: अगर हार्ट है, तो लिखो: ![Human Heart Diagram](https://image.pollinations.ai/prompt/human%20heart%20anatomy%20medical%20diagram%20clear%20labeled%20scientific%20illustration?width=700&height=500&nologo=true))
2. इमेज के ठीक नीचे:
   - 🔍 मुख्य अंग एवं भाग (Part Labels & Functions)
   - 🔄 कार्यप्रणाली (Step-by-step Blood Flow / Process)
   - 💡 सरल निष्कर्ष (Summary)`;

    if (isNotesMode) {
      systemPrompt = `तुम VP AI Notes Assistant हो। परीक्षा उपयोगी नोट्स बनाओ। सबसे ऊपर एक स्पष्ट शैक्षणिक इमेज Markdown सिंटैक्स में जोड़ो, फिर 4-5 मुख्य बिंदुओं में समझाओ।`;
    }

    let userContent = [];
    if (image) {
      userContent.push({
        type: "image_url",
        image_url: { url: image },
      });
    }
    userContent.push({
      type: "text",
      text: message || "इसका सचित्र डायग्राम बनाकर समझाओ।",
    });

    const response = await groq.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
    });

    const reply = response.choices?.[0]?.message?.content || "कोई जवाब नहीं मिला।";
    return Response.json({ reply });
  } catch (error) {
    return Response.json(
      { error: "Groq Error: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
