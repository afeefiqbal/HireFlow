import { PrismaClient, VisaStatus, JobAgeStatus, ApplicationStatus, VisaCompatibility, RecommendationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AI Job Agent database seed for Afeef Iqbal...');

  // 1. Clean existing records safely
  await prisma.applicationEvent.deleteMany();
  await prisma.applicationAnswer.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jobMatch.deleteMany();
  await prisma.job.deleteMany();
  await prisma.jobSource.deleteMany();
  await prisma.coverLetter.deleteMany();
  await prisma.resumeVersion.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.project.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create User & Master Candidate Profile
  const user = await prisma.user.create({
    data: {
      email: 'afeef.iqbal@example.com',
      fullName: 'Afeef Iqbal',
      profile: {
        create: {
          fullName: 'Afeef Iqbal',
          headline: 'Full-Stack Developer | Laravel, PHP, Node.js, Vue.js',
          yearsOfExperience: 7,
          targetRoles: [
            'Senior Laravel Developer',
            'Senior PHP Developer',
            'Full Stack Developer',
            'Backend Developer',
            'Node.js Developer',
          ],
          targetLocations: [
            'Germany',
            'Netherlands',
            'Europe',
            'Worldwide Remote',
          ],
          remotePreference: 'preferred',
          relocationPreference: 'preferred',
          visaSponsorshipRequired: true,
          hasKnownCareerGap: true,
          careerGapDescription:
            'Independent gap period between Aug 2024 and Jul 2025. Preserved as an uninvented career break / independent learning period.',
        },
      },
    },
    include: { profile: true },
  });

  const profileId = user.profile!.id;

  // 3. Seed Verified Employment History (Source of Truth)
  // Crabviz: Dec 2018 – Sep 2020
  // D5N Digital: Dec 2020 – Jul 2022
  // Pentacodes: Jul 2022 – Jun 2023
  // Lilac Infotech: Jul 2023 – Aug 2024
  // Pixbit Solutions: Jul 2025 – Present
  // Gap strictly preserved between Aug 2024 and Jul 2025!
  console.log('📄 Seeding verified employment history (5 companies, preserved gap)...');
  await prisma.experience.createMany({
    data: [
      {
        profileId,
        company: 'Crabviz Private Limited',
        role: 'Software Engineer',
        startDate: 'Dec 2018',
        endDate: 'Sep 2020',
        isCurrent: false,
        technologies: ['PHP', 'Laravel', 'MySQL', 'REST APIs', 'Git'],
        description:
          'Engineered backend services and RESTful APIs with Laravel and MySQL. Optimized database schema queries and implemented customer onboarding flows.',
        orderIndex: 1,
      },
      {
        profileId,
        company: 'D5N Digital',
        role: 'Software Developer',
        startDate: 'Dec 2020',
        endDate: 'Jul 2022',
        isCurrent: false,
        technologies: ['PHP', 'Laravel', 'Vue.js', 'MySQL', 'JavaScript', 'REST APIs'],
        description:
          'Built full-stack applications with Laravel backend and Vue.js frontends. Integrated multiple third-party payment gateways and external CRM endpoints.',
        orderIndex: 2,
      },
      {
        profileId,
        company: 'Pentacodes',
        role: 'Software Developer',
        startDate: 'Jul 2022',
        endDate: 'Jun 2023',
        isCurrent: false,
        technologies: ['Laravel', 'PHP', 'Node.js', 'MySQL', 'Docker', 'REST APIs'],
        description:
          'Architected high-throughput REST APIs and webhook ingestion pipelines. Dockerized services and contributed to backend reliability improvements.',
        orderIndex: 3,
      },
      {
        profileId,
        company: 'Lilac Infotech Pvt. Ltd.',
        role: 'Software Engineer',
        startDate: 'Jul 2023',
        endDate: 'Aug 2024',
        isCurrent: false,
        technologies: ['PHP', 'Laravel', 'Node.js', 'Express.js', 'Vue.js', 'PostgreSQL', 'AWS'],
        description:
          'Designed scalable microservices and modular monolithic applications. Handled complex business logic, database migrations, and AWS deployment automation.',
        orderIndex: 4,
      },
      {
        profileId,
        company: 'Pixbit Solutions',
        role: 'Senior Software Developer',
        startDate: 'Jul 2025',
        endDate: null,
        isCurrent: true,
        technologies: ['Laravel', 'PHP', 'Node.js', 'Vue.js', 'React', 'Docker', 'PostgreSQL', 'AWS'],
        description:
          'Lead developer overseeing full-stack architectural design, code reviews, and high-performance system delivery across modern Laravel and Node.js ecosystems.',
        orderIndex: 5,
      },
    ],
  });

  // 4. Seed Verified Skills
  console.log('⚡ Seeding verified skills taxonomy...');
  const primarySkills = ['PHP', 'Laravel', 'MySQL', 'REST APIs'];
  const additionalSkills = [
    'Node.js',
    'Express.js',
    'Vue.js',
    'React',
    'PostgreSQL',
    'MongoDB',
    'AWS',
    'Docker',
    'Git',
  ];

  await prisma.skill.createMany({
    data: [
      ...primarySkills.map((s) => ({
        profileId,
        name: s,
        category: 'primary',
        level: 'expert',
      })),
      ...additionalSkills.map((s) => ({
        profileId,
        name: s,
        category: 'additional',
        level: 'advanced',
      })),
    ],
  });

  // 5. Seed Verified Projects
  console.log('🚀 Seeding verified projects...');
  await prisma.project.createMany({
    data: [
      {
        profileId,
        title: 'DealCode',
        description:
          'Enterprise deal management and code verification platform built with a high-performance Node.js backend, React user interface, PostgreSQL database, and AWS hosting.',
        technologies: ['Node.js', 'React', 'PostgreSQL', 'AWS'],
        verified: true,
        orderIndex: 1,
      },
      {
        profileId,
        title: 'Artemyst',
        description:
          'Comprehensive e-commerce and digital commerce engine featuring custom payment gateways, real-time AJAX checkout interactions, and scalable Laravel architecture.',
        technologies: ['Laravel', 'PHP', 'AJAX', 'E-commerce', 'Payments'],
        verified: true,
        orderIndex: 2,
      },
      {
        profileId,
        title: 'Samasta',
        description:
          'Modern full-stack web application designed with a robust Laravel REST API backend seamlessly reactive with a dynamic Vue.js front-end experience.',
        technologies: ['Laravel', 'Vue.js'],
        verified: true,
        orderIndex: 3,
      },
    ],
  });

  // 6. Seed Job Sources
  const greenhouseSource = await prisma.jobSource.create({
    data: {
      name: 'Greenhouse Public Board',
      adapterType: 'greenhouse',
      endpointUrl: 'https://boards-api.greenhouse.io',
      isActive: true,
      lastPolled: new Date(),
    },
  });

  const leverSource = await prisma.jobSource.create({
    data: {
      name: 'Lever Job Board',
      adapterType: 'lever',
      endpointUrl: 'https://api.lever.co/v0/postings',
      isActive: true,
      lastPolled: new Date(),
    },
  });

  const remoteSource = await prisma.jobSource.create({
    data: {
      name: 'EU Remote Tech Feed',
      adapterType: 'remote_rss',
      endpointUrl: 'https://remoteok.com/api',
      isActive: true,
      lastPolled: new Date(),
    },
  });

  // 7. Seed Jobs (Realistically timed: Fresh < 24h, and Older > 24h for filter testing)
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  console.log('💼 Seeding realistic jobs (<24h fresh and >24h older)...');

  // Job 1: Strong Laravel match in Germany (posted 4 hours ago)
  const job1 = await prisma.job.create({
    data: {
      sourceId: greenhouseSource.id,
      title: 'Senior Laravel Developer',
      company: 'PayFlow Technologies GmbH',
      location: 'Berlin, Germany · Remote',
      isRemote: true,
      employmentType: 'Full-time',
      postedAt: hoursAgo(4),
      discoveredAt: hoursAgo(3.5),
      jobAgeHours: 4.0,
      ageStatus: JobAgeStatus.FRESH,
      salaryMin: 65000,
      salaryMax: 78000,
      salaryCurrency: 'EUR',
      visaStatus: VisaStatus.NOT_STATED,
      experienceRequired: '5+ years',
      techStack: ['PHP', 'Laravel', 'Vue.js', 'MySQL', 'Docker', 'AWS'],
      description:
        'PayFlow is seeking a Senior Laravel Developer to drive the architecture of our core transaction processing engine. You will build and scale RESTful APIs, optimize Eloquent queries, and collaborate closely with our Vue.js frontend engineers.',
      requirements: [
        '5+ years of professional backend development with PHP and Laravel',
        'Demonstrated expertise designing secure RESTful APIs',
        'Strong knowledge of MySQL database indexing and query optimization',
        'Hands-on experience with Vue.js or modern front-end frameworks',
        'Familiarity with Docker and AWS container workflows',
      ],
      preferredSkills: ['Redis', 'CI/CD Pipelines', 'Automated Testing with Pest/PHPUnit'],
      applicationUrl: 'https://job-boards.greenhouse.io/wikimedia',
      canonicalUrl: 'https://job-boards.greenhouse.io/wikimedia',
      source: 'Greenhouse Public Board',
    },
  });

  // Job 2: Strong Full Stack (Laravel + Vue) in Amsterdam (posted 7 hours ago)
  const job2 = await prisma.job.create({
    data: {
      sourceId: leverSource.id,
      title: 'Full Stack Developer (Laravel & Vue.js)',
      company: 'NorthSea Commerce B.V.',
      location: 'Amsterdam, Netherlands · Remote',
      isRemote: true,
      employmentType: 'Full-time',
      postedAt: hoursAgo(7),
      discoveredAt: hoursAgo(6),
      jobAgeHours: 7.0,
      ageStatus: JobAgeStatus.FRESH,
      salaryMin: 68000,
      salaryMax: 82000,
      salaryCurrency: 'EUR',
      visaStatus: VisaStatus.OFFERED,
      experienceRequired: '6+ years',
      techStack: ['Laravel', 'PHP', 'Vue.js', 'MySQL', 'REST APIs', 'Git'],
      description:
        'NorthSea Commerce connects merchants worldwide. We are looking for an experienced Full Stack Developer with deep Laravel and Vue.js capabilities to lead feature development on our flagship merchant portal. Visa sponsorship and relocation support provided for international talent.',
      requirements: [
        '6+ years of full-stack engineering with primary focus on Laravel and PHP',
        'Solid production experience building single page applications with Vue.js',
        'Deep understanding of MySQL performance and RESTful architectural principles',
        'Comfortable working in a distributed, remote-first European engineering team',
      ],
      preferredSkills: ['Tailwind CSS', 'Docker', 'Payment Gateway integrations'],
      applicationUrl: 'https://jobs.lever.co/kinsta',
      canonicalUrl: 'https://jobs.lever.co/kinsta',
      source: 'Lever Job Board',
    },
  });

  // Job 3: Backend Node.js / TypeScript in Worldwide Remote (posted 12 hours ago)
  const job3 = await prisma.job.create({
    data: {
      sourceId: remoteSource.id,
      title: 'Senior Backend Developer (Node.js)',
      company: 'OmniCloud Labs',
      location: 'Worldwide Remote',
      isRemote: true,
      employmentType: 'Full-time',
      postedAt: hoursAgo(12),
      discoveredAt: hoursAgo(11),
      jobAgeHours: 12.0,
      ageStatus: JobAgeStatus.FRESH,
      salaryMin: 75000,
      salaryMax: 90000,
      salaryCurrency: 'EUR',
      visaStatus: VisaStatus.NOT_OFFERED,
      experienceRequired: '5+ years',
      techStack: ['Node.js', 'Express.js', 'PostgreSQL', 'AWS', 'Docker', 'REST APIs'],
      description:
        'OmniCloud is expanding our cloud connectivity backend. We need a Senior Node.js Engineer with proven database modeling in PostgreSQL and cloud deployment background on AWS.',
      requirements: [
        '5+ years building backend services using Node.js and Express',
        'Proficiency with relational databases (PostgreSQL) and schema migrations',
        'Experience deploying containerized workloads using Docker and AWS',
        'Strong asynchronous programming and microservice architecture experience',
      ],
      preferredSkills: ['TypeScript', 'Redis caching', 'Kubernetes'],
      applicationUrl: 'https://jobs.ashbyhq.com/supabase',
      canonicalUrl: 'https://jobs.ashbyhq.com/supabase',
      source: 'EU Remote Tech Feed',
    },
  });

  // Job 4: Senior PHP Developer in Munich (posted 20 hours ago)
  const job4 = await prisma.job.create({
    data: {
      sourceId: greenhouseSource.id,
      title: 'Senior PHP / Symfony Developer',
      company: 'DataMetrics Munich',
      location: 'Munich, Germany · Remote',
      isRemote: true,
      employmentType: 'Full-time',
      postedAt: hoursAgo(20),
      discoveredAt: hoursAgo(18),
      jobAgeHours: 20.0,
      ageStatus: JobAgeStatus.FRESH,
      salaryMin: 60000,
      salaryMax: 74000,
      salaryCurrency: 'EUR',
      visaStatus: VisaStatus.OFFERED,
      experienceRequired: '7+ years',
      techStack: ['PHP', 'MySQL', 'Docker', 'REST APIs', 'Git'],
      description:
        'DataMetrics is seeking a Senior PHP engineer. While we use Symfony internally, deep modern PHP OOP fundamentals and database scaling experience are the primary criteria.',
      requirements: [
        '7+ years professional experience developing complex PHP backends',
        'High level of comfort with MySQL, REST APIs, and Docker development environments',
        'Fluent written and verbal English communication',
      ],
      preferredSkills: ['Symfony', 'Elasticsearch', 'CI/CD'],
      applicationUrl: 'https://job-boards.greenhouse.io/gitlab',
      canonicalUrl: 'https://job-boards.greenhouse.io/gitlab',
      source: 'Greenhouse Public Board',
    },
  });

  // Job 5: Older job (posted 3 days ago) to verify <24h filter
  const job5 = await prisma.job.create({
    data: {
      sourceId: remoteSource.id,
      title: 'Backend Engineer (PHP & Go)',
      company: 'LegacyMedia Ltd',
      location: 'London, UK · Remote',
      isRemote: true,
      employmentType: 'Full-time',
      postedAt: daysAgo(3),
      discoveredAt: daysAgo(3),
      jobAgeHours: 72.0,
      ageStatus: JobAgeStatus.OLDER,
      salaryMin: 55000,
      salaryMax: 65000,
      salaryCurrency: 'GBP',
      visaStatus: VisaStatus.NOT_OFFERED,
      experienceRequired: '4+ years',
      techStack: ['PHP', 'MySQL'],
      description: 'Older posting for a backend developer. Useful to verify strict 24-hour filtering.',
      requirements: ['4+ years PHP experience'],
      applicationUrl: 'https://jobs.ashbyhq.com/sentry',
      canonicalUrl: 'https://jobs.ashbyhq.com/sentry',
      source: 'EU Remote Tech Feed',
    },
  });

  // 8. Seed AI Matches for Fresh Jobs
  console.log('🧠 Seeding verified AI Match results...');

  // Match 1: 94% on PayFlow Senior Laravel
  await prisma.jobMatch.create({
    data: {
      jobId: job1.id,
      overallMatch: 94,
      technicalMatch: 96,
      experienceMatch: 95,
      locationMatch: 92,
      visaCompatibility: VisaCompatibility.unknown,
      strongMatches: ['PHP', 'Laravel', 'Vue.js', 'MySQL', 'Docker', 'AWS', 'REST APIs'],
      missingRequirements: [],
      concerns: ['Visa sponsorship is not explicitly stated in job post; remote work is supported across EU.'],
      reasoning: [
        'Candidate has 7+ years of professional full-stack development experience, comfortably exceeding the 5-year requirement.',
        'Primary technology stack (PHP, Laravel, MySQL, REST APIs) is a direct 100% match with core role requirements.',
        'Candidate has verified production experience with Vue.js (D5N Digital, Samasta) and AWS/Docker (Lilac Infotech, Pixbit Solutions).',
        'Role is based in Germany with remote support, directly aligning with candidate target locations (Germany/Europe).',
      ],
      recommendation: RecommendationType.APPLY,
    },
  });

  // Match 2: 96% on NorthSea Full Stack (Offers Visa!)
  await prisma.jobMatch.create({
    data: {
      jobId: job2.id,
      overallMatch: 96,
      technicalMatch: 98,
      experienceMatch: 95,
      locationMatch: 95,
      visaCompatibility: VisaCompatibility.compatible,
      strongMatches: ['Laravel', 'PHP', 'Vue.js', 'MySQL', 'REST APIs', 'Git'],
      missingRequirements: [],
      concerns: [],
      reasoning: [
        'Exceptional alignment: Candidate is a verified Full-Stack Developer with 7+ years specializing specifically in Laravel and Vue.js.',
        'Job explicitly offers Visa sponsorship and relocation to the Netherlands, fulfilling candidate relocation & visa criteria.',
        'Verified projects Artemyst (Laravel payments) and Samasta (Laravel + Vue.js) demonstrate exact production domain alignment.',
      ],
      recommendation: RecommendationType.APPLY,
    },
  });

  // Match 3: 88% on OmniCloud Node.js
  await prisma.jobMatch.create({
    data: {
      jobId: job3.id,
      overallMatch: 88,
      technicalMatch: 90,
      experienceMatch: 92,
      locationMatch: 85,
      visaCompatibility: VisaCompatibility.compatible,
      strongMatches: ['Node.js', 'Express.js', 'PostgreSQL', 'AWS', 'Docker', 'REST APIs'],
      missingRequirements: ['Kubernetes (preferred)'],
      concerns: ['Candidate primary core is Laravel/PHP, though verified project DealCode showcases extensive Node.js/PostgreSQL/AWS.'],
      reasoning: [
        'Candidate has solid Node.js, Express, PostgreSQL, and AWS background verified through DealCode and Lilac Infotech.',
        'Fully remote position worldwide suits candidate preferences perfectly.',
        '7+ years total experience exceeds the 5-year requirement.',
      ],
      recommendation: RecommendationType.APPLY,
    },
  });

  // 9. Seed Sample Applications for Tracking
  console.log('📊 Seeding application tracking pipeline...');
  const app1 = await prisma.application.create({
    data: {
      jobId: job2.id,
      status: ApplicationStatus.READY_TO_APPLY,
      applicationUrl: job2.applicationUrl,
      notes: 'Reviewed match analysis. Outstanding fit with Laravel + Vue.js and visa sponsorship offered.',
      interviewDates: [],
    },
  });

  await prisma.applicationEvent.createMany({
    data: [
      {
        applicationId: app1.id,
        fromStatus: null,
        toStatus: ApplicationStatus.DISCOVERED,
        note: 'Discovered from Lever Job Board',
      },
      {
        applicationId: app1.id,
        fromStatus: ApplicationStatus.DISCOVERED,
        toStatus: ApplicationStatus.MATCHED,
        note: 'AI Match evaluated at 96% (Strong Match)',
      },
      {
        applicationId: app1.id,
        fromStatus: ApplicationStatus.MATCHED,
        toStatus: ApplicationStatus.READY_TO_APPLY,
        note: 'Saved and ready for human review & submission',
      },
    ],
  });

  const app2 = await prisma.application.create({
    data: {
      jobId: job1.id,
      status: ApplicationStatus.SAVED,
      applicationUrl: job1.applicationUrl,
      notes: 'High priority German Laravel remote position.',
      interviewDates: [],
    },
  });

  await prisma.applicationEvent.createMany({
    data: [
      {
        applicationId: app2.id,
        fromStatus: null,
        toStatus: ApplicationStatus.DISCOVERED,
        note: 'Discovered from Greenhouse',
      },
      {
        applicationId: app2.id,
        fromStatus: ApplicationStatus.DISCOVERED,
        toStatus: ApplicationStatus.SAVED,
        note: 'Marked as saved for further inspection',
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
