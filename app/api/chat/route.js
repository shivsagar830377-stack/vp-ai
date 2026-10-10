import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image, isNotesMode, isImageGenMode } = await req.json();
    const promptText = (message || "").trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. फोटो जनरेशन मोड (चेहरे के सटीक फीचर्स के साथ)
    if (isImageGenMode || /फोटो|चित्र|image|photo|बनाओ|generate/i.test(promptText)) {
      let faceDescription = "young 18 year old indian male with short dark wavy hair, authentic indian facial features, small red tilak on forehead, denim casual shirt";

      // अगर यूज़र ने फोटो अपलोड की है और Gemini Key उपलब्ध है, तो फोटो से चेहरे की डिटेल्स निकालना
      if (image && apiKey) {
        try {
          const base64Data = image.split(",")[1] || image;
          const mimeType = image.split(";")[0]?.split(":")[1] || "image/jpeg";

          const visionRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        inlineData: {
                          mimeType: mimeType,
                          data: base64Data,
                        },
                      },
                      {
                        text: "Describe this person's facial features, age, hair style, skin tone, facial marks, and clothing in 25-30 words so an image generator can recreate their exact appearance.",
                      },
                    ],
                  },
                ],
              }),
            }
          );

          const visionData = await visionRes.json();
          const extractedDesc = visionData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (extractedDesc) {
            faceDescription = extractedDesc.replace(/\n/g, " ").trim();
          }
        } catch (e) {
          // अगर विज़न फ़ेल हो तो डिफ़ॉल्ट फीचर्स इस्तेमाल होंगे
        }
      }

      // प्रॉम्प्ट तैयार करना
      const cleanPrompt = promptText
        .replace(/फोटो|इमेज|चित्र|picture|image|बनाओ|बनाइए|तस्वीर|generate/gi, "")
        .trim() || promptText;

      const finalPrompt = `cinematic candid street portrait, realistic face of (${faceDescription}), ${cleanPrompt}, 35mm film photograph, golden hour lighting, shot on 85mm f/1.8 lens, authentic skin texture, sharp focus, 8k resolution`;
      const encoded = encodeURIComponent(finalPrompt);
      const seed = Math.floor(Math.random() * 1000000);

      // FLUX मॉडल जो रियलिस्टिक चेहरे बनाता है
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}&width=768&height=1024&model=flux&nologo=true`;

      return NextResponse.json({
        reply: `लीजिए, आपकी फोटो और प्रॉम्प्ट के आधार पर इमेज:\n\n![AI Portrait](${imageUrl})`,
      });
    }

    // 2. चैट और नोट्स मोड
    let rolePrompt = "आप VP AI Assistant हैं। हिंदी और भोजपुरी मिक्स में सरल, सटीक और स्पष्ट उत्तर दें।";
    if (isNotesMode) {
      rolePrompt = "आप VP AI Assistant हैं। साफ़-सुथरे बुलेट पॉइंट्स, हेडिंग्स और विजुअल स्टडी नोट्स के रूप में उत्तर तैयार करें।";
    }

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
