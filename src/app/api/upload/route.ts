import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let ext: string;
    let bytes: Buffer;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { data, name } = body as { data?: string; name?: string };
      if (!data) return NextResponse.json({ error: "Veri bulunamadı" }, { status: 400 });

      const match = data.match(/^data:image\/(\w+);base64,/);
      if (match) {
        ext = match[1] === "jpeg" ? "jpg" : match[1];
      } else {
        ext = (name?.split(".").pop()?.toLowerCase()) ?? "";
      }

      const base64Data = data.replace(/^data:[^;]+;base64,/, "");
      bytes = Buffer.from(base64Data, "base64");
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
      ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      bytes = Buffer.from(await file.arrayBuffer());
    }

    if (!["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
      return NextResponse.json({ error: "Geçersiz dosya türü" }, { status: 400 });
    }
    if (bytes.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Dosya 10MB'dan büyük olamaz" }, { status: 400 });
    }

    const filename = `upload-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), bytes);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 });
  }
}
