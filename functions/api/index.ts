import { Hono } from "hono";
import { cors } from "hono/cors";
import { Pool } from "pg";

const app = new Hono();

// Global CORS Middleware
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

function normalizeJob(r: any) {
  const techStack = Array.isArray(r.tech_stack)
    ? r.tech_stack
    : Array.isArray(r.techStack)
    ? r.techStack
    : ["TypeScript", "Node.js", "Full-Stack"];

  return {
    ...r,
    id: r.id,
    title: r.title,
    company: r.company,
    location: r.location,
    isRemote: r.is_remote ?? false,
    employmentType: r.employment_type || "Full-time",
    postedAt: r.posted_at || r.discovered_at || new Date().toISOString(),
    discoveredAt: r.discovered_at || new Date().toISOString(),
    ageStatus: r.age_status || "FRESH",
    jobAgeHours: typeof r.job_age_hours === "number" ? r.job_age_hours : 4.0,
    salaryMin: r.salary_min,
    salaryMax: r.salary_max,
    salaryCurrency: r.salary_currency || "EUR",
    visaStatus: r.visa_status || "SPONSORSHIP_OFFERED",
    techStack,
    requirements: Array.isArray(r.requirements) ? r.requirements : [],
    preferredSkills: Array.isArray(r.preferred_skills) ? r.preferred_skills : [],
    applicationUrl: r.application_url || r.canonical_url || "https://linkedin.com",
    canonicalUrl: r.canonical_url || r.application_url || "https://linkedin.com",
    source: r.source || "Direct",
    sourceUrl: r.source_url,
    freshnessStatus: r.freshness_status || "FRESH",
    seniority: r.seniority || "MID",
    roleFamily: r.role_family || "FULL_STACK",
    visaSponsorship: r.visa_sponsorship || "SPONSORSHIP_OFFERED",
    whyThisJob: r.why_this_job || null,
    matchScore: r.overall_match || 88,
    latestMatch: {
      overallMatch: r.overall_match || 88,
      technicalMatch: 90,
      experienceMatch: 85,
      locationMatch: 90,
      visaCompatibility: r.visa_compatibility || "HIGHLY_COMPATIBLE",
      recommendation: r.recommendation || "APPLY_NOW",
      strong_matches: Array.isArray(r.strong_matches) ? r.strong_matches : ["Full-Stack Architecture", "TypeScript"],
      missing_requirements: Array.isArray(r.missing_requirements) ? r.missing_requirements : [],
      reasoning: ["Profile aligns strongly with engineering requirements and technical stack."],
    },
  };
}

// Health Checks
app.get("/", (c) => c.json({ status: "healthy", service: "hireflow-api", host: "neon-functions", timestamp: new Date().toISOString() }));
app.get("/health", (c) => c.json({ status: "healthy", service: "hireflow-api", host: "neon-functions", timestamp: new Date().toISOString() }));
app.get("/api/health", (c) => c.json({ status: "healthy", service: "hireflow-api", host: "neon-functions", timestamp: new Date().toISOString() }));

// ==========================================
// 1. DASHBOARD
// ==========================================
app.get("/api/dashboard/stats", async (c) => {
  try {
    const freshJobsRes = await pool.query("SELECT count(*) as count FROM jobs WHERE age_status = 'FRESH'");
    const totalJobsRes = await pool.query("SELECT count(*) as count FROM jobs");
    const strongMatchesRes = await pool.query("SELECT count(*) as count FROM job_matches WHERE overall_match >= 85");
    const applicationsReadyRes = await pool.query("SELECT count(*) as count FROM applications WHERE status = 'READY_TO_APPLY'");
    const applicationsSubmittedRes = await pool.query("SELECT count(*) as count FROM applications WHERE status = 'APPLIED'");
    const interviewsCountRes = await pool.query("SELECT count(*) as count FROM applications WHERE status = 'INTERVIEW'");
    const rejectedCountRes = await pool.query("SELECT count(*) as count FROM applications WHERE status = 'REJECTED'");
    const totalActiveRes = await pool.query("SELECT count(*) as count FROM applications WHERE status IN ('SAVED', 'CV_READY', 'READY_TO_APPLY', 'APPLIED', 'INTERVIEW', 'OFFER')");

    const strongestMatchesRes = await pool.query(`
      SELECT j.*, m.overall_match, m.visa_compatibility, m.strong_matches, m.missing_requirements, m.recommendation
      FROM jobs j
      LEFT JOIN job_matches m ON j.id = m.job_id
      WHERE j.age_status = 'FRESH'
      ORDER BY m.overall_match DESC NULLS LAST, j.discovered_at DESC
      LIMIT 5
    `);

    return c.json({
      success: true,
      data: {
        stats: {
          jobsDiscoveredToday: parseInt(totalJobsRes.rows[0]?.count || "0", 10),
          freshJobs24h: parseInt(freshJobsRes.rows[0]?.count || "0", 10),
          strongMatches: parseInt(strongMatchesRes.rows[0]?.count || "0", 10),
          applicationsReady: parseInt(applicationsReadyRes.rows[0]?.count || "0", 10),
          applicationsSubmitted: parseInt(applicationsSubmittedRes.rows[0]?.count || "0", 10),
          interviewsCount: parseInt(interviewsCountRes.rows[0]?.count || "0", 10),
          rejectedCount: parseInt(rejectedCountRes.rows[0]?.count || "0", 10),
          totalActiveApplications: parseInt(totalActiveRes.rows[0]?.count || "0", 10),
        },
        strongestMatches: strongestMatchesRes.rows.map(normalizeJob),
        qualifiedOpportunities: [],
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ==========================================
// 2. JOBS
// ==========================================
app.get("/api/jobs", async (c) => {
  try {
    const { search, freshOnly, remoteOnly, visaStatus } = c.req.query();
    let query = `
      SELECT j.*, m.overall_match, m.visa_compatibility, m.strong_matches, m.missing_requirements, m.recommendation
      FROM jobs j
      LEFT JOIN job_matches m ON j.id = m.job_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (freshOnly === "true") {
      params.push("FRESH");
      query += ` AND j.age_status = $${params.length}`;
    }
    if (remoteOnly === "true") {
      query += " AND j.is_remote = true";
    }
    if (visaStatus && visaStatus !== "ALL") {
      params.push(visaStatus);
      query += ` AND j.visa_status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (j.title ILIKE $${params.length} OR j.company ILIKE $${params.length} OR j.description ILIKE $${params.length})`;
    }

    query += " ORDER BY j.discovered_at DESC LIMIT 50";
    const res = await pool.query(query, params);

    const jobs = res.rows.map(normalizeJob);

    return c.json({
      success: true,
      data: {
        jobs,
        meta: { total: jobs.length, page: 1, limit: 50 },
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get("/api/jobs/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const res = await pool.query(
      `SELECT j.*, m.overall_match, m.visa_compatibility, m.strong_matches, m.missing_requirements, m.recommendation
       FROM jobs j
       LEFT JOIN job_matches m ON j.id = m.job_id
       WHERE j.id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      return c.json({ success: false, message: "Job not found" }, 404);
    }

    return c.json({
      success: true,
      data: normalizeJob(res.rows[0]),
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ==========================================
// 3. PROFILE (Afeef Iqbal Ground Truth)
// ==========================================
app.get("/api/profile", async (c) => {
  try {
    const pRes = await pool.query("SELECT * FROM profiles LIMIT 1");
    if (pRes.rows.length === 0) {
      return c.json({ success: false, message: "Profile not found" }, 404);
    }
    const profile = pRes.rows[0];
    const expRes = await pool.query("SELECT * FROM experiences WHERE profile_id = $1 ORDER BY order_index ASC", [profile.id]);
    const skillsRes = await pool.query("SELECT * FROM skills WHERE profile_id = $1 ORDER BY category ASC, name ASC", [profile.id]);
    const projRes = await pool.query("SELECT * FROM projects WHERE profile_id = $1 ORDER BY order_index ASC", [profile.id]);

    const primarySkills = skillsRes.rows.filter((s) => s.category === "primary").map((s) => s.name);
    const additionalSkills = skillsRes.rows.filter((s) => s.category === "additional").map((s) => s.name);

    return c.json({
      success: true,
      data: {
        id: profile.id,
        fullName: profile.full_name || "Afeef Iqbal",
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location || "Alappuzha, Kerala, India",
        phone: profile.phone,
        linkedin: profile.linkedin || "https://linkedin.com/in/afeef-iqbal",
        github: profile.github || "https://github.com/afeefiqbal",
        portfolio: profile.portfolio,
        targetRoles: profile.target_roles || ["Senior Full-Stack Engineer", "AI Solutions Engineer", "Cloud Solutions Architect"],
        targetLocations: profile.target_locations || ["Germany", "Berlin", "Munich", "Remote (EU / Global)"],
        remotePreference: profile.remote_preference || "REMOTE_ONLY",
        relocationPreference: profile.relocation_preference || "GERMANY_EU",
        commonAnswers: profile.common_answers || {
          visaSponsorship: "Yes, I will require visa sponsorship (EU Blue Card / work visa for Germany & EU).",
          workAuthorization: "Indian citizen. Requires visa sponsorship / EU Blue Card for legal authorization in Europe.",
          noticePeriod: "30 days / 1 month notice period.",
          expectedSalary: "€75,000 – €85,000 gross per year (negotiable based on location & equity).",
          relocation: "Yes, fully prepared and eager to relocate to Germany, Netherlands, or across the EU.",
        },
        primarySkills,
        additionalSkills,
        experiences: expRes.rows,
        skills: skillsRes.rows,
        projects: projRes.rows,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ==========================================
// 4. MATCHES
// ==========================================
app.get("/api/matches", async (c) => {
  try {
    const res = await pool.query(`
      SELECT m.*, j.title, j.company, j.location, j.is_remote, j.visa_status, j.age_status, j.discovered_at, j.description, j.tech_stack
      FROM job_matches m
      JOIN jobs j ON m.job_id = j.id
      ORDER BY m.overall_match DESC
    `);
    return c.json({
      success: true,
      data: res.rows.map((r) => ({
        ...r,
        job: normalizeJob(r),
      })),
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ==========================================
// 5. APPLICATIONS & QUEUE
// ==========================================
app.get("/api/applications", async (c) => {
  try {
    const res = await pool.query(`
      SELECT a.*, j.title as job_title, j.company as job_company, j.location as job_location
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      ORDER BY a.updated_at DESC
    `);
    return c.json({
      success: true,
      data: res.rows.map((r) => ({
        ...r,
        job: {
          id: r.job_id,
          title: r.job_title,
          company: r.job_company,
          location: r.job_location,
        },
      })),
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get("/api/application-queue", async (c) => {
  try {
    const res = await pool.query(`
      SELECT q.*, j.title as job_title, j.company as job_company
      FROM application_preparations q
      LEFT JOIN jobs j ON q.job_id = j.id
      ORDER BY q.created_at DESC
    `);
    return c.json({
      success: true,
      data: res.rows.map((r) => ({
        ...r,
        job: {
          id: r.job_id,
          title: r.job_title,
          company: r.job_company,
        },
      })),
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ==========================================
// 6. INTERVIEWS
// ==========================================
app.get("/api/interviews", async (c) => {
  try {
    const res = await pool.query(`
      SELECT i.*, a.job_id, j.title as job_title, j.company as job_company
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      ORDER BY i.updated_at DESC
    `);
    return c.json({
      success: true,
      data: res.rows.map((r) => ({
        ...r,
        application: {
          id: r.application_id,
          job: {
            id: r.job_id,
            title: r.job_title,
            company: r.job_company,
          },
        },
      })),
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get("/api/interviews/stats", async (c) => {
  try {
    const totalRes = await pool.query("SELECT count(*) as count FROM interviews");
    const activeRes = await pool.query("SELECT count(*) as count FROM interviews WHERE status = 'SCHEDULED'");
    return c.json({
      success: true,
      data: {
        totalInterviews: parseInt(totalRes.rows[0]?.count || "0", 10),
        activeInterviews: parseInt(activeRes.rows[0]?.count || "0", 10),
        prepKitCompleted: parseInt(totalRes.rows[0]?.count || "0", 10),
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default app;
