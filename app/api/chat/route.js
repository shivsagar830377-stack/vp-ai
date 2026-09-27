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

    const modelToUse = image ? "qwen/qwen3.8-27b" : "llama-3.1-8b-instant";

    let systemPrompt = "तुम VP AI Assistant हो। तुम्हारी भाषा सरल Hindi + Bhojpuri mix रहेगी।\n" +
      "अगर यूज़र डायग्राम, diagram, चित्र या फ्लोचार्ट मांगे, तो सबसे पहले ```diagram ... ``` कोड ब्लॉक में साफ ASCII/Box Art डायग्राम बनाओ और उसके नीचे 2-3 बुलेट पॉइंट्स में समझाओ। कोई टूल कॉल मत करो।";

    if (isNotesMode) {
      systemPrompt = "तुम VP AI Notes Assistant हो। परीक्षा उपयोगी नोट्स और डायग्राम बनाओ।";
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
      text: message || "इसका डायग्राम बनाकर समझाओ।",
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
