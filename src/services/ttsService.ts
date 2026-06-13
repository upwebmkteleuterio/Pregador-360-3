import { supabase } from '../integrations/supabase/client';

export async function generateSpeech(text: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore'): Promise<string> {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: {
      action: 'generate_speech',
      payload: { text, voiceName }
    }
  });

  if (error || !data || !data.base64Audio) {
    throw new Error(error?.message || "Failed to generate audio content");
  }

  return data.base64Audio;
}
