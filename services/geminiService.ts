import { GoogleGenAI, Type } from "@google/genai";
import { AIAdviceResponse } from "../types";

export const getNetworkAdvice = async (lat: number, lng: number, signalStrength: number, networkType: string): Promise<AIAdviceResponse | null> => {
  // Move API key reading inside the function to ensure it captures the env var at runtime
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API Key tanımlanmamış. process.env.API_KEY kontrol edilmeli.");
    return null;
  }

  // Initialize client explicitly with the key as per rules
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Kullanıcı şu anda şu koordinatlarda: Enlem ${lat}, Boylam ${lng}.
    Mevcut ağ türü: ${networkType}.
    Algılanan sinyal gücü (0-100 arası): ${signalStrength}.
    
    Bir ağ mühendisi uzmanı olarak bu konum için analiz yap.
    Türkiye'deki operatörleri (Turkcell, Vodafone, Türk Telekom) bu bölgedeki tahmini kapsama performanslarına göre değerlendir.
    
    Yanıtı JSON formatında ver.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            locationAnalysis: {
              type: Type.STRING,
              description: "Konumun coğrafi yapısı (kırsal, şehir merkezi, çukurda vb.) ve sinyale etkisi hakkında kısa analiz."
            },
            technicalTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Sinyali iyileştirmek için 3 adet kısa teknik öneri."
            },
            operators: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Operatör adı (Turkcell, Vodafone, Türk Telekom)" },
                  suitability: { type: Type.STRING, enum: ["Yüksek", "Orta", "Düşük"], description: "Bu bölge için uygunluk derecesi" },
                  reason: { type: Type.STRING, description: "Neden bu uygunluk verildiğine dair çok kısa açıklama" }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAdviceResponse;
    }
    return null;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
