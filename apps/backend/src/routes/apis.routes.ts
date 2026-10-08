import { Router } from "express";
import { prisma } from "../utils/prisma";
import { asyncHandler } from "../middleware/async-handler";

export const apisRouter = Router();

apisRouter.get(
  "/apis",
  asyncHandler(async (_req, res) => {
    const apis = await prisma.monitoredAPI.findMany({ orderBy: { name: "asc" } });
    res.json({ apis });
  })
);

apisRouter.get(
  "/apis/:id",
  asyncHandler(async (req, res) => {
    const api = await prisma.monitoredAPI.findUnique({
      where: { id: req.params.id },
      include: {
        checks: {
          orderBy: { checkedAt: "desc" },
          take: 20,
          include: { anomalies: true },
        },
      },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    res.json({ api });
  })
);
