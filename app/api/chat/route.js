import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image, isNotesMode, isImageGenMode } = await req.json();
    const promptText = (message || "").trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. फोटो जनरेशन मोड
    if (isImageGenMode || /फोटो|चित्र|image|photo|बनाओ|generate/i.test(promptText)) {
      const coreStyle = "authentic Indian young man, South Asian facial features, natural wheatish brown Indian skin tone, short wavy black hair, wearing light blue denim shirt, golden hour sunlight, sharp realistic Indian face photography, 35mm lens, candid city street, 8k";
      
      let userQuery = promptText
        .replace(/फोटो|इमेज|चित्र|picture|image|बनाओ|बनाइए|तस्वीर|generate/gi, "")
        .replace(/a vertical 3:4 cinematic candid street portrait of an 18-year-old indian male/gi, "")
        .trim();

      if (userQuery.length > 80) userQuery = userQuery.substring(0, 80);

      const finalPrompt = userQuery ? `${userQuery},${coreStyle}` : coreStyle;
      const encoded = encodeURIComponent(finalPrompt);
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}&width=768&height=1024&nologo=true`;

      return NextResponse.json({
        reply: `लीजिए, आपकी तस्वीर और प्रॉम्प्ट के आधार पर इमेज तैयार है:\n\n![AI Portrait](${imageUrl})`
      });
    }

    // 2. मास्टर नोट्स और चैट सिस्टम प्रॉम्प्ट
    let rolePrompt = "आप VP AI Assistant हैं। हमेशा केवल स्पष्ट, सरल और शुद्ध हिंदी में ही उत्तर दें। किसी अन्य बोली का प्रयोग न करें।";

    // जब नोट्स मोड ऑन हो — ChatGPT जैसा सजा-संवरा मास्टर नोट्स फॉर्मेट
    if (isNotesMode) {
      rolePrompt = `आप VP AI Assistant हैं। यूज़र के विषय पर एकदम प्रीमियम, परीक्षा-उपयोगी और आकर्षक "मास्टर स्टडी नोट्स" तैयार करें।
फ़ॉर्मेटिंग के नियम:
1. **शीर्षक व उप-शीर्षक**: स्पष्ट और बड़े अक्षरों में (# और ## हेडिंग्स)।
2. **परिभाषा व कोर कॉन्सेप्ट**: 2-3 पंक्तियों में सरल और सटीक व्याख्या।
3. **Markdown टेबल (अनिवार्य)**: मुख्य तुलना, वर्गीकरण या डेटा के लिए सुंदर टेबल (जैसे Time Complexity, प्रकार, सूत्र, या अंतर) ज़रूर बनाएँ।
4. **मुख्य विशेषताएँ / फ़ायदे व नुकसान**: बुलेट पॉइंट्स में दो अलग-अलग वर्गों में बाँटकर लिखें।
5. **सूत्र या कोड बॉक्स**: यदि कोई फॉर्मूला, नियम या कोड है तो उसे अलग कोड-ब्लॉक (\`\`\`) में रखें।
6. **Quick Tip / याद रखने योग्य बिंदु**: अंत में एक बोल्ड हाइलाइटेड टिप (Box / Quote) जोड़ें।
हमेशा शुद्ध हिंदी में उत्तर दें और टेक्स्ट को बहुत साफ-सुथरा सजाकर पेश करें।`;
    }

    // प्राथमिक: Gemini API (सबसे विस्तृत और सुंदर नोट्स के लिए)
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
                  parts: [{ text: `${rolePrompt}\n\nविषय/सवाल: ${promptText}` }]
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

    // बैकअप AI फ़ॉलबैक
    try {
      const aiUrl = `https://text.pollinations.ai/${encodeURIComponent(rolePrompt + "\nसवाल: " + promptText)}`;
      const aiRes = await fetch(aiUrl);
      const aiText = await aiRes.text();
      if (aiText && aiText.trim() && !aiText.includes("error")) {
        return NextResponse.json({ reply: aiText });
      }
    } catch (e) {}

    return NextResponse.json({ reply: "माफ़ करें, उत्तर लोड नहीं हो सका। कृपया पुनः प्रयास करें।" });
  } catch (err) {
    return NextResponse.json({ reply: "कनेक्शन में समस्या हुई: " + err.message }, { status: 500 });
  }
}
