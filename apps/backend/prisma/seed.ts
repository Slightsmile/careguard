import { PrismaClient } from "@prisma/client";
import { config } from "../src/utils/config";

const prisma = new PrismaClient();

const apis = [
  { name: "PatientDataAPI", path: "/mock/patients" },
  { name: "AppointmentAPI", path: "/mock/appointments" },
  { name: "StaffAPI", path: "/mock/staff" },
  { name: "BillingAPI", path: "/mock/billing" },
];

async function main() {
  for (const api of apis) {
    await prisma.monitoredAPI.upsert({
      where: { name: api.name },
      update: {},
      create: {
        name: api.name,
        url: `${config.backendBaseUrl}${api.path}`,
        method: "GET",
        enabled: true,
        responseTimeThreshold: config.monitoring.defaultResponseTimeThresholdMs,
      },
    });
  }
  console.log(`Seeded ${apis.length} monitored APIs.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
