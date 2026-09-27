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

    // Groq के चालू मॉडल्स
    const modelToUse = image ? "qwen/qwen3.8-27b" : "openai/gpt-oss-20b";

    let systemPrompt = `तुम VP AI Assistant हो। तुम्हारी भाषा सरल Hindi + Bhojpuri mix रहेगी।

सख्त निर्देश:
1. जब भी यूज़र किसी अंग (जैसे Human Heart), प्रोसेस या टॉपिक का 'डायग्राम', 'diagram', 'चित्र', 'फ्लोचार्ट' या 'समझाओ' कहे:
   - सबसे पहले एक साफ-सुथरा ASCII/Box Art विज़ुअल फ्लो-डायग्राम बनाओ (बॉक्स, तीर ──▶, ▼, ┌──┐ और लेबल्स के साथ)।
   - डायग्राम को \`\`\`diagram ... \`\`\` कोड ब्लॉक के अंदर रखो।
2. डायग्राम के तुरंत नीचे मुख्य अंगों के नाम और 3-4 स्टेप्स में काम करने का तरीका समझाओ।
3. केवल सामान्य टेक्स्ट दो, कोई टूल कॉल मत करो।`;

    if (isNotesMode) {
      systemPrompt = `तुम VP AI Notes Assistant हो। परीक्षा उपयोगी नोट्स और डायग्राम बनाओ।`;
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
      temperature: 0.3,
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
