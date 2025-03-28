import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIExpense } from "@shared/schema";

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Get the model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function extractExpenseFromText(text: string): Promise<AIExpense | null> {
  try {
    console.log("Analyzing expense text:", text);
    
    const prompt = `
      Extract expense information from the following text: "${text}"
      
      I need you to parse the following data:
      1. Amount (as a number, without currency)
      2. Category (one of: Food, Transport, Entertainment, Groceries, Utilities, Housing, Healthcare, Shopping, Other)
      3. Date (infer today if not specified, use ISO format)
      4. Description (brief explanation of the expense)
      5. Location (if provided)
      6. Currency (default to "VND" if not specified)
      
      IMPORTANT: Your response must ONLY contain a valid JSON object and nothing else. No explanations, no markdown, just the JSON object directly.
      Parse numerical values correctly.
      
      Example response:
      {"amount":150000,"category":"Food","date":"2023-05-10T12:00:00Z","description":"Lunch at restaurant","location":"Local Restaurant","currency":"VND"}
    `;

    const generationConfig = {
      temperature: 0.1, // Low temperature for more deterministic results
      topP: 0.8,
      topK: 40,
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });
    
    const response = await result.response;
    const textResponse = response.text();
    
    console.log("Raw Gemini response:", textResponse);
    
    // First, try to parse the response directly as JSON
    try {
      const directParse = JSON.parse(textResponse);
      console.log("Successfully parsed response directly as JSON");
      
      // Ensure amount is a number
      if (typeof directParse.amount === 'string') {
        directParse.amount = parseFloat(directParse.amount.replace(/[^0-9.]/g, ''));
      }
      
      // Set default values if needed
      const date = directParse.date || new Date().toISOString();
      const currency = directParse.currency || "VND";
      
      const validatedResult = {
        ...directParse,
        date,
        currency
      };
      
      console.log("Processed expense:", validatedResult);
      return validatedResult as AIExpense;
    } catch (parseError) {
      console.log("Direct JSON parse failed, trying to extract JSON from text");
      
      // Extract JSON from the response if it's not directly parseable
      const jsonPattern = /\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;
      const jsonMatches = textResponse.match(jsonPattern);
      
      if (jsonMatches && jsonMatches.length > 0) {
        console.log("Found JSON-like pattern in response");
        const jsonCandidate = jsonMatches[0];
        
        try {
          const parsedResult = JSON.parse(jsonCandidate);
          
          // Ensure amount is a number
          if (typeof parsedResult.amount === 'string') {
            parsedResult.amount = parseFloat(parsedResult.amount.replace(/[^0-9.]/g, ''));
          }
          
          // Set default values if needed
          const date = parsedResult.date || new Date().toISOString();
          const currency = parsedResult.currency || "VND";
          
          const validatedResult = {
            ...parsedResult,
            date,
            currency
          };
          
          console.log("Processed expense from extracted JSON:", validatedResult);
          return validatedResult as AIExpense;
        } catch (nestedError) {
          console.error("Error parsing extracted JSON:", nestedError);
          
          // Last resort: manually construct a response from the text
          // This is a fallback when all parsing attempts fail
          console.log("Attempting to construct expense from text input directly");
          
          // Simple fallback extraction for amount and category
          let amount = 0;
          const amountMatch = text.match(/(\d+)[k]?/);
          if (amountMatch) {
            amount = parseInt(amountMatch[1]);
            if (text.includes('k')) amount *= 1000;
          }
          
          // Basic category detection
          let category = "Other";
          if (text.toLowerCase().includes("food") || text.toLowerCase().includes("eat") || 
              text.toLowerCase().includes("lunch") || text.toLowerCase().includes("dinner")) {
            category = "Food";
          } else if (text.toLowerCase().includes("transport") || text.toLowerCase().includes("uber") || 
                     text.toLowerCase().includes("taxi") || text.toLowerCase().includes("bus")) {
            category = "Transport";
          }
          
          const fallbackExpense = {
            amount,
            category,
            date: new Date().toISOString(),
            description: text,
            location: "",
            currency: "VND"
          };
          
          console.log("Created fallback expense:", fallbackExpense);
          return fallbackExpense;
        }
      }
      
      console.error("Failed to extract any JSON from response");
      return null;
    }
  } catch (error) {
    console.error("Error extracting expense from text:", error);
    return null;
  }
}

export async function getMonthlyInsights(expenses: any[], month: number, year: number): Promise<string[]> {
  try {
    console.log(`Generating insights for ${month}/${year} with ${expenses.length} expenses`);
    
    // Format expenses for better context
    const expensesSummary = expenses.map(e => 
      `${e.description || 'Expense'}: ${e.amount} ${e.currency} for ${e.category}`
    ).join("\n");

    const prompt = `
      I need you to analyze the following expense data for ${month}/${year} and provide 3 helpful insights or suggestions:
      
      ${expensesSummary}
      
      Please give 3 specific, actionable insights about spending patterns, potential savings, or budget optimizations.
      IMPORTANT: Your response must ONLY contain a valid JSON array of strings and nothing else. No explanations, no markdown.
      
      Example response:
      ["Your food expenses are 25% of your total spending, which is within the recommended 20-30% range.","Consider reducing electricity costs by setting your AC to 26°C instead of lower temperatures.","You could save up to 500,000 VND next month by following a budget of 4.8M VND."]
    `;

    const generationConfig = {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });
    
    const response = await result.response;
    const textResponse = response.text();
    
    console.log("Raw insights response:", textResponse);
    
    // First, try to parse the response directly as JSON
    try {
      const directParse = JSON.parse(textResponse);
      console.log("Successfully parsed insights directly as JSON");
      
      if (Array.isArray(directParse)) {
        return directParse.map(item => String(item));
      } else {
        console.log("Response is valid JSON but not an array, trying to extract array");
      }
    } catch (parseError) {
      console.log("Direct JSON parse failed, trying to extract JSON array from text");
    }
    
    // Extract JSON array from the response if it's not directly parseable
    const arrayPattern = /\[([\s\S]*?)\]/g;
    const arrayMatches = textResponse.match(arrayPattern);
    
    if (arrayMatches && arrayMatches.length > 0) {
      console.log("Found JSON array pattern in response");
      const arrayCandidate = arrayMatches[0];
      
      try {
        const parsedArray = JSON.parse(arrayCandidate);
        
        if (Array.isArray(parsedArray)) {
          return parsedArray.map(item => String(item));
        }
      } catch (nestedError) {
        console.error("Error parsing extracted array:", nestedError);
      }
    }
    
    // If we can't parse the response as JSON, try to extract insights manually
    console.log("Trying to extract insights line by line");
    
    // Look for numbered points (1. 2. 3.) or bullet points (* - •)
    const insightLines = textResponse
      .split(/\n+/)
      .filter(line => /^(\d+[.)]|\*|\-|\•)\s+/.test(line.trim()))
      .map(line => line.replace(/^(\d+[.)]|\*|\-|\•)\s+/, '').trim());
    
    if (insightLines.length > 0) {
      console.log("Extracted insights from text lines:", insightLines);
      return insightLines;
    }
    
    // Last resort: split by newlines and take non-empty lines
    const fallbackInsights = textResponse
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 15 && !line.startsWith('```'));
    
    if (fallbackInsights.length > 0) {
      console.log("Using fallback line extraction for insights");
      return fallbackInsights.slice(0, 3);
    }
    
    console.log("Could not extract valid insights from response");
    return ["No spending patterns identified yet. Add more expenses to get insights."];
    
  } catch (error) {
    console.error("Error generating monthly insights:", error);
    return ["Unable to generate insights at this time. Please try again later."];
  }
}