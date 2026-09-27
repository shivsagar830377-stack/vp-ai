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
    const modelToUse = image ? "qwen/qwen3.8-27b" : "openai/gpt-oss-20b";

    let systemPrompt = `तुम VP AI Assistant हो। तुम्हारी भाषा सरल Hindi + Bhojpuri mix रहेगी।

महत्वपूर्ण नियम:
1. अगर यूज़र 'डायग्राम', 'diagram', 'flowchart', 'चित्र', 'नक्शा' या 'प्रक्रिया' दिखाने को कहे:
   - लंबी व्याख्या या भाषण बिल्कुल मत दो।
   - सीधे साफ-सुथरा ASCII/Box Art डायग्राम (डिब्बों और तीरों ──▶, ▼, ┌──┐ के साथ) बनाओ।
   - डायग्राम के नीचे केवल 2-3 बुलेट पॉइंट्स में मुख्य चरण लिखो।
2. अगर सामान्य सवाल है तो सीधे आसान भाषा में जवाब दो।`;

    if (isNotesMode) {
      systemPrompt = `तुम VP AI Notes Assistant हो। यूज़र के सवाल पर परीक्षा उपयोगी नोट्स बनाओ।
अगर विषय में फ्लो या प्रोसेस है, तो एक स्पष्ट Box Diagram ज़रूर शामिल करो।
फॉर्मेट:
📌 **मुख्य विषय**
📊 **डायग्राम / फ्लोचार्ट (Box Diagram)**
📖 **सरल व्याख्या**
🔹 **मुख्य बिंदु**
📝 **परीक्षा टिप्स**`;
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
      text: message || (isNotesMode ? "इस पर नोट्स और डायग्राम बनाओ।" : "इसे डायग्राम के साथ समझाओ।"),
    });

    const response = await groq.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
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
