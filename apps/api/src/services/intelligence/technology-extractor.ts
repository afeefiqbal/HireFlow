/**
 * HIREflow V4 - Technology Extractor
 * Extracts technologies and attributes them with requirement status (REQUIRED vs OPTIONAL) and source evidence.
 */

import { TechnologyEvidenceItem } from '@ai-job-agent/shared';
import { JobNormalizer } from './job-normalizer';

export class TechnologyExtractor {
  private static readonly KNOWN_TECH = [
    'PHP',
    'Laravel',
    'Node.js',
    'Express.js',
    'Vue.js',
    'React',
    'TypeScript',
    'JavaScript',
    'MySQL',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'Docker',
    'Kubernetes',
    'AWS',
    'Git',
    'REST APIs',
    'GraphQL',
    'Tailwind CSS',
    'CI/CD',
    'Symfony',
    'Python',
    'Django',
    'Go',
  ];

  /**
   * Extracts technologies and tags with evidence, requirement status, source, and confidence.
   */
  static extract(title: string, description: string = '', rawTechStack: string[] = []): TechnologyEvidenceItem[] {
    const evidenceItems: TechnologyEvidenceItem[] = [];
    const seenTech = new Set<string>();

    const sentences = description
      .replace(/<[^>]+>/g, ' ')
      .split(/(?<=[.!?\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    // 1. Check title for primary core technologies (Highest confidence REQUIRED)
    for (const tech of this.KNOWN_TECH) {
      const escaped = tech.replace('.', '\\.');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(title)) {
        const canonical = JobNormalizer.normalizeTechnology(tech);
        if (!seenTech.has(canonical)) {
          seenTech.add(canonical);
          evidenceItems.push({
            technology: canonical,
            status: 'REQUIRED',
            evidence: `Mentioned in role title: "${title}"`,
            source: 'TITLE',
            confidence: 'HIGH',
          });
        }
      }
    }

    // 2. Scan sentences for explicit required vs optional signals and section headers
    const optionalPatterns = [
      /\b(is a plus|nice to have|bonus|optional|advantageous|good to have|preferred|beneficial|would be great)\b/i,
    ];

    const requiredPatterns = [
      /\b(\d+\+?\s*years?|must have|proven experience|strong proficiency|proficiency in|deep understanding of|expert in|hands-on experience with|solid experience)\b/i,
    ];

    let currentSectionStatus: 'REQUIRED' | 'OPTIONAL' = 'REQUIRED';

    for (const sentence of sentences) {
      if (optionalPatterns.some((p) => p.test(sentence))) {
        currentSectionStatus = 'OPTIONAL';
      } else if (
        /\b(required|requirements|what you bring|must have|qualifications|about you)\b/i.test(sentence) &&
        !optionalPatterns.some((p) => p.test(sentence))
      ) {
        currentSectionStatus = 'REQUIRED';
      }

      for (const tech of this.KNOWN_TECH) {
        const escaped = tech.replace('.', '\\.');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');

        if (regex.test(sentence)) {
          const canonical = JobNormalizer.normalizeTechnology(tech);
          const isSentenceOptional = optionalPatterns.some((p) => p.test(sentence));
          const isRequired = requiredPatterns.some((p) => p.test(sentence));

          const status: 'REQUIRED' | 'OPTIONAL' =
            isSentenceOptional || (currentSectionStatus === 'OPTIONAL' && !isRequired) ? 'OPTIONAL' : 'REQUIRED';

          if (!seenTech.has(canonical)) {
            seenTech.add(canonical);
            evidenceItems.push({
              technology: canonical,
              status,
              evidence: sentence.length > 180 ? `${sentence.slice(0, 177)}...` : sentence,
              source: 'JOB_DESCRIPTION',
              confidence: isRequired || isSentenceOptional ? 'HIGH' : 'MEDIUM',
            });
          } else {
            // Upgrade to REQUIRED if a previous entry was marked optional but this sentence explicitly requires it
            const existing = evidenceItems.find((e) => e.technology === canonical);
            if (existing && existing.status === 'OPTIONAL' && isRequired) {
              existing.status = 'REQUIRED';
              existing.evidence = sentence.length > 180 ? `${sentence.slice(0, 177)}...` : sentence;
              existing.confidence = 'HIGH';
            }
          }
        }
      }
    }

    // 3. Fallback check from rawTechStack (ATS tags)
    for (const raw of rawTechStack) {
      const canonical = JobNormalizer.normalizeTechnology(raw);
      if (canonical && !seenTech.has(canonical)) {
        seenTech.add(canonical);
        evidenceItems.push({
          technology: canonical,
          status: 'REQUIRED',
          evidence: `Categorized in ATS job tech stack: "${raw}"`,
          source: 'ATS_METADATA',
          confidence: 'MEDIUM',
        });
      }
    }

    return evidenceItems;
  }
}
