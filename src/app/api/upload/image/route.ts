import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { saveUserImage } from "@/lib/storage";

const Body = z.object({
  imageBase64: z.string().min(50),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const { url, bytes } = await saveUserImage(user.id, parsed.data.imageBase64);
    const image = await prisma.image.create({
      data: {
        userId: user.id,
        url,
        bytes,
        width: parsed.data.width ?? 0,
        height: parsed.data.height ?? 0,
      },
    });
    return NextResponse.json({ id: image.id, url: image.url, bytes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
