import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = "https://portaria-deploy.onrender.com";
export const TOKEN_STORAGE_KEY = "@portaria_token";

/**
 * Wrapper de chamadas à API que automaticamente injeta o token JWT.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Timeout de 60 segundos (útil para APIs no Render que podem dormir)
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 60000);

  try {
    console.log(`[API REQUEST] GET ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    });
    clearTimeout(id);

    // Clona a resposta para podermos ler o texto caso dê erro sem quebrar o .json() depois
    const resClone = response.clone();
    
    if (!response.ok) {
      const errorText = await resClone.text();
      console.error(`[API ERROR] ${endpoint} retornou status ${response.status}:`, errorText);
    } else {
      // Tenta ver se retornou um HTML ou algo bizarro ao invés de JSON
      const text = await resClone.text();
      if (text.startsWith("<")) {
        console.error(`[API HTML WARNING] ${endpoint} retornou HTML inesperado:`, text);
      } else {
        console.log(`[API SUCCESS] ${endpoint} retornou dados corretamente (Status ${response.status})`);
      }
    }

    return response;
  } catch (error: any) {
    clearTimeout(id);
    console.error(`[API FETCH FAILED] Falha crítica ao acessar ${endpoint}:`, error.message);
    if (error.name === "AbortError") {
      throw new Error("O servidor demorou muito para responder (Timeout).");
    }
    throw error;
  }
}
