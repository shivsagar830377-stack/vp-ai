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

    const { message, image, isNotesMode } = await request.json();

    if (!message && !image) {
      return Response.json({ error: "मैसेज या फोटो खाली है!" }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    // Groq पर 100% एक्टिव मॉडल
    const modelToUse = image ? "qwen/qwen3.8-27b" : "openai/gpt-oss-20b";

    let systemPrompt = `तुम VP AI Assistant हो। तुम्हारी भाषा सरल Hindi + Bhojpuri mix रहेगी।

सख्त निर्देश (DIAGRAM RULE):
1. जब भी यूज़र किसी अंग (जैसे Human Heart), प्रोसेस या टॉपिक का 'डायग्राम', 'diagram', 'चित्र', 'फ्लोचार्ट' या 'समझाओ' कहे:
   - सबसे पहले एक साफ-सुथरा विज़ुअल ASCII/Box Art डायग्राम (बॉक्स, तीर ──▶, ▼, ┌──┐ और लेबल्स के साथ) बनाओ।
   - डायग्राम को \`\`\`diagram ... \`\`\` कोड ब्लॉक के अंदर रखो।
2. डायग्राम के तुरंत नीचे:
   - 🔍 मुख्य अंग / भाग (Labels Explanation)
   - 🔄 स्टेप-बाय-स्टेप काम करने का तरीका (Step-by-Step Flow)
   - 💡 सरल निष्कर्ष (Summary / Exam Tip)
3. केवल सादा टेक्स्ट दो। कोई टूल कॉल मत करो।`;

    if (isNotesMode) {
      systemPrompt = `तुम VP AI Notes Assistant हो। परीक्षा उपयोगी नोट्स बनाओ।
हर मुख्य टॉपिक में एक स्पष्ट विज़ुअल डायग्राम (\`\`\`diagram ... \`\`\` में) जरूर जोड़ो, फिर 4-5 स्पष्ट हेडिंग में सरल हिंदी-भोजपुरी में समझाओ।`;
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
      text: message || "इसका डायग्राम बनाकर स्टेप-बाय-स्टेप समझाओ।",
    });

    const response = await groq.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      tool_choice: "none",
    });

    const reply = response.choices?.[0]?.message?.content || "कोई जवाब नहीं मिला।";
    return Response.json({ reply });
  } catch (error) {
    return Response.json(
      { error: "Groq Error: " + (error?.message || error?.toString()) },
      { status: 500 }
    );
  }
}
