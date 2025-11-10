import { GoogleGenAI, Type } from "@google/genai";
import type { TransformParams } from '../types';

/**
 * Extracts SVG content from AI response text
 */
const extractSVG = (text: string): string | null => {
    const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/i;
    const match = text.match(svgRegex);
    if (match) {
        return match[0];
    }
    return null;
};

/**
 * Validates user input to prevent prompt injection and abuse
 * @throws Error if input is invalid
 */
const validatePrompt = (prompt: string): void => {
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('提示不能為空');
    }

    const trimmed = prompt.trim();

    if (trimmed.length === 0) {
        throw new Error('提示不能為空');
    }

    if (trimmed.length > 2000) {
        throw new Error('提示過長，請限制在 2000 字元以內');
    }

    // Check for potential prompt injection patterns
    const suspiciousPatterns = [
        /ignore\s+(previous|all|above)\s+(instructions|prompts)/i,
        /system\s*:\s*/i,
        /new\s+instructions\s*:/i,
        /<script/i,
        /javascript:/i,
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(trimmed)) {
            throw new Error('偵測到不安全的輸入模式');
        }
    }
};

/**
 * Sanitizes SVG content to prevent XSS attacks
 * Removes potentially dangerous elements and attributes
 */
const sanitizeSVG = (svgString: string): string => {
    // Remove script tags
    let sanitized = svgString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers (onclick, onload, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data URLs that could contain scripts (except safe image formats)
    sanitized = sanitized.replace(/data:(?!image\/(png|jpg|jpeg|gif|svg\+xml))[^"']*/gi, '');

    return sanitized;
};

/**
 * AI Service for generating SVG graphics and style suggestions
 * ⚠️ SECURITY WARNING: API key is exposed in client-side code
 * Only use this for development/testing purposes
 */
class AIService {
    private ai: GoogleGenAI | null = null;

    constructor() {
        // Try both old and new environment variable formats for backward compatibility
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (apiKey && apiKey !== 'your-api-key-here') {
            this.ai = new GoogleGenAI({ apiKey });
            console.log('✓ AI Service initialized successfully');
        } else {
            console.warn('⚠️ Gemini API key not configured.');
            console.warn('AI features will be disabled. Please add GEMINI_API_KEY to your .env file.');
            console.warn('See .env.example for instructions.');
        }
    }

    async textToSVG(prompt: string, useThinkingMode: boolean): Promise<string> {
        if (!this.ai) {
            throw new Error("AI 服務未初始化。請設定您的 Gemini API 金鑰。");
        }

        // Validate input to prevent prompt injection
        validatePrompt(prompt);

        const fullPrompt = `
            Generate a single, clean, black-filled SVG based on the user's request.
            The request can be for a stylized letter, an icon, or a geometric shape.
            If dimensions are specified (e.g., "a 300x50px rectangle"), the SVG's viewBox should reflect these dimensions.
            
            The response must contain ONLY the SVG code and nothing else.
            - The SVG MUST have a viewBox attribute.
            - The design should be a single path or a group of paths, filled with black (#000000).
            - The SVG should be as simple as possible.
            - Do NOT include any XML declaration, comments, or extra attributes like width/height on the <svg> tag.
            - Do NOT output markdown code blocks (e.g. \`\`\`xml).

            Request: "${prompt}"
        `;
        
        const config = useThinkingMode 
            ? { thinkingConfig: { thinkingBudget: 32768 } } 
            : {};

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: fullPrompt,
                config,
            });

            const svgString = extractSVG(response.text);

            if (!svgString) {
                console.error("No SVG found in AI response:", response.text);
                throw new Error("AI 未能返回有效的 SVG。請嘗試不同的提示。");
            }

            // Sanitize SVG to prevent XSS attacks
            const sanitizedSVG = sanitizeSVG(svgString);

            return sanitizedSVG;
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('invalid'))) {
                 throw new Error("您的 API 金鑰無效，請檢查您的設定。");
            }
            throw new Error("生成 SVG 失敗，AI 服務可能正忙。");
        }
    }

    async getStyleSuggestions(prompt: string): Promise<Partial<TransformParams>[]> {
        if (!this.ai) {
            throw new Error("AI 服務未初始化。請設定您的 Gemini API 金鑰。");
        }

        // Validate input to prevent prompt injection
        validatePrompt(prompt);

        const systemInstruction = `You are a font design assistant. Based on the user's prompt, suggest 3 distinct variations of font parameters.
        - 'weight': stroke thickness, from 1 (thin) to 200 (very bold).
        - 'width': overall width percentage, from 50 (narrow) to 150 (wide).
        - 'slant': angle in degrees, from -30 (italic back) to 30 (italic forward).
        Adhere strictly to the provided JSON schema and parameter ranges.`;

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    weight: { type: Type.INTEGER, description: 'Font weight (thickness). Range: 1 to 200.' },
                    width: { type: Type.INTEGER, description: 'Font width percentage. Range: 50 to 150.' },
                    slant: { type: Type.INTEGER, description: 'Font slant in degrees. Range: -30 to 30.' },
                },
                required: ['weight', 'width', 'slant'],
            },
        };

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Generate font styles for: "${prompt}"`,
                config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema },
            });

            const suggestions = JSON.parse(response.text);
            if (!Array.isArray(suggestions) || suggestions.length === 0) throw new Error("AI 未能返回有效的樣式建議。");
            return suggestions.filter(s => s.hasOwnProperty('weight') && s.hasOwnProperty('width') && s.hasOwnProperty('slant'));

        } catch (error) {
            console.error("Error calling Gemini API for style suggestions:", error);
            if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('invalid'))) throw new Error("您的 API 金鑰無效，請檢查您的設定。");
            throw new Error("生成樣式失敗，AI 服務可能正忙。");
        }
    }

    async getColorPalettes(prompt: string): Promise<{name: string, colors: string[]}[]> {
        if (!this.ai) throw new Error("AI 服務未初始化。請設定您的 Gemini API 金鑰。");

        // Validate input to prevent prompt injection
        validatePrompt(prompt);

        const systemInstruction = `You are a color palette expert. Based on the user's theme, generate 3 distinct color palettes. Each palette should have a descriptive name and contain 5-7 colors in HEX format.`;

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'Descriptive name for the palette.' },
                    colors: { type: Type.ARRAY, items: { type: Type.STRING, description: 'Color in HEX format (e.g., "#RRGGBB").' } },
                },
                required: ['name', 'colors'],
            },
        };
        
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Generate color palettes for the theme: "${prompt}"`,
                config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema },
            });
            const palettes = JSON.parse(response.text);
            if (!Array.isArray(palettes) || palettes.length === 0) throw new Error("AI 未能返回有效的調色盤。");
            return palettes;
        } catch (error) {
            console.error("Error calling Gemini API for color palettes:", error);
            if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('invalid'))) throw new Error("您的 API 金鑰無效，請檢查您的設定。");
            throw new Error("生成調色盤失敗，AI 服務可能正忙。");
        }
    }
}

export const aiService = new AIService();