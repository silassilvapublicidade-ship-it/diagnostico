import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt = "Diagnóstico Estratégico de Perfil no Instagram";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoBuffer = await readFile(
    join(process.cwd(), "public/logo-mark.png"),
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#050403",
          padding: 80,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og's
            ImageResponse (Satori) requires a plain <img>, not next/image. */}
        <img alt="" height={200} src={logoSrc} width={200} />
        <div
          style={{
            marginTop: 36,
            fontSize: 56,
            fontWeight: 800,
            color: "#f7efe5",
            textAlign: "center",
          }}
        >
          Diagnóstico Estratégico de Perfil
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 28,
            color: "#ff8c42",
            textAlign: "center",
          }}
        >
          Metodologia Silas Silva de Diagnóstico Estratégico
        </div>
      </div>
    ),
    { ...size },
  );
}
