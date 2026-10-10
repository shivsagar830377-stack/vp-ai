import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image, isNotesMode, isImageGenMode } = await req.json();
    const promptText = (message || "").trim();

    // 1. इमेज जनरेशन मोड
    if (isImageGenMode || /फोटो|चित्र|image|photo|बनाओ|generate/i.test(promptText)) {
      const cleanPrompt = promptText
        .replace(/फोटो|इमेज|चित्र|picture|image|बनाओ|बनाइए|तस्वीर|generate/gi, "")
        .trim() || promptText;

      const encoded = encodeURIComponent(cleanPrompt + ", detailed high quality 8k");
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}&width=1024&height=1024&nologo=true`;

      return NextResponse.json({
        reply: `लीजिए, आपके प्रॉम्प्ट **"${promptText}"** के आधार पर इमेज:\n\n![${cleanPrompt}](${imageUrl})`
      });
    }

    // 2. Gemini Chat
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key सेट नहीं है।" }, { status: 500 });
    }

    let rolePrompt = "आप VP AI Assistant हैं। हिंदी और भोजपुरी मिक्स में सरल, सटीक और स्पष्ट उत्तर दें।";
    if (isNotesMode) {
      rolePrompt = "आप VP AI Assistant हैं। साफ़-सुथरे बुलेट पॉइंट्स, हेडिंग्स और विजुअल स्टडी नोट्स के रूप में उत्तर तैयार करें।";
    }

    // v1 एंडपॉइंट और gemini-1.5-flash का सही URL
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${rolePrompt}\n\nयूज़र का सवाल: ${promptText}` }]
            }
          ]
        })
      }
    );

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ reply: `API एरर: ${data.error.message || "मॉडल लोड नहीं हुआ"}` });
    }

    const replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "माफ़ करें, उत्तर प्राप्त नहीं हुआ। कृपया दोबारा पूछें।";

    return NextResponse.json({ reply: replyText });
  } catch (err) {
    return NextResponse.json({ reply: "सर्वर से कनेक्ट नहीं हो सका: " + err.message }, { status: 500 });
  }
}
