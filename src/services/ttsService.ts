import { GoogleGenAI } from "@google/genai";

export async function generateSpeech(text: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore'): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("A chave GEMINI_API_KEY não foi configurada para o serviço de áudio.");
  }

  const ai = new GoogleGenAI(apiKey);
  const genModel = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const response = await genModel.generateContent({
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["audio"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error("Failed to generate audio content");
  }
  return base64Audio;
}