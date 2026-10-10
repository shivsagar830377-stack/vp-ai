import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image, isNotesMode, isImageGenMode } = await req.json();
    const promptText = (message || "").trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. फोटो जनरेशन मोड (चेहरे के सटीक फीचर्स और सुपर-फास्ट लोडिंग के साथ)
    if (isImageGenMode || /फोटो|चित्र|image|photo|बनाओ|generate/i.test(promptText)) {
      
      // चेहरे और स्टाइल की मुख्य विशेषताएँ (कॉम्पैक्ट और सटीक)
      const coreStyle = "18yo indian young male, short curly black hair, small tilak on forehead, denim shirt, golden hour sunlight, cinematic candid street portrait, realistic photography, 35mm lens, high detail";
      
      // प्रॉम्प्ट को साफ और छोटा करना ताकि URL कभी क्रैश न हो
      let userQuery = promptText
        .replace(/फोटो|इमेज|चित्र|picture|image|बनाओ|बनाइए|तस्वीर|generate/gi, "")
        .replace(/a vertical 3:4 cinematic candid street portrait of an 18-year-old indian male/gi, "")
        .trim();

      if (userQuery.length > 100) {
        userQuery = userQuery.substring(0, 100);
      }

      const finalPrompt = userQuery ? `${userQuery}, ${coreStyle}` : coreStyle;
      const encoded = encodeURIComponent(finalPrompt);
      const seed = Math.floor(Math.random() * 1000000);
      
      // स्टेबल और फ़ास्ट CDN URL (टूटा हुआ आइकॉन रोकने के लिए)
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}&width=768&height=1024&nologo=true`;

      return NextResponse.json({
        reply: `लीजिए, आपकी तस्वीर और प्रॉम्प्ट के आधार पर इमेज तैयार है:\n\n![AI Portrait](${imageUrl})`
      });
    }

    // 2. केवल शुद्ध हिंदी में असिस्टेंट निर्देश
    let rolePrompt = "आप VP AI Assistant हैं। हमेशा केवल स्पष्ट, सरल और शुद्ध हिंदी में ही उत्तर दें। किसी अन्य भाषा या बोली का प्रयोग न करें।";
    if (isNotesMode) {
      rolePrompt = "आप VP AI Assistant हैं। हमेशा केवल स्पष्ट और शुद्ध हिंदी में साफ़-सुथरे बुलेट पॉइंट्स, हेडिंग्स और स्टडी नोट्स तैयार करें।";
    }

    // टेक्स्ट चैट के लिए बैकएंड
    try {
      const aiUrl = `https://text.pollinations.ai/${encodeURIComponent(rolePrompt + "\nसवाल: " + promptText)}`;
      const aiRes = await fetch(aiUrl);
      const aiText = await aiRes.text();

      if (aiText && aiText.trim() && !aiText.includes("error")) {
        return NextResponse.json({ reply: aiText });
      }
    } catch (e) {}

    // बैकअप जेमिनी
    if (apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
      } catch (e) {}
    }

    return NextResponse.json({ reply: "माफ़ करें, उत्तर लोड नहीं हो सका। कृपया पुनः प्रयास करें।" });
  } catch (err) {
    return NextResponse.json({ reply: "कनेक्शन में समस्या हुई: " + err.message }, { status: 500 });
  }
}
