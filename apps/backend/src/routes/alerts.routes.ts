import { Router } from "express";
import { prisma } from "../utils/prisma";
import { asyncHandler } from "../middleware/async-handler";

export const alertsRouter = Router();

alertsRouter.get(
  "/alerts",
  asyncHandler(async (req, res) => {
    const status = req.query.status === "RESOLVED" || req.query.status === "ACTIVE" ? req.query.status : undefined;

    const alerts = await prisma.alert.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        anomaly: {
          include: {
            monitoringCheck: { include: { api: true } },
          },
        },
      },
    });

    res.json({ alerts });
  })
);

alertsRouter.get(
  "/alerts/:id",
  asyncHandler(async (req, res) => {
    const alert = await prisma.alert.findUnique({
      where: { id: req.params.id },
      include: {
        anomaly: {
          include: {
            monitoringCheck: { include: { api: true, anomalies: true } },
          },
        },
      },
    });

    if (!alert) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }

    res.json({ alert });
  })
);

alertsRouter.patch(
  "/alerts/:id/resolve",
  asyncHandler(async (req, res) => {
    const existing = await prisma.alert.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }

    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });

    res.json({ alert });
  })
);
