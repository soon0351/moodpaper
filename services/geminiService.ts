import { GoogleGenAI } from "@google/genai";
import { GeneratedImage } from "../types";

let genAI: GoogleGenAI | null = null;
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';
const TEXT_MODEL_NAME = 'gemini-2.5-flash';

/**
 * Sets the API Key for the Gemini Client.
 */
export function setApiKey(apiKey: string) {
  if (!apiKey) {
    genAI = null;
    return;
  }
  genAI = new GoogleGenAI({ apiKey });
}

/**
 * Validates the API Key by making a lightweight request.
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const tempAI = new GoogleGenAI({ apiKey });
    await tempAI.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: "test",
    });
    return true;
  } catch (error) {
    console.error("API Key Validation Failed:", error);
    return false;
  }
}

function getClient(): GoogleGenAI {
  if (!genAI) {
    throw new Error("API Key가 설정되지 않았습니다. 설정 버튼을 눌러 키를 입력해주세요.");
  }
  return genAI;
}

/**
 * Generates a creative prompt based on a topic.
 */
export async function generateCreativePrompt(topic: string): Promise<string> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: `Write a detailed, artistic text-to-image prompt for a phone wallpaper based on the theme: "${topic}". 
      The prompt should describe visual elements, lighting, style, and mood. 
      Keep it under 40 words. 
      Output ONLY the prompt text in English, no explanations.`,
    });
    return response.text?.trim() || topic;
  } catch (error) {
    console.error("Prompt generation error:", error);
    // Re-throw if it's the specific "No API Key" error so UI can handle it
    if (error instanceof Error && error.message.includes("API Key")) throw error;
    return topic; // Fallback to the topic itself for other errors
  }
}

/**
 * Generates a list of creative wallpaper topics.
 */
export async function generateTopicSuggestions(): Promise<string[]> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: `Generate 5 creative, distinct, and aesthetic phone wallpaper themes/topics (e.g., "Cyberpunk Rainy City", "Minimalist Zen Garden"). 
      Output ONLY the 5 themes separated by commas. No numbering or bullets. 
      Translate them to Korean.`,
    });
    
    const text = response.text || "";
    return text.split(',').map(t => t.trim()).filter(t => t.length > 0);
  } catch (error) {
    console.error("Topic generation error:", error);
    if (error instanceof Error && error.message.includes("API Key")) throw error;
    return ["몽환적인 밤하늘", "비 오는 도시", "차분한 숲속", "미니멀한 기하학", "빈티지 필름 감성"];
  }
}

/**
 * Generates a single image based on the prompt.
 */
async function generateSingleImage(prompt: string, referenceImage?: string): Promise<string> {
  try {
    const ai = getClient();
    const parts: any[] = [];
    
    if (referenceImage) {
        const base64Data = referenceImage.split(',')[1];
        if (base64Data) {
            parts.push({
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Data
                }
            });
        }
    }

    const enhancedPrompt = referenceImage 
        ? `Remix this image based on these instructions: ${prompt}. Ensure high quality, aesthetic, phone wallpaper style.`
        : `${prompt}. High quality, aesthetic, 9:16 vertical phone wallpaper, highly detailed, atmospheric.`;

    parts.push({ text: enhancedPrompt });

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
            aspectRatio: "9:16",
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("이미지를 생성하지 못했습니다.");
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
}

/**
 * Generates 4 variations of the wallpaper in parallel.
 */
export const generateWallpapers = async (prompt: string, referenceImage?: string): Promise<GeneratedImage[]> => {
  const promises = Array(4).fill(null).map(() => generateSingleImage(prompt, referenceImage));
  
  try {
    const results = await Promise.all(promises);
    
    return results.map((url, index) => ({
      id: `${Date.now()}-${index}`,
      url,
      prompt,
      createdAt: Date.now()
    }));
  } catch (error) {
    if (error instanceof Error && error.message.includes("API Key")) {
        throw new Error("API Key가 설정되지 않았습니다.");
    }
    throw new Error("배경화면 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
  }
};