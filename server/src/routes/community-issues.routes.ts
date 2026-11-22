import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { authenticate, requireRole } from "../middlewares/auth";
import { AppError, sendSuccess } from "../utils/response";

const router = Router();
const createSchema = z.object({
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(5).max(2000),
  locationName: z.string().trim().min(2).max(240),
  longitude: z.number().finite().min(-180).max(180),
  latitude: z.number().finite().min(-90).max(90),
  imageUrl: z.string().url().max(2048).optional().nullable(),
});
const statusSchema = z.object({
  status: z.enum(["UNVERIFIED", "VERIFIED", "IN_PROGRESS", "RESOLVED"]),
});
const publicSelect = {
  id: true, category: true, description: true, locationName: true,
  longitude: true, latitude: true, imageUrl: true, status: true,
  verificationCount: true, createdAt: true, updatedAt: true,
  reporter: { select: { id: true, role: true } },
};

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const issues = await prisma.communityIssueReport.findMany({
      select: publicSelect, orderBy: { createdAt: "desc" }, take: 200,
    });
    sendSuccess(res, issues);
  } catch (error) { next(error); }
});

router.post("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createSchema.parse(req.body);
    const issue = await prisma.communityIssueReport.create({
      data: { ...input, reporterId: req.user!.id },
      select: publicSelect,
    });
    sendSuccess(res, issue, 201);
  } catch (error) { next(error); }
});

router.post("/:id/verify", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.communityIssueReport.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "NOT_FOUND", "Community issue not found");
    try {
      await prisma.$transaction([
        prisma.communityIssueVerification.create({ data: { issueId: id, userId: req.user!.id } }),
        prisma.communityIssueReport.update({
          where: { id }, data: {
            verificationCount: { increment: 1 },
            ...(existing.status === "UNVERIFIED" ? { status: "VERIFIED" } : {}),
          },
        }),
      ]);
    } catch (error: any) {
      if (error?.code === "P2002") throw new AppError(409, "ALREADY_VERIFIED", "You have already confirmed this issue");
      throw error;
    }
    const issue = await prisma.communityIssueReport.findUnique({ where: { id }, select: publicSelect });
    sendSuccess(res, issue);
  } catch (error) { next(error); }
});

router.patch("/:id/status", authenticate, requireRole("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const id = req.params.id as string;
    const issue = await prisma.communityIssueReport.update({
      where: { id }, data: { status }, select: publicSelect,
    });
    sendSuccess(res, issue);
  } catch (error: any) {
    if (error?.code === "P2025") return next(new AppError(404, "NOT_FOUND", "Community issue not found"));
    next(error);
  }
});

export default router;
