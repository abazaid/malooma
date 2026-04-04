export function generateImagePrompt(topic: string, categoryName: string) {
  return {
    prompt: `Editorial cover illustration for an Arabic knowledge article about ${topic}, category ${categoryName}, clean composition, modern neutral palette, high detail, professional magazine style, no text, no watermark, 16:9` ,
    negativePrompt: "text, letters, watermark, logo, blurry, low quality, distorted faces",
  };
}
