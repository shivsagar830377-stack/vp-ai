import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, image, isNotesMode, isImageGenMode } = await req.json();
    const promptText = (message || "").trim();

    // 1. रियलिस्टिक फोटो जनरेशन (FLUX मॉडल के साथ)
    if (isImageGenMode || /फोटो|चित्र|image|photo|बनाओ|generate/i.test(promptText)) {
      
      const cleanPrompt = promptText
        .replace(/फोटो|इमेज|चित्र|picture|image|बनाओ|बनाइए|तस्वीर|generate/gi, "")
        .trim() || promptText;

      // आपके चेहरे की विशेषताओं को प्राथमिकता देना
      const faceDetails = "young 18 year old indian man with tilak on forehead, denim blue shirt, black curly hair, authentic indian facial features, candid camera photo, realistic skin texture, golden hour sunlight, 8k resolution, photorealistic, cinematic street background";

      const finalPrompt = `${cleanPrompt}, ${faceDetails}`;
      const encoded = encodeURIComponent(finalPrompt);
      const seed = Math.floor(Math.random() * 1000000);
      
      // FLUX मॉडल का उपयोग करके असली जैसी फोटो बनाना
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}&width=768&height=1024&model=flux&nologo=true`;

      return NextResponse.json({
        reply: `लीजिए, आपके प्रॉम्प्ट के आधार पर इमेज:\n\n![AI Portrait](${imageUrl})`
      });
    }

    let rolePrompt = "आप VP AI Assistant हैं। हिंदी और भोजपुरी मिक्स में सरल, सटीक और स्पष्ट उत्तर दें।";
    if (isNotesMode) {
      rolePrompt = "आप VP AI Assistant हैं। साफ़-सुथरे बुलेट पॉइंट्स, हेडिंग्स और विजुअल स्टडी नोट्स के रूप में उत्तर तैयार करें।";
    }

    // 2. चैट बैकएंड
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
