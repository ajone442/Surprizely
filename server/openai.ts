import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_ENV_VAR) {
  console.warn("⚠️ OpenAI API key is not set. AI features will not work properly.");
  console.warn("Please add your API key in the Secrets tab (Tools > Secrets)");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-dummy-key"
});

export default openai;