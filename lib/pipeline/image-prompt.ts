function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function generateImagePrompt(topic: string, categoryName: string) {
  const cleanTopic = normalize(topic);
  const cleanCategory = normalize(categoryName);

  return {
    prompt: [
      "Create a realistic editorial cover image for an Arabic knowledge blog.",
      `Main subject must directly match this article title: \"${cleanTopic}\".`,
      `Category context: \"${cleanCategory}\".`,
      "Show concrete objects/scenes related to the topic only, not generic random imagery.",
      "Professional magazine look, natural lighting, clean composition, high detail.",
      "No text, no letters, no logos, no watermark, no collage.",
      "16:9 horizontal frame.",
    ].join(" "),
    negativePrompt:
      "text, letters, logo, watermark, unrelated subject, random stock scene, blurry, low quality, distorted anatomy, duplicated faces",
  };
}
