import { ImageResponse } from "next/og";
import { createElement } from "react";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f766e",
          color: "#ffffff",
          fontSize: 116,
          fontWeight: 800,
          letterSpacing: 0,
        },
      },
      "معلومة",
    ),
    size,
  );
}
