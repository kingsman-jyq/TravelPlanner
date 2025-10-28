import OpenAI from "openai";
import { DASHSCOPE_API_KEY } from '../config';

if (!DASHSCOPE_API_KEY) {
  throw new Error('DASHSCOPE_API_KEY must be provided.');
}

const openai = new OpenAI({
    apiKey: DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

interface TravelParams {
  destination: string;
  duration: number;
  budget: number;
  travelers: string;
  preferences: string;
}

export async function generateTravelPlan(params: TravelParams): Promise<any> {
  const { destination, duration, budget, travelers, preferences } = params;

  const formattedPreferences = preferences.split(',').map(p => p.trim()).filter(p => p !== '').join(', ');

  const prompt = `
    As an expert travel planner, create a detailed, personalized travel itinerary based on the following user requirements. 
    Your response MUST be a valid JSON object.

    **User Requirements:**
    - **Destination:** ${destination}
    - **Duration:** ${duration} days
    - **Budget:** Approximately ${budget} CNY for ${travelers} people
    - **Travelers:** ${travelers}
    - **Preferences:** ${formattedPreferences}

    **JSON Output Structure:**
    Please generate a JSON object with the following structure:
    {
      "trip_name": "A descriptive name for the trip, e.g., '5-Day Tokyo Adventure'",
      "budget_summary": "A brief summary of the estimated budget allocation.",
      "itinerary": [
        {
          "day": 1,
          "theme": "A theme for the day, e.g., 'Arrival and Shinjuku Exploration'",
          "activities": [
            {
              "start_time": "09:00",
              "end_time": "12:00",
              "activity_type": "sightseeing | dining | transport | accommodation",
              "description": "Detailed description of the activity.",
              "location_name": "Name of the location",
              "address": "Full address of the location"
            },
            {
              "start_time": "13:00",
              "end_time": "17:00",
              "activity_type": "sightseeing",
              "description": "Visit the Meiji Shrine, a peaceful oasis in the city.",
              "location_name": "Meiji Jingu",
              "address": "1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japan"
            }
          ]
        }
      ],
      "estimated_cost": {
        "flights": 500,
        "accommodation": 1000,
        "activities": 300,
        "food": 200,
        "total": 2000
      }
    }

    Ensure the itinerary is logical, covers the full duration, and aligns with the user's preferences and budget. The activity descriptions should be engaging and helpful.
  `;

  try {
    const completion = await openai.chat.completions.create({
        model: "qwen-plus",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
        ],
    });

    if (completion.choices[0].message.content) {
      return JSON.parse(completion.choices[0].message.content);
    } else {
      throw new Error("Failed to get a valid response from the AI.");
    }
  } catch (error) {
    console.error('Error generating travel plan from AI:', error);
    throw new Error('Failed to generate travel plan.');
  }
}

export async function parseUserInput(text: string): Promise<any> {
  const prompt = `
    You are an AI assistant that extracts travel planning information from natural language. 
    Parse the following user request and extract the Destination, Duration (in days), Budget (numeric, in CNY), Travelers (e.g., '2 adults, 1 child'), and Preferences (a concise summary of interests). 
    If a field is not explicitly mentioned, infer a reasonable value based on common travel scenarios or extract it from the context. Do not leave fields as null if information can be inferred or extracted.
    Your response MUST be a valid JSON object with the following structure:
    {
      "destination": "string",
      "duration": "number",
      "budget": "number",
      "travelers": "string",
      "preferences": "string"
    }

    Example User Request: "我想去日本，5 天，预算 1 万元，喜欢美食和动漫，带孩子"
    Example AI Response: {"destination": "日本", "duration": 5, "budget": 10000, "travelers": "2 adults, 1 child", "preferences": "美食, 动漫, 适合带孩子"}

    User Request: "${text}"
  `;

  console.log('QwenClient - Prompt sent to Qwen:', prompt);

  try {
    const completion = await openai.chat.completions.create({
        model: "qwen-plus",
        messages: [
            { role: "system", content: "You are a helpful assistant that extracts structured data." },
            { role: "user", content: prompt }
        ],
    });

    console.log('QwenClient - Raw completion from Qwen:', JSON.stringify(completion));

    if (completion.choices[0].message.content) {
      return JSON.parse(completion.choices[0].message.content);
    } else {
      throw new Error("Failed to get a valid response from the AI for parsing user input.");
    }
  } catch (error) {
    console.error('Error parsing user input with AI:', error);
    throw new Error('Failed to parse user input.');
  }
}
