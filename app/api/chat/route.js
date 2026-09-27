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

    // अगर फोटो है तो विज़न मॉडल, अन्यथा सुपरफास्ट टेक्स्ट मॉडल
    const modelToUse = image ? "qwen/qwen3.8-27b" : "openai/gpt-oss-20b";

    let systemPrompt = `तुम VP AI Assistant हो। यूज़र के सवालों का सरल Hindi + Bhojpuri mix में तुरंत और आसान तरीके से समझाकर जवाब दो।`;

    if (isNotesMode) {
      systemPrompt = `तुम VP AI Notes Assistant हो। यूज़र के सवाल या फोटो पर साफ-सुथरे और बेहतरीन स्टडी नोट्स (Hindi + Bhojpuri mix) में बनाओ। 
फॉर्मेट ऐसा रखो:
📌 **मुख्य विषय / शीर्षक**
📖 **सरल व्याख्या (Definition & Concept)**
🔹 **ज़रूरी बिंदु (Key Points / Bullet Points)**
💡 **उदाहरण (Real-life Example)**
📝 **याद रखने योग्य बात (Summary / Exam Tip)**
अनावश्यक सिंबल मत लगाओ, नोट्स साफ और सुंदर दिखने चाहिए।`;
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
      text: message || (isNotesMode ? "इस फोटो के टॉपिक पर पूरे नोट्स बनाइए।" : "इस फोटो को आसान भाषा में समझाइए।"),
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
