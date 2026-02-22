import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed file for Earn2Die server.
 * No demo accounts are pre-seeded — all players register via Firebase Auth.
 * To promote a player to admin, update their role in the database directly:
 *   npx prisma studio  →  find player  →  set role = "admin"
 */
async function main() {
  console.log('🌱 Earn2Die seed: no demo data to add. Accounts are created through Firebase Auth.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
