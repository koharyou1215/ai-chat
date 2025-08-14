export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export function handleApiError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error('Unknown API error');
}

export async function callApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetchWithTimeout(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw handleApiError(error);
  }
}