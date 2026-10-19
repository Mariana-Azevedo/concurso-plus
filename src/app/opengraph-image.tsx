import { ImageResponse } from "next/og";

export const alt = "Concurso Plus: estude uma vez, revise no tempo certo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagem que aparece quando o link do site é compartilhado
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 600, opacity: 0.9, marginBottom: 32 }}>Concurso Plus</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1 }}>Estude uma vez.</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1 }}>Revise no tempo certo.</div>
        <div style={{ fontSize: 32, marginTop: 40, opacity: 0.9 }}>
          Revisão espaçada para concursos: 1, 3, 7 e 15 dias.
        </div>
      </div>
    ),
    size,
  );
}
