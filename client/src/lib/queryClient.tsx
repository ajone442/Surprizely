export async function apiRequest(method, url, data) {
  try {
    console.log(`API Request: ${method} ${url}`, data);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Only try to parse JSON if there's content
    if (response.status !== 204) {
      const responseData = await response.json();
      console.log(`API Response: ${method} ${url}`, responseData);
      return responseData;
    }

    return null;
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
}