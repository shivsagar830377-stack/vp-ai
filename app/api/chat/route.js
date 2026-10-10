import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image, isNotesMode, isImageGenMode } = await req.json();
    const promptText = (message || "").trim();

    // 1. ऑप्टिमाइज्ड फोटो जनरेशन मोड (टूटा इमेज आइकॉन रोकने के लिए)
    if (isImageGenMode || /फोटो|चित्र|image|photo|बनाओ|generate/i.test(promptText)) {
      
      // बड़े प्रॉम्प्ट्स को समेट कर छोटा व स्टेबल बनाना
      let basePrompt = promptText
        .replace(/फोटो|इमेज|चित्र|picture|image|बनाओ|बनाइए|तस्वीर|generate/gi, "")
        .replace(/a vertical 3:4 cinematic candid street portrait of/gi, "")
        .replace(/standing on a modern city street at golden hour/gi, "")
        .replace(/natural skin texture, relaxed expression/gi, "")
        .replace(/wearing a casual oversized linen shirt and vintage watch/gi, "")
        .replace(/background features soft bokeh of evening urban life/gi, "")
        .replace(/shot on 85mm f\/1\.8 lens, shallow depth of field/gi, "")
        .replace(/authentic 35mm film grain, photorealistic editorial look/gi, "")
        .trim();

      // अगर प्रॉम्प्ट बहुत छोटा हो गया या खाली हो, तो डिफ़ॉल्ट सही कीवर्ड्स देना
      if (basePrompt.length < 3) {
        basePrompt = "candid portrait on busy city street";
      } else if (basePrompt.length > 80) {
        // बहुत बड़ा प्रॉम्प्ट होने पर उसे केवल पहले 80 अक्षरों तक ही सीमित करना, ताकि API क्रैश न हो
        basePrompt = basePrompt.substring(0, 80);
      }

      // भारतीय युवक (Indian Male) के साथ सिनेमाई कीवर्ड्स जोड़ना
      const styleConfig = "young indian male with curly hair, natural looks, golden hour candid, indian street back, dramatic light, 35mm film look, highly detailed photo";
      
      const finalPrompt = `${basePrompt}, ${styleConfig}`;
      const encoded = encodeURIComponent(finalPrompt);
      const seed = Math.floor(Math.random() * 1000000);
      
      // अधिक सुलभ और छोटा URL जो कभी फ़ेल नहीं होता
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}&width=768&height=1024&nologo=true&enhance=true`;

      return NextResponse.json({
        reply: `लीजिए, आपके प्रॉम्प्ट के आधार पर इमेज:\n\n![AI Portrait](${imageUrl})`
      });
    }

    let rolePrompt = "आप VP AI Assistant हैं। हिंदी और भोजपुरी मिक्स में सरल, सटीक और स्पष्ट उत्तर दें।";
    if (isNotesMode) {
      rolePrompt = "आप VP AI Assistant हैं। साफ़-सुथरे बुलेट पॉइंट्स, हेडिंग्स और विजुअल स्टडी नोट्स के रूप में उत्तर तैयार करें।";
    }

    // 2. Pollinations AI बैकएंड
    try {
      const aiUrl = `https://text.pollinations.ai/${encodeURIComponent(rolePrompt + "\nसवाल: " + promptText)}`;
      const aiRes = await fetch(aiUrl);
      const aiText = await aiRes.text();

      if (aiText && aiText.trim() && !aiText.includes("error")) {
        return NextResponse.json({ reply: aiText });
      }
    } catch (e) {}

    // 3. Gemini फॉलबैक
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
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
      } catch (e) {}
    }

    return NextResponse.json({ reply: "माफ़ करें, उत्तर लोड नहीं हो सका। कृपया पुनः प्रयास करें।" });
  } catch (err) {
    return NextResponse.json({ reply: "कनेक्शन में समस्या हुई: " + err.message }, { status: 500 });
  }
}
