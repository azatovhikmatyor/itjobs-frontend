import { GoogleGenAI, Type } from "@google/genai";
import { Job, UserProfile, ATSAnalysis } from "../types";

// Helper to get client (assumes API Key is in env, though for this frontend-only demo 
// we might need a way to prompt if env is missing, handled in UI)
const getAiClient = () => {
  const apiKey = process.env.API_KEY || ''; 
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
};

export interface ParseResumeInput {
  data: string;
  mimeType: string;
}

/**
 * Helper to safely parse JSON from AI response, handling markdown and refusals
 */
const cleanAndParseJson = (text: string) => {
  try {
    if (!text) return {};

    // 1. Remove markdown code blocks (```json ... ```)
    let cleaned = text.replace(/```json\n?|```/g, '').trim();
    
    // 2. Attempt to extract the actual JSON object if there is conversational wrapper text
    const firstOpen = cleaned.indexOf('{');
    const lastClose = cleaned.lastIndexOf('}');
    
    if (firstOpen !== -1 && lastClose !== -1) {
      cleaned = cleaned.substring(firstOpen, lastClose + 1);
    } else {
      // If no brackets found, and text looks like a refusal
      if (cleaned.toLowerCase().includes("sorry") || cleaned.toLowerCase().includes("cannot")) {
        throw new Error("AI Refusal: " + cleaned);
      }
    }
    
    return JSON.parse(cleaned);
  } catch (e: any) {
    if (e.message.includes("AI Refusal")) throw e;
    console.error("JSON Parse Error:", e, "Text:", text);
    throw new Error("Failed to parse AI response. The model may have returned invalid JSON.");
  }
};

/**
 * Universal Resume Parsing
 * Handles:
 * - Text/Markdown (text/plain)
 * - PDF (application/pdf) - Multimodal
 * - URL (text/plain + isUrl flag) - Grounding
 */
export const parseResumeToProfile = async (
  input: ParseResumeInput, 
  isUrl: boolean = false
): Promise<Partial<UserProfile>> => {
  try {
    const ai = getAiClient();
    const model = "gemini-2.5-flash"; // Flash for multimodal & search capabilities
    
    let contents: any = [];
    let config: any = {};

    if (isUrl) {
      // Use Google Search Grounding for URLs (LinkedIn, GitHub, Portfolio)
      // NOTE: When using tools (googleSearch), we CANNOT use responseMimeType: 'application/json' or responseSchema.
      contents = `Analyze the professional profile found at this URL: ${input.data}. 
      Extract the candidate's name, current job title/occupation, email (if visible, otherwise placeholder), skills, and experience level.
      Also generate a "resumeText" summary that represents the candidate's full experience found on the page.

      IMPORTANT: Return ONLY a valid, raw JSON object. Do not output markdown formatting. Do not output conversational text.
      If you cannot access the page, return a JSON with "name": "Unknown" and "resumeText": "Could not access URL".

      JSON Structure:
      {
        "name": "string",
        "email": "string",
        "jobTitle": "string",
        "parsedSkills": ["skill1", "skill2"],
        "experienceLevel": "Junior/Mid/Senior/Lead",
        "resumeText": "summary text"
      }`;
      
      config = {
        tools: [{ googleSearch: {} }]
      };
    } else {
      // Standard File Parsing (PDF/Text) - We CAN use JSON Schema here for strict output
      if (input.mimeType === 'application/pdf') {
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.data // Base64 string
              }
            },
            {
              text: `Extract the candidate's name, current job title (e.g. Senior Developer), email, skills (as an array of strings), and experience level (Junior, Mid, Senior, Lead) from this resume.
              IMPORTANT: Also generate a 'resumeText' field containing a comprehensive Markdown summary of the candidate's entire work history and education from the file.`
            }
          ]
        };
      } else {
        // Plain Text (TXT, MD, or Extracted DOCX)
        contents = `Extract the candidate's name, current job title (e.g. Senior Developer), email, skills (as an array of strings), and experience level (Junior, Mid, Senior, Lead) from this resume text.
        
        Resume Text:
        ${input.data}
        
        IMPORTANT: Map the input text to the 'resumeText' field in the JSON response as well, cleaning it up if necessary.`;
      }

      config = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            jobTitle: { type: Type.STRING, description: "The candidate's current or most recent job title." },
            parsedSkills: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            experienceLevel: { type: Type.STRING },
            resumeText: { 
              type: Type.STRING, 
              description: "A full text extraction or summary of the resume/profile content." 
            }
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    const text = response.text || "{}";
    return cleanAndParseJson(text);

  } catch (error) {
    console.error("Resume parsing failed:", error);
    throw error;
  }
};

/**
 * Company Research using Google Search Grounding
 */
export const researchCompany = async (companyName: string): Promise<{ summary: string; links: string[] }> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find recent news, culture values, and key products for the company "${companyName}". Summarize in 3 bullet points.`,
      config: {
        tools: [{ googleSearch: {} }] // Grounding
      }
    });

    const summary = response.text || "No information found.";
    
    // Extract grounding links if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = chunks
      .map((c: any) => c.web?.uri)
      .filter((uri: string | undefined) => uri !== undefined) as string[];

    return { summary, links: Array.from(new Set(links)) }; // Unique links
  } catch (error) {
    console.error("Company research failed:", error);
    return { summary: "Could not research company at this time.", links: [] };
  }
};

/**
 * ATS Compliance Analysis
 */
export const analyzeATS = async (resumeText: string, job: Job): Promise<ATSAnalysis> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a strict ATS (Applicant Tracking System) scanner. Analyze the candidate's resume against the job description.
      
      JOB DESCRIPTION:
      Title: ${job.job_title}
      Company: ${job.company}
      Skills: ${job.skills.join(', ')}
      Description: ${job.description}

      CANDIDATE RESUME:
      ${resumeText}

      Provide a match score (0-100), list of critically missing keywords, potential formatting or content issues, and actionable suggestions to improve the match.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Match score from 0 to 100" },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            formattingIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text || "{}";
    return cleanAndParseJson(text) as ATSAnalysis;
  } catch (error) {
    console.error("ATS analysis failed:", error);
    // Fallback object
    return {
      score: 50,
      missingKeywords: ["Error analyzing ATS"],
      formattingIssues: [],
      suggestions: ["Please try again."]
    };
  }
};

/**
 * Tailor Resume using Standard Flash
 */
export const tailorResume = async (resumeText: string, job: Job): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert Career Coach. Rewrite the following resume experience section to better highlight matches with the Job Description provided. Use keywords from the job description but remain truthful to the original resume.
      
      JOB DESCRIPTION:
      Title: ${job.job_title} at ${job.company}
      Skills: ${job.skills.join(', ')}
      Description: ${job.description}

      ORIGINAL RESUME CONTENT:
      ${resumeText}

      Output the full rewritten resume in Markdown format. Highlighting changes in bold is optional but helpful.`,
    });

    return response.text || "";
  } catch (error) {
    console.error("Resume tailoring failed:", error);
    throw error;
  }
};

/**
 * Generate Cover Letter using Pro for high quality reasoning
 */
export const generateCoverLetter = async (resumeText: string, job: Job, companyResearch: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using Flash for speed, could upgrade to Pro
      contents: `Write a compelling, professional cover letter for the following job. 
      Incorporate specific details from the company research to show genuine interest.
      Map the candidate's skills to the job requirements.

      JOB:
      ${job.job_title} @ ${job.company}
      Desc: ${job.description}

      COMPANY CONTEXT:
      ${companyResearch}

      CANDIDATE RESUME:
      ${resumeText}
      `,
    });

    return response.text || "";
  } catch (error) {
    console.error("Cover letter generation failed:", error);
    throw error;
  }
};
