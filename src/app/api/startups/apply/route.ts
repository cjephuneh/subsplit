import { z } from "zod";

import { prisma } from "@/server/db";
import { jsonError } from "@/server/http";

export const runtime = "nodejs";

const FREE_EMAIL_PROVIDERS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "mail.com",
  "aol.com",
  "icloud.com",
  "protonmail.com",
];

const ApplySchema = z.object({
  startupName: z.string().min(2).max(200),
  problem: z.string().min(20).max(2000),
  country: z.string().min(2).max(100),
  phoneNumber: z.string().min(7).max(30),
  email: z.string().email(),
  startupStage: z.string().min(2).max(50),
  startupLink: z.string().url(),
  founderVideoUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonError(400, {
        error: "BAD_REQUEST",
        message: "Invalid request body.",
      });
    }

    const parsed = ApplySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, {
        error: "VALIDATION_ERROR",
        message: "Invalid input.",
        context: { issues: parsed.error.issues },
      });
    }

    const { startupName, problem, country, phoneNumber, email, startupStage, startupLink, founderVideoUrl } = parsed.data;

    // Check if email is from free provider
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain || FREE_EMAIL_PROVIDERS.includes(emailDomain)) {
      return jsonError(400, {
        error: "INVALID_EMAIL",
        message: "Please use your company domain email, not free email providers like Gmail or Yahoo.",
      });
    }

    // Check for duplicate applications
    const existing = await prisma.startupApplication.findFirst({
      where: {
        email,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });

    if (existing) {
      return jsonError(409, {
        error: "DUPLICATE_APPLICATION",
        message: "You have already submitted an application with this email.",
      });
    }

    // Create application
    await prisma.startupApplication.create({
      data: {
        startupName,
        problem,
        country,
        phoneNumber,
        email,
        startupStage,
        startupLink,
        founderVideoUrl: founderVideoUrl || undefined,
      },
    });

    return Response.json({
      ok: true,
      message: "Application submitted successfully!",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(400, {
        error: "BAD_INPUT",
        message: "Invalid request body.",
        context: { issues: err.issues },
      });
    }

    console.error("Startup application error:", err);
    return jsonError(500, {
      error: "SERVER_ERROR",
      message: "Something went wrong. Please try again later.",
    });
  }
}
