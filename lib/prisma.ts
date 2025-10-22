// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Add prisma to the NodeJS global type
// This helps prevent multiple instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma;