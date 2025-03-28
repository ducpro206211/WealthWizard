import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIExpense } from "@shared/schema";

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Get the model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function extractExpenseFromText(text: string): Promise<AIExpense | null> {
  try {
    const prompt = `
      Extract expense information from the following text: "${text}"
      
      I need you to parse the following data:
      1. Amount (as a number, without currency)
      2. Category (one of: Food, Transport, Entertainment, Groceries, Utilities, Housing, Healthcare, Shopping, Other)
      3. Date (infer today if not specified, use ISO format)
      4. Description (brief explanation of the expense)
      5. Location (if provided)
      6. Currency (default to "VND" if not specified)
      
      Respond with a valid JSON object with these fields. Parse numerical values correctly.
      
      Example response:
      {
        "amount": 150000,
        "category": "Food",
        "date": "2023-05-10T12:00:00Z",
        "description": "Lunch at restaurant",
        "location": "Local Restaurant",
        "currency": "VND"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Extract JSON from the response - Gemini might include markdown formatting
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      textResponse.match(/{[\s\S]*?}/);
    
    let jsonString = jsonMatch ? 
                     (jsonMatch[1] ? jsonMatch[1] : jsonMatch[0]) : 
                     textResponse;
                     
    // Clean up any non-JSON content
    jsonString = jsonString.replace(/```json|```/g, '').trim();
    
    const parsedResult = JSON.parse(jsonString);
    
    // Ensure amount is a number
    if (typeof parsedResult.amount === 'string') {
      parsedResult.amount = parseFloat(parsedResult.amount.replace(/[^0-9.]/g, ''));
    }

    return parsedResult as AIExpense;
  } catch (error) {
    console.error("Error extracting expense from text:", error);
    return null;
  }
}

export async function getMonthlyInsights(expenses: any[], month: number, year: number): Promise<string[]> {
  try {
    // Format expenses for better context
    const expensesSummary = expenses.map(e => 
      `${e.description || 'Expense'}: ${e.amount} ${e.currency} for ${e.category}`
    ).join("\n");

    const prompt = `
      I need you to analyze the following expense data for ${month}/${year} and provide 3 helpful insights or suggestions:
      
      ${expensesSummary}
      
      Please give 3 specific, actionable insights about spending patterns, potential savings, or budget optimizations.
      Format your response as a JSON array of strings, with each string being one insight.
      
      Example response:
      [
        "Your food expenses are 25% of your total spending, which is within the recommended 20-30% range.",
        "Consider reducing electricity costs by setting your AC to 26°C instead of lower temperatures.",
        "You could save up to 500,000 VND next month by following a budget of 4.8M VND."
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Extract JSON from the response - Gemini might include markdown formatting
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      textResponse.match(/\[([\s\S]*?)\]/);
    
    let jsonString = jsonMatch ? 
                     (jsonMatch[1] ? `[${jsonMatch[1]}]` : jsonMatch[0]) : 
                     textResponse;
                     
    // Clean up any non-JSON content
    jsonString = jsonString.replace(/```json|```/g, '').trim();
    
    const insights = JSON.parse(jsonString);
    return Array.isArray(insights) ? insights : [];
  } catch (error) {
    console.error("Error generating monthly insights:", error);
    return ["Unable to generate insights at this time. Please try again later."];
  }
}