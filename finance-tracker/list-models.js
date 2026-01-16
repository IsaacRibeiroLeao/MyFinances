import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function listAllModels() {
  try {
    const models = await genAI.listModels();
    
    console.log("Available Models:");
    console.log("=================\n");
    
    for await (const model of models) {
      console.log(`Name: ${model.name}`);
      console.log(`Display Name: ${model.displayName}`);
      console.log(`Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('---\n');
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listAllModels();
