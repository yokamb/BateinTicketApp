import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Using 'any' for the export to bypass persistent build-time type synchronization issues 
// with generated Prisma models like RoleConfig, UserProfile, etc.
export const prisma: any = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
