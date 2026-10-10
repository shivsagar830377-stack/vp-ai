import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image, isNotesMode, isImageGenMode } = await req.json();

    const promptText = (message || "").trim();

    // 1. अगर यूज़र ने "इमेज जनरेट" मोड चुना है या इमेज बनाने को कहा है
    if (isImageGenMode || /बनाओ|बनाइए|जनरेट|photo|image|picture|drawing/i.test(promptText)) {
      const cleanPrompt = promptText
        .replace(/फोटो|इमेज|चित्र|picture|image|बनाओ|बनाइए|तस्वीर|generate/gi, "")
        .trim() || promptText;

      const encodedPrompt = encodeURIComponent(cleanPrompt + ", high quality, ultra detailed, 8k");
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true`;

      return NextResponse.json({
        reply: `लीजिए, आपके प्रॉम्प्ट **"${promptText}"** के आधार पर इमेज तैयार है:\n\n![${cleanPrompt}](${imageUrl})`
      });
    }

    // 2. सामान्य चैट / नोट्स मोड
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key सेट नहीं है।" }, { status: 500 });
    }

    let systemInstruction = "आप VP AI Assistant हैं। सरल, स्पष्ट और रोचक भाषा में जवाब दें।";
    if (isNotesMode) {
      systemInstruction = "आप VP AI Assistant हैं। यूज़र के सवाल के मुख्य बिंदुओं को साफ़-सुथरे बुलेट पॉइंट्स, हेडिंग्स और विजुअल स्टडी नोट्स के रूप में तैयार करें।";
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nयूज़र का सवाल: ${promptText}` }]
        }
      ]
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "कोई उत्तर प्राप्त नहीं हुआ।";

    return NextResponse.json({ reply: replyText });
  } catch (err) {
    return NextResponse.json({ error: "सर्वर एरर: " + err.message }, { status: 500 });
  }
}
