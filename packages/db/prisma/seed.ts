import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SYSTEM_TAGS = [
  { slug: 'wake-up',          name: 'Wake up',          color: '#EF9F27', icon: 'Sunrise',        defaultStrict: false, defaultStrictMode: 'warn'  as const, requiresLog: false, emailRemind: false },
  { slug: 'morning-routine',  name: 'Morning routine',  color: '#9FE1CB', icon: 'Wind',           defaultStrict: false, defaultStrictMode: 'warn'  as const, requiresLog: false, emailRemind: false },
  { slug: 'breakfast',        name: 'Breakfast',        color: '#F2A623', icon: 'Coffee',         defaultStrict: true,  defaultStrictMode: 'warn'  as const, requiresLog: true,  emailRemind: false },
  { slug: 'lunch',            name: 'Lunch',            color: '#F2A623', icon: 'UtensilsCrossed',defaultStrict: true,  defaultStrictMode: 'warn'  as const, requiresLog: true,  emailRemind: false },
  { slug: 'dinner',           name: 'Dinner',           color: '#F2A623', icon: 'Utensils',       defaultStrict: true,  defaultStrictMode: 'warn'  as const, requiresLog: true,  emailRemind: false },
  { slug: 'self-study',       name: 'Self study',       color: '#7F77DD', icon: 'BookOpen',       defaultStrict: true,  defaultStrictMode: 'hard'  as const, requiresLog: false, emailRemind: true  },
  { slug: 'college-school',   name: 'College / School', color: '#378ADD', icon: 'GraduationCap',  defaultStrict: true,  defaultStrictMode: 'hard'  as const, requiresLog: false, emailRemind: true  },
  { slug: 'gym',              name: 'Gym',              color: '#E24B4A', icon: 'Dumbbell',       defaultStrict: true,  defaultStrictMode: 'grace' as const, requiresLog: false, emailRemind: true  },
  { slug: 'workout',          name: 'Workout',          color: '#E24B4A', icon: 'Activity',       defaultStrict: true,  defaultStrictMode: 'grace' as const, requiresLog: false, emailRemind: true  },
  { slug: 'walk',             name: 'Walk',             color: '#639922', icon: 'Footprints',     defaultStrict: false, defaultStrictMode: 'warn'  as const, requiresLog: false, emailRemind: false },
  { slug: 'break',            name: 'Break',            color: '#1D9E75', icon: 'Coffee',         defaultStrict: false, defaultStrictMode: 'warn'  as const, requiresLog: false, emailRemind: false },
  { slug: 'work',             name: 'Work',             color: '#534AB7', icon: 'Briefcase',      defaultStrict: true,  defaultStrictMode: 'hard'  as const, requiresLog: false, emailRemind: true  },
  { slug: 'sleep',            name: 'Sleep',            color: '#3C3489', icon: 'Moon',           defaultStrict: false, defaultStrictMode: 'warn'  as const, requiresLog: false, emailRemind: false },
  { slug: 'meditation',       name: 'Meditation',       color: '#AFA9EC', icon: 'Smile',          defaultStrict: false, defaultStrictMode: 'grace' as const, requiresLog: false, emailRemind: false },
  { slug: 'reading',          name: 'Reading',          color: '#5DCAA5', icon: 'BookMarked',     defaultStrict: false, defaultStrictMode: 'warn'  as const, requiresLog: false, emailRemind: false },
  { slug: 'free-time',        name: 'Free time',        color: '#97C459', icon: 'Gamepad2',       defaultStrict: false, defaultStrictMode: 'warn'  as const, requiresLog: false, emailRemind: false },
]

async function main() {
  console.log('🌱 Seeding system interval tags...')

  for (const tag of SYSTEM_TAGS) {
    const { slug, ...data } = tag
    await prisma.intervalTag.upsert({
      where: { id: `system-${slug}` },
      update: { ...data, isSystem: true },
      create: { id: `system-${slug}`, ...data, isSystem: true },
    })
    process.stdout.write(`  ✓ ${tag.name}\n`)
  }

  console.log(`\n✅ Seeded ${SYSTEM_TAGS.length} system tags`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
