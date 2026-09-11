export const MODEL_NAME_MAP: Record<string, string> = {
  'auto': 'Auto (Default Engine)',
  'openai/gpt-oss-20b': 'OpenAI GPT-OSS 20B (Groq)',
  'qwen/qwen3.8-27b': 'Qwen 3.8 27B (Groq)',
  'llama-3.3-70b-versatile': 'Llama 3.3 70B (Groq)',
  'llama-3.1-8b-instant': 'Llama 3.1 8B (Groq)',
  'gemini-3.8-flash': 'Gemini 3.8 Flash (Google)',
  'gemini-2.0-flash': 'Gemini 2.0 Flash (Google)',
  'gemini-2.5-flash': 'Gemini 2.5 Flash (Google)',
  'gemini-1.5-flash': 'Gemini 1.5 Flash (Google)',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning': 'Nemotron 3 Nano 30B (NVIDIA)',
  'meta/llama-3.2-11b-vision-instruct': 'Llama 3.2 11B Vision (NVIDIA)',
  'meta/muse-glimmer-30b': 'Meta Muse Glimmer 30B (NVIDIA)',
};

export function getModelDisplayName(modelId?: string): string {
  if (!modelId || modelId === 'auto') return 'Auto (Default Engine)';
  return MODEL_NAME_MAP[modelId] || modelId;
}
