// Load environment variables from .env file
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from project root
const envResult = config({ path: resolve(process.cwd(), '.env') });

// Also try .env.local (common in Next.js projects)
if (!envResult.parsed || !process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), '.env.local') });
}

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('  Error: DATABASE_URL environment variable not found!');
  console.error('  Please ensure you have a .env or .env.local file in the project root.');
  console.error('  The file should contain: DATABASE_URL="your-database-connection-string"');
  process.exit(1);
}

import { PrismaClient, LanguageName, Difficulty } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Type definition for snippet data from JSON files
type SnippetData = {
  topic: string;
  difficulty: Difficulty;
  content: string;
};

/**
 * Load snippets from JSON file for a given language
 */
function loadSnippets(language: LanguageName): SnippetData[] {
  // Use process.cwd() for better compatibility with different execution contexts
  const filePath = path.join(process.cwd(), 'prisma', 'seeds', `${language}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  No seed file found for ${language} at ${filePath}`);
    return [];
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const snippets = JSON.parse(fileContent) as SnippetData[];
    
    // Validate snippet structure
    return snippets.filter(snippet => {
      if (!snippet.topic || !snippet.content || !snippet.difficulty) {
        console.warn(`⚠️  Skipping invalid snippet in ${language}: missing required fields`);
        return false;
      }
      if (!Object.values(Difficulty).includes(snippet.difficulty)) {
        console.warn(`  Skipping snippet with invalid difficulty: ${snippet.difficulty}`);
        return false;
      }
      return true;
    });
  } catch (error) {
    console.error(` Error loading snippets for ${language}:`, error);
    return [];
  }
}

/**
 * Seed snippets for a single language
 * Uses transaction for atomicity and batch operations for performance
 */
async function seedLanguage(language: LanguageName) {
  const snippets = loadSnippets(language);
  
  if (snippets.length === 0) {
    console.log(`⏭  Skipping ${language} - no snippets to seed`);
    return 0;
  }

  console.log(`\n Seeding ${language} with ${snippets.length} snippets...`);

  try {
    // Use transaction for atomicity - all or nothing
    const result = await prisma.$transaction(async (tx) => {
      // Ensure language exists
      const languageRecord = await tx.language.upsert({
        where: { name: language },
        update: {},
        create: { name: language },
      });

      // Get unique topics from snippets
      const uniqueTopics = [...new Set(snippets.map(s => s.topic.toLowerCase()))];
      
      // Ensure all topics exist (batch upsert)
      const topicPromises = uniqueTopics.map(topicName =>
        tx.topic.upsert({
          where: { name: topicName },
          update: {},
          create: { name: topicName },
        })
      );
      
      const topicRecords = await Promise.all(topicPromises);
      const topicMap = new Map(topicRecords.map(t => [t.name.toLowerCase(), t.id]));

      // Group snippets by topic and difficulty for better organization
      const snippetsByTopic = new Map<string, SnippetData[]>();
      snippets.forEach(snippet => {
        const key = `${snippet.topic.toLowerCase()}_${snippet.difficulty}`;
        if (!snippetsByTopic.has(key)) {
          snippetsByTopic.set(key, []);
        }
        snippetsByTopic.get(key)!.push(snippet);
      });

      let insertedCount = 0;
      let skippedCount = 0;

      // Process snippets in batches (better performance for large datasets)
      const BATCH_SIZE = 50;
      const allSnippets = snippets.map(snippet => ({
        content: snippet.content,
        languageId: languageRecord.id,
        topicId: topicMap.get(snippet.topic.toLowerCase())!,
        difficulty: snippet.difficulty,
      }));

      // Insert in batches
      for (let i = 0; i < allSnippets.length; i += BATCH_SIZE) {
        const batch = allSnippets.slice(i, i + BATCH_SIZE);
        
        // Use createMany for better performance (but it doesn't support skipDuplicates in all DBs)
        // For PostgreSQL, we can use createMany with skipDuplicates
        // For other DBs or if we need to check duplicates, we'd use individual creates
        
        try {
          await tx.snippet.createMany({
            data: batch,
            skipDuplicates: true, // Skip if duplicate content exists
          });
          insertedCount += batch.length;
        } catch (error: any) {
          // If skipDuplicates doesn't work, try individual inserts
          if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
            // Handle duplicates individually
            for (const snippetData of batch) {
              try {
                await tx.snippet.create({ data: snippetData });
                insertedCount++;
              } catch (e: any) {
                if (e.code === 'P2002') {
                  skippedCount++;
                } else {
                  throw e;
                }
              }
            }
          } else {
            throw error;
          }
        }
      }

      return { insertedCount, skippedCount };
    }, {
      timeout: 30000, // 30 second timeout for large datasets
    });

    console.log(` ${language}: Inserted ${result.insertedCount}, Skipped ${result.skippedCount} duplicates`);
    return result.insertedCount;
  } catch (error) {
    console.error(` Error seeding ${language}:`, error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function main() {
  console.log(' Starting database seed...\n');

  try {
    const languages = Object.values(LanguageName);
    const results: { language: LanguageName; count: number }[] = [];

    // Seed each language sequentially to avoid overwhelming the database
    for (const language of languages) {
      const count = await seedLanguage(language);
      results.push({ language, count });
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(' Seed Summary:');
    console.log('='.repeat(50));
    
    const totalSnippets = results.reduce((sum, r) => sum + r.count, 0);
    
    results.forEach(({ language, count }) => {
      const status = count > 0 ? '' : '⏭';
      console.log(`${status} ${language.padEnd(15)} ${count.toString().padStart(4)} snippets`);
    });
    
    console.log('='.repeat(50));
    console.log(` Total: ${totalSnippets} snippets seeded successfully!\n`);
    
  } catch (error) {
    console.error('\n Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;

