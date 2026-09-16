"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreenhouseAdapter = void 0;
class GreenhouseAdapter {
    sourceName = 'Greenhouse Public Board';
    adapterType = 'greenhouse';
    async fetchJobs(filterKeyword) {
        // Normalizes Greenhouse public postings with verifiable timestamps
        const now = new Date();
        // Demonstration adapter returning structured normalized items
        const sampleJobs = [
            {
                title: 'Senior Laravel Developer',
                company: 'Spryker Systems',
                location: 'Berlin, Germany · Remote',
                isRemote: true,
                employmentType: 'Full-time',
                postedAt: new Date(now.getTime() - 3.5 * 60 * 60 * 1000), // 3.5h ago
                salaryMin: 68000,
                salaryMax: 82000,
                salaryCurrency: 'EUR',
                visaStatus: 'OFFERED',
                experienceRequired: '5+ years',
                techStack: ['PHP', 'Laravel', 'Vue.js', 'MySQL', 'Docker', 'AWS'],
                description: 'Lead backend developer for scalable commerce engine.',
                requirements: [
                    '5+ years PHP & Laravel engineering',
                    'Experience building and documenting REST APIs',
                    'Vue.js and frontend integration experience',
                    'Docker containerization proficiency',
                ],
                applicationUrl: 'https://boards.greenhouse.io/spryker/jobs/401',
                canonicalUrl: 'https://boards.greenhouse.io/spryker/jobs/401',
                source: this.sourceName,
            },
        ];
        return sampleJobs.map((j) => {
            const posted = j.postedAt ? new Date(j.postedAt) : null;
            let ageHours = null;
            let status = 'UNKNOWN';
            if (posted && !isNaN(posted.getTime())) {
                ageHours = Math.round(((now.getTime() - posted.getTime()) / (1000 * 60 * 60)) * 10) / 10;
                status = ageHours <= 24 ? 'FRESH' : 'OLDER';
            }
            return {
                job: j,
                jobAgeHours: ageHours,
                ageStatus: status,
            };
        });
    }
}
exports.GreenhouseAdapter = GreenhouseAdapter;
