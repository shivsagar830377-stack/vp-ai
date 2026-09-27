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

    const { message, isNotesMode } = await request.json();

    if (!message || !message.trim()) {
      return Response.json({ error: "सवाल खाली है!" }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    // अगर नोट्स मोड ऑन है, तो टीचर की तरह पूरे नोट्स बनाएगा
    const systemPrompt = isNotesMode
      ? `तुम VP AI Notes Assistant हो। यूज़र के टॉपिक पर साफ़-सुथरे और बेहतरीन स्टडी नोट्स (Hindi + Bhojpuri mix) में बनाओ। 
फ़ॉर्मेट ऐसा रखो:
📌 **मुख्य विषय / शीर्षक**
📖 **सरल व्याख्या (Definition & Concept)**
🔹 **ज़रूरी बिंदु (Key Points / Bullet Points)**
💡 **उदाहरण (Real-life Example)**
📝 **याद रखने योग्य बात (Summary / Exam Tip)**
अनावश्यक सिंबल मत लगाओ, नोट्स साफ़ और सुंदर दिखने चाहिए।`
      : `तुम VP AI Assistant हो। यूज़र के सवालों का सरल Hindi + Bhojpuri mix में तुरंत और आसान तरीक़े से समझाकर जवाब दो।`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = response.choices?.[0]?.message?.content || "कोई उत्तर नहीं मिला।";
    return Response.json({ reply });
  } catch (error) {
    return Response.json(
      { error: "Groq Error: " + (error?.message || error?.toString()) },
      { status: 500 }
    );
  }
}
