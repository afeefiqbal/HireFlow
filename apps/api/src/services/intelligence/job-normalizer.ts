/**
 * HIREflow V4 - Job Normalization Service
 * Deterministic normalization for companies, job titles, and technologies.
 * Preserves original source text for full provenance.
 */

export class JobNormalizer {
  /**
   * Common legal/entity suffixes to strip from company names
   */
  private static readonly COMPANY_SUFFIXES = [
    /(?:,\s*|\s+)(gmbh\s*&\s*co\.?\s*kg|gmbh\s*&\s*co|gmbh|ag|se|b\.?v\.?|inc\.?|llc|ltd\.?|limited|corp\.?|corporation|co\.?|holding|holdings|group|systems|technologies|solutions|labs)\b\.?/gi,
  ];

  /**
   * Common noise and boilerplate in job titles
   */
  private static readonly TITLE_NOISE = [
    /\s*\((m\/w\/d|f\/m\/d|w\/m\/d|d\/m\/w|all genders|m\/f\/d|m\/w|f\/m)\)/gi,
    /\s*\[(remote|hybrid|onsite|full-?time|part-?time)\]/gi,
    /\s*\((remote|hybrid|onsite|full-?time|part-?time|telecommute|100%\s*remote|berlin|munich|amsterdam|london|germany|europe|worldwide)\)/gi,
    /\s*-\s*(remote|hybrid|onsite|full-?time|part-?time|germany|europe|urgent|urgently hiring|immediate start)\s*$/gi,
    /\s*[-/|•]\s*(urgent|urgently hiring|immediate start|hiring now)\b/gi,
    /\b(urgent|urgently hiring|immediate start)\b/gi,
  ];

  /**
   * Known technology alias dictionary -> Canonical standard name
   */
  private static readonly TECH_ALIASES: Record<string, string> = {
    // Node.js
    node: 'Node.js',
    nodejs: 'Node.js',
    'node.js': 'Node.js',
    'node js': 'Node.js',

    // PHP
    php: 'PHP',
    'php 8': 'PHP',
    'php 8.x': 'PHP',
    'php 8.1': 'PHP',
    'php 8.2': 'PHP',
    'php 8.3': 'PHP',
    'php 7': 'PHP',
    'php7': 'PHP',
    'php8': 'PHP',

    // Laravel
    laravel: 'Laravel',
    'laravel framework': 'Laravel',
    'laravel 9': 'Laravel',
    'laravel 10': 'Laravel',
    'laravel 11': 'Laravel',

    // Vue
    vue: 'Vue.js',
    vuejs: 'Vue.js',
    'vue.js': 'Vue.js',
    'vue 2': 'Vue.js',
    'vue 3': 'Vue.js',
    'vue js': 'Vue.js',

    // React
    react: 'React',
    reactjs: 'React',
    'react.js': 'React',
    'react js': 'React',
    'react native': 'React Native',

    // TypeScript / JavaScript
    typescript: 'TypeScript',
    ts: 'TypeScript',
    javascript: 'JavaScript',
    js: 'JavaScript',
    es6: 'JavaScript',

    // Databases
    postgres: 'PostgreSQL',
    postgresql: 'PostgreSQL',
    'postgres sql': 'PostgreSQL',
    mysql: 'MySQL',
    mariadb: 'MariaDB',
    mongodb: 'MongoDB',
    mongo: 'MongoDB',
    redis: 'Redis',

    // Cloud & DevOps
    aws: 'AWS',
    'amazon web services': 'AWS',
    docker: 'Docker',
    kubernetes: 'Kubernetes',
    k8s: 'Kubernetes',
    git: 'Git',
    github: 'GitHub',
    gitlab: 'GitLab',
    'ci/cd': 'CI/CD',
    cicd: 'CI/CD',
    terraform: 'Terraform',

    // API & Architectures
    'rest api': 'REST APIs',
    'rest apis': 'REST APIs',
    rest: 'REST APIs',
    restful: 'REST APIs',
    graphql: 'GraphQL',
    microservices: 'Microservices',

    // Other Frameworks & Languages
    express: 'Express.js',
    'express.js': 'Express.js',
    expressjs: 'Express.js',
    tailwind: 'Tailwind CSS',
    tailwindcss: 'Tailwind CSS',
    symfony: 'Symfony',
    python: 'Python',
    django: 'Django',
    golang: 'Go',
    go: 'Go',
  };

  /**
   * Normalizes company name: strips legal entities, trims whitespace, standardizes case.
   */
  static normalizeCompany(raw: string): string {
    if (!raw) return '';
    let cleaned = raw.trim();

    for (const pattern of this.COMPANY_SUFFIXES) {
      cleaned = cleaned.replace(pattern, '');
    }

    cleaned = cleaned.replace(/\s+/g, ' ').replace(/[,.-]+$/, '').trim();
    if (!cleaned) return raw.trim();

    // Title case if all lowercase or weirdly capitalized
    if (cleaned === cleaned.toLowerCase() || cleaned === cleaned.toUpperCase()) {
      return cleaned
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }

    return cleaned;
  }

  /**
   * Normalizes location to primary city / region token
   * e.g. "Berlin, Germany" -> "Berlin", "Remote - EMEA" -> "Remote"
   */
  static normalizeLocation(raw: string): string {
    if (!raw) return '';
    const cleaned = raw.trim();
    const parts = cleaned.split(/[,/|]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[0];
    }
    return cleaned;
  }

  /**
   * Normalizes job title: strips boilerplate markers, trims, standardizes title.
   */
  static normalizeTitle(raw: string): string {
    if (!raw) return '';
    let cleaned = raw.trim();

    for (const pattern of this.TITLE_NOISE) {
      cleaned = cleaned.replace(pattern, '');
    }

    cleaned = cleaned.replace(/\s+/g, ' ').replace(/^[-/|•:]\s*/, '').replace(/\s*[-/|•:]$/, '').trim();
    return cleaned || raw.trim();
  }

  /**
   * Normalizes a single technology name to its canonical version if matched in dictionary.
   */
  static normalizeTechnology(raw: string): string {
    if (!raw) return '';
    const trimmed = raw.trim();
    const lower = trimmed.toLowerCase();

    if (this.TECH_ALIASES[lower]) {
      return this.TECH_ALIASES[lower];
    }

    // Strip version suffixes like "Laravel 11" or "PHP 8.3" if not explicitly in table
    const versionMatch = lower.match(/^([a-z0-9._\- ]+?)\s+v?\d+(?:\.\d+)*(?:\.x)?$/i);
    if (versionMatch && this.TECH_ALIASES[versionMatch[1].trim()]) {
      return this.TECH_ALIASES[versionMatch[1].trim()];
    }

    return trimmed;
  }

  /**
   * Normalizes a list of technology tags and deduplicates canonical items.
   */
  static normalizeTechnologies(techs: string[]): string[] {
    if (!Array.isArray(techs)) return [];
    const normalizedSet = new Set<string>();

    for (const t of techs) {
      const norm = this.normalizeTechnology(t);
      if (norm) {
        normalizedSet.add(norm);
      }
    }

    return Array.from(normalizedSet);
  }
}
