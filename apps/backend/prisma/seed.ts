import 'dotenv/config';
import { TOKEN_PACKS } from '@vakiloncall/shared';
import { prisma } from '../src/utils/prisma';
import { logger } from '../src/utils/logger';
import { AppError } from '../src/utils/AppError';

type TokenPackSeed = {
  name: string;
  tokens: number;
  price_inr: number;
};

const seedPacks: TokenPackSeed[] = TOKEN_PACKS.map((pack) => ({
  name: pack.name,
  tokens: pack.tokens,
  price_inr: pack.price_inr,
}));

async function main(): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) {
      throw AppError.badRequest('VALIDATION_ERROR', 'Missing DATABASE_URL for seeding');
    }

    const packNames = seedPacks.map((pack) => pack.name);
    const existing = await prisma.tokenPack.findMany({
      where: { name: { in: packNames } },
      orderBy: { created_at: 'desc' },
    });

    const existingByName = new Map<string, typeof existing[number]>();
    for (const pack of existing) {
      if (!existingByName.has(pack.name)) {
        existingByName.set(pack.name, pack);
      }
    }

    let created = 0;
    let updated = 0;

    for (const pack of seedPacks) {
      const current = existingByName.get(pack.name);
      if (current) {
        await prisma.tokenPack.update({
          where: { id: current.id },
          data: {
            tokens: pack.tokens,
            price_inr: pack.price_inr,
            is_active: true,
          },
        });
        updated += 1;
      } else {
        await prisma.tokenPack.create({
          data: {
            name: pack.name,
            tokens: pack.tokens,
            price_inr: pack.price_inr,
            is_active: true,
          },
        });
        created += 1;
      }
    }

    logger.info({ created, updated }, 'Token packs seeded');
  } catch (error) {
    const appError = error instanceof AppError ? error : AppError.internal('Token pack seed failed');
    logger.error({ err: appError }, 'Seed error');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();