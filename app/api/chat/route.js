import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image, isNotesMode, isImageGenMode } = await req.json();
    const promptText = (message || "").trim();

    // 1. फोटो जनरेशन
    if (isImageGenMode || /फोटो|चित्र|image|photo|बनाओ|generate/i.test(promptText)) {
      const cleanPrompt = promptText
        .replace(/फोटो|इमेज|चित्र|picture|image|बनाओ|बनाइए|तस्वीर|generate/gi, "")
        .trim() || promptText;

      const encoded = encodeURIComponent(cleanPrompt + ", detailed 8k high quality");
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}&width=1024&height=1024&nologo=true`;

      return NextResponse.json({
        reply: `लीजिए, आपके प्रॉम्प्ट **"${promptText}"** के आधार पर इमेज:\n\n![${cleanPrompt}](${imageUrl})`
      });
    }

    let rolePrompt = "आप VP AI Assistant हैं। हिंदी और भोजपुरी मिक्स में सरल, सटीक और स्पष्ट उत्तर दें।";
    if (isNotesMode) {
      rolePrompt = "आप VP AI Assistant हैं। साफ़-सुथरे बुलेट पॉइंट्स, हेडिंग्स और विजुअल स्टडी नोट्स के रूप में उत्तर तैयार करें।";
    }

    // 2. Pollinations AI बैकएंड (100% फ्री, बिना किसी API Key या मॉडल एरर के तुरंत उत्तर)
    try {
      const aiUrl = `https://text.pollinations.ai/${encodeURIComponent(rolePrompt + "\nसवाल: " + promptText)}`;
      const aiRes = await fetch(aiUrl);
      const aiText = await aiRes.text();

      if (aiText && aiText.trim() && !aiText.includes("error")) {
        return NextResponse.json({ reply: aiText });
      }
    } catch (e) {
      // फॉलबैक पर आगे बढ़ें
    }

    // 3. Gemini फॉलबैक (gemini-pro)
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${rolePrompt}\n\nसवाल: ${promptText}` }]
              }
            ]
          })
        }
      );
      const data = await res.json();
      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (replyText) {
        return NextResponse.json({ reply: replyText });
      }
    }

    return NextResponse.json({ reply: "माफ़ करें, उत्तर लोड नहीं हो सका। कृपया पुनः प्रयास करें।" });
  } catch (err) {
    return NextResponse.json({ reply: "कनेक्शन में समस्या हुई: " + err.message }, { status: 500 });
  }
}
