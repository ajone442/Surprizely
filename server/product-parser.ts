interface ParsedProduct {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  affiliateLink: string;
}

async function fetchProductPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch product page: ${error.message}`);
  }
}

export async function parseProductUrl(url: string): Promise<ParsedProduct | null> {
  try {
    const pageContent = await fetchProductPage(url);
    
    // Extract metadata using regex patterns
    const titleMatch = pageContent.match(/<meta property="og:title" content="([^"]+)"/);
    const descriptionMatch = pageContent.match(/<meta property="og:description" content="([^"]+)"/);
    const imageMatch = pageContent.match(/<meta property="og:image" content="([^"]+)"/);
    const priceMatch = pageContent.match(/\$(\d+\.?\d*)/);

    if (!titleMatch || !descriptionMatch || !imageMatch || !priceMatch) {
      throw new Error("Could not extract all required product information");
    }

    return {
      name: titleMatch[1],
      description: descriptionMatch[1],
      price: parseFloat(priceMatch[1]), // Use direct price value
      imageUrl: imageMatch[1],
      affiliateLink: url,
    };
  } catch (error) {
    console.error("Error parsing product URL:", error);
    return null;
  }
}
