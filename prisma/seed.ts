import { PrismaClient, VoiceName, AnchorSource } from "@prisma/client";
import { DEFAULT_CREATORS, DEFAULT_DROPS } from "../src/data.js";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  for (const c of DEFAULT_CREATORS) {
    await db.creator.upsert({
      where: { handle: c.handle },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        handle: c.handle,
        avatarUrl: c.avatarUrl,
        category: c.category,
        followersCount: c.followersCount,
        voiceName: c.voiceName as VoiceName,
        description: c.description,
        videoChannelContext: c.videoChannelContext,
        status: "PITCH",
      },
    });
  }

  for (const d of DEFAULT_DROPS) {
    await db.drop.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        creatorId: d.creatorId,
        title: d.title,
        content: d.content,
        voiceName: d.voiceName,
        category: d.category,
        dateSent: new Date(d.dateSent),
        tone: d.tone,
        isAdult: d.isAdult,
        anchorTitle: d.anchorTitle,
        anchorSource: d.anchorSource as AnchorSource,
        anchorLink: d.anchorLink,
        anchorTimeCode: d.anchorTimeCode,
        transcriptContext: d.transcriptContext,
        status: "SENT",
        sentAt: new Date(d.dateSent),
      },
    });
  }

  console.log(`Seeded ${DEFAULT_CREATORS.length} creators and ${DEFAULT_DROPS.length} drops`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
