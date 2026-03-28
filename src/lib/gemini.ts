import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple in-memory caches to speed up repeated searches and suggestions
const suggestionCache = new Map<string, string[]>();
const drugSearchCache = new Map<string, any>();
const neonatalSearchCache = new Map<string, any>();
const renalSearchCache = new Map<string, any>();

export async function suggestDrugs(partialName: string, isNeonatal: boolean = false): Promise<string[]> {
  const cacheKey = `${partialName.toLowerCase().trim()}-${isNeonatal}`;
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey)!;
  }

  const prompt = `
    You are a medical assistant. The user is typing a drug name: "${partialName}".
    Provide a list of up to 5 standard ${isNeonatal ? 'neonatal ' : ''}drug names that start with or closely match this input.
    Return ONLY a JSON array of strings. Example: ["Amoxicillin", "Ampicillin", "Amiodarone"]
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const text = response.text;
    if (!text) return [];
    
    const result = JSON.parse(text);
    suggestionCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error suggesting drugs:", error);
    return [];
  }
}

export async function searchDrug(searchQuery: string) {
  const cacheKey = searchQuery.toLowerCase().trim();
  if (drugSearchCache.has(cacheKey)) {
    return drugSearchCache.get(cacheKey);
  }

  const prompt = `
    You are an expert medical assistant and pharmacologist. 
    Search your knowledge base for the drug: "${searchQuery}".
    Base your answer on standard medical formularies, specifically prioritizing "Frank Shann Drug Doses" and other widely recognized pediatric or adult dosing guidelines.
    
    Extract the following information:
    1. Drug Name
    2. Dosage (recommended dose or dose range for adults and/or children)
    3. Frequency (how often it should be taken)
    4. Notes (special instructions, warnings, or route of administration)
    5. Source (explicitly name the primary formulary or guideline you are referencing, e.g., "Frank Shann Drug Doses", "BNF", etc.)
    
    Return the result strictly as a JSON object with these exact keys:
    "drugName", "dosage", "frequency", "notes", "source".
    If the drug is not found, return {"drugName": "", "dosage": "", "frequency": "", "notes": "Drug not found.", "source": ""}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);
    drugSearchCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error searching drug:", error);
    throw error;
  }
}

export async function searchNeonatalDrug(searchQuery: string) {
  const cacheKey = searchQuery.toLowerCase().trim();
  if (neonatalSearchCache.has(cacheKey)) {
    return neonatalSearchCache.get(cacheKey);
  }

  const prompt = `
    You are an expert neonatal medical assistant and pharmacologist. 
    Search your knowledge base for the drug: "${searchQuery}".
    Base your answer on standard neonatal medical formularies, specifically prioritizing "Neofax" and other widely recognized neonatal dosing guidelines.
    
    Extract the following information focusing specifically on NEONATAL (newborn/premature) dosing:
    1. Drug Name
    2. Dosage (the recommended dose or dose range for neonates)
    3. Frequency (how often it should be taken)
    4. Notes (any special instructions, warnings, or route of administration for neonates)
    5. Source (explicitly name the primary formulary or guideline you are referencing, e.g., "Neofax", "BNF for Children", etc.)
    
    Return the result strictly as a JSON object with these exact keys:
    "drugName", "dosage", "frequency", "notes", "source".
    If the drug is not found, return {"drugName": "", "dosage": "", "frequency": "", "notes": "Drug not found.", "source": ""}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);
    neonatalSearchCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error searching neonatal drug:", error);
    throw error;
  }
}

export async function searchRenalDrug(searchQuery: string) {
  const cacheKey = searchQuery.toLowerCase().trim();
  if (renalSearchCache.has(cacheKey)) {
    return renalSearchCache.get(cacheKey);
  }

  const prompt = `
    You are an expert pediatric pharmacist. 
    Search your knowledge base for the drug: "${searchQuery}".
    Base your answer specifically on the "Paediatric Drug Dosage Adjustments in Patients with Renal Impairment or on Renal Replacement Therapies for use on the Intensive Care and Renal Units" guideline by Great Ormond Street Hospital (GOSH).
    
    Extract the following information:
    1. Drug Name
    2. Normal dose
    3. Dose adjustment in renal impairment (e.g., GFR bands)
    4. Dose adjustment in HD (Haemodialysis)
    5. Dose adjustment in PD (Peritoneal Dialysis)
    6. Dose adjustment in CVVH (Continuous Veno-Venous Haemofiltration)
    7. Notes
    
    Return the result strictly as a JSON object with these exact keys:
    "drugName", "normalDose", "renalImpairment", "hd", "pd", "cvvh", "notes".
    If the drug is not found, return {"drugName": "", "normalDose": "", "renalImpairment": "", "hd": "", "pd": "", "cvvh": "", "notes": "Drug not found in the renal guidelines."}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);
    renalSearchCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error searching renal drug:", error);
    throw error;
  }
}
