import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image, isNotesMode, isImageGenMode } = await req.json();
    const promptText = (message || "").trim();

    // 1. इमेज जनरेशन मोड (जब फोटो बनाने का प्रॉम्प्ट हो)
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

    const apiKey = process.env.GEMINI_API_KEY;
    let rolePrompt = "आप VP AI Assistant हैं। हिंदी और भोजपुरी मिक्स में सरल, सटीक और स्पष्ट उत्तर दें।";
    if (isNotesMode) {
      rolePrompt = "आप VP AI Assistant हैं। साफ़-सुथरे बुलेट पॉइंट्स, हेडिंग्स और विजुअल स्टडी नोट्स के रूप में उत्तर तैयार करें।";
    }

    // 2. Gemini के उपलब्ध मॉडल्स को एक-एक करके ट्राय करना
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-pro"
    ];

    if (apiKey) {
      for (const model of modelsToTry) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
        } catch (e) {
          // अगला मॉडल ट्राय करेगा
        }
      }
    }

    // 3. फ़ॉलबैक (अगर Gemini Key में दिक्कत हो तो बैकअप AI जवाब देगा)
    const backupRes = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(rolePrompt + "\nसवाल: " + promptText)}`
    );
    const backupText = await backupRes.text();

    if (backupText && backupText.trim()) {
      return NextResponse.json({ reply: backupText });
    }

    return NextResponse.json({ reply: "माफ़ करें, उत्तर लोड नहीं हो सका। कृपया पुनः प्रयास करें।" });
  } catch (err) {
    return NextResponse.json({ reply: "कनेक्शन में समस्या हुई: " + err.message }, { status: 500 });
  }
}
