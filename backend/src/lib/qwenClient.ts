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
    const {destination, duration, budget, travelers, preferences} = params;

    const formattedPreferences = preferences.split(',').map(p => p.trim()).filter(p => p !== '').join(', ');

    const prompt = `
    作为一名专业的旅行规划师，请根据以下用户需求，创建一个详细的、个性化的旅行行程。您的回复必须是一个有效的JSON对象。

    **用户需求:**
    - **目的地:** ${destination}
    - **时长:** ${duration} 天
    - **预算:** ${travelers} 人的预算约为 ${budget} 元人民币
    - **出行人数:** ${travelers}
    - **偏好:** ${formattedPreferences}

    **JSON输出结构:**
    请生成一个符合以下结构的JSON对象:
    {
      "trip_name": "旅行的描述性名称，例如：'东京五日游'",
      "budget_summary": "预估预算分配的简要总结。",
      "itinerary": [
        {
          "day": 1,
          "theme": "当日主题，例如：'抵达与新宿探索'",
          "activities": [
            {
              "start_time": "09:00",
              "end_time": "12:00",
              "activity_type": "观光 | 用餐 | 交通 | 住宿",
              "description": "活动的详细描述。",
              "location_name": "地点名称",
              "address": "地点的完整地址。重要提示：您必须提供中文地址，以便地图服务使用。",
              "estimated_cost": 50 // 此活动的预估开销
            },
            {
              "start_time": "13:00",
              "end_time": "17:00",
              "activity_type": "观光",
              "description": "参观明治神宫，城市中的一片宁静绿洲。",
              "location_name": "明治神宫",
              "address": "东京都涩谷区代代木神园町1-1",
              "estimated_cost": 0
            }
          ]
        }
      ],
      "estimated_cost": {
        "flights": 500,
        "accommodation": 1000,
        "transportation": 100, // 新增交通开销
        "activities": 300,
        "food": 200,
        "total": 2000
      }
    }

    请确保行程合理，涵盖整个时长，并符合用户的偏好和预算。活动描述应具有吸引力且有用。同时，请为每个活动估算开销，并提供详细的总开销分类。
  `;

    try {
        const completion = await openai.chat.completions.create({
            model: "qwen-plus",
            messages: [
                {role: "system", content: "你是一个乐于助人的助手。"},
                {role: "user", content: prompt}
            ],
        });

        if (completion.choices[0].message.content) {
            // Clean the response by removing markdown code block fences
            const rawResponse = completion.choices[0].message.content;
            const jsonResponse = rawResponse.replace(/```json\n|\n```/g, '').trim();
            return JSON.parse(jsonResponse);
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
    你是一个从自然语言中提取旅行规划信息的AI助手。
    请解析以下用户请求，提取目的地、时长（天）、预算（数字，人民币）、出行人数（例如：'2 adults, 1 child'）和偏好（兴趣的简明总结）。
    如果某个字段未明确提及，请根据常见的旅行场景推断一个合理的值或从上下文中提取。如果可以推断或提取信息，请不要将字段留空。
    您的回复必须是一个有效的JSON对象，结构如下:
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
                    {role: "system", content: "你是一个提取结构化数据的乐于助人的助手。"},
                    {role: "user", content: prompt}
                ],
            });

            console.log('QwenClient - Raw completion from Qwen:', JSON.stringify(completion));

            if (completion.choices[0].message.content) {
                // Clean the response by removing markdown code block fences
                const rawResponse = completion.choices[0].message.content;
                const jsonResponse = rawResponse.replace(/```json\n|\n```/g, '').trim();
                return JSON.parse(jsonResponse);
            } else {
                throw new Error("Failed to get a valid response from the AI for parsing user input.");
            }
        } catch (error) {
            console.error('Error parsing user input with AI:', error);
            throw new Error('Failed to parse user input.');
        }
    }
