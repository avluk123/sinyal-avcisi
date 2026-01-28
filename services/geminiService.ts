import { GoogleGenAI, Type } from "@google/genai";
import { AIAdviceResponse } from "../types";

// Safely access API key to prevent crash if process is undefined in browser environment
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Environment variable access failed, API features may be disabled.");
  }
  return '';
};

const apiKey = getApiKey();

export const getNetworkAdvice = async (lat: number, lng: number, signalStrength: number, networkType: string): Promise<AIAdviceResponse | null> => {
  // If API key is missing, return mock data or null immediately instead of hanging
  if (!apiKey) {
    console.error("API Key eksik");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

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
    // Return null to handle it gracefully in the UI
    return null;
  }
};
