# AI Job Agent — Regression Test Report

**Generated**: 2026-09-17 11:04:16
**Mode**: Development
**Smart Model**: openai/gpt-oss-120b
**Fast Model**: openai/gpt-oss-20b

---

## Suite A: Context Builder (Deterministic — No LLM)

| Job | Task | Tokens | Status |
| :--- | :--- | :--- | :--- |
| Laravel Senior Backend Developer (m/w/d) | JOB_MATCHING | ~1621 | ✅ |
| Laravel Senior Backend Developer (m/w/d) | RESUME_GENERATION | ~2835 | ✅ |
| Laravel Senior Backend Developer (m/w/d) | COVER_LETTER | ~1621 | ✅ |
| Laravel Senior Backend Developer (m/w/d) | SCREENING_QUESTION | ~1621 | ✅ |
| Senior Node Engineer | JOB_MATCHING | ~1144 | ✅ |
| Senior Node Engineer | RESUME_GENERATION | ~2359 | ✅ |
| Senior Node Engineer | COVER_LETTER | ~1144 | ✅ |
| Senior Node Engineer | SCREENING_QUESTION | ~1144 | ✅ |
| Senior / Staff Fullstack Engineer | JOB_MATCHING | ~1640 | ✅ |
| Senior / Staff Fullstack Engineer | RESUME_GENERATION | ~2854 | ✅ |
| Senior / Staff Fullstack Engineer | COVER_LETTER | ~1640 | ✅ |
| Senior / Staff Fullstack Engineer | SCREENING_QUESTION | ~1640 | ✅ |
| Senior Professional Services Project Man | JOB_MATCHING | ~1230 | ✅ |
| Senior Professional Services Project Man | RESUME_GENERATION | ~2445 | ✅ |
| Senior Professional Services Project Man | COVER_LETTER | ~1230 | ✅ |
| Senior Professional Services Project Man | SCREENING_QUESTION | ~1230 | ✅ |

✅ **PASS** — All 16 context builds passed structural validation

---

## Suite F: Deterministic Fallback Validation (No LLM)

| Job | Tech Score | Rec | Missing | Status |
| :--- | :--- | :--- | :--- | :--- |
| Laravel Senior Backend Developer (m | 99 | APPLY | 0 | ✅ |
| Senior Node Engineer | 80 | REVIEW | 0 | ✅ |
| Senior / Staff Fullstack Engineer | 67 | APPLY | 1 | ✅ |
| Senior Professional Services Projec | 78 | APPLY | 0 | ✅ |

✅ **PASS** — All 4 deterministic evaluations passed

---

## Suite B: Job Matching (20B model — 4-5 jobs)

| Job | Tech Score | Rec | Validation |
| :--- | :--- | :--- | :--- |
| Laravel Senior Backend Developer (m | 75 | REVIEW | ✅  |
| Senior Node Engineer | 100 | APPLY | ✅  |
| Senior / Staff Fullstack Engineer | 60 | REVIEW | ✅  |
| Senior Professional Services Projec | 78 | APPLY | ✅  |

> **Token Budget** — Used: 10,000 / 200,000 — Remaining: 190,000

---

## Suite E: Screening Questions (20B model)

### Job: Laravel Senior Backend Developer (m/w/d) - Skaliere mit uns auf Millionen-Traffic

| Question | Source | Answer Preview | Valid |
| :--- | :--- | :--- | :--- |
| How many years of professional software developmen... | 🟢 AI | I have 8 years of professional software development experien... | ✅ |
| Describe your hands-on experience with relational ... | 🟢 AI | I have hands-on experience with MySQL and relational databas... | ✅ |
| Will you now or in the future require visa sponsor... | 🟡 User |  | ✅ |
| What is your expected annual salary for this role? | 🟡 User |  | ✅ |
| What is your current notice period or earliest ava... | 🟡 User |  | ✅ |

✅ **PASS** — All 5 screening answers passed validation
### Job: Senior Node Engineer

| Question | Source | Answer Preview | Valid |
| :--- | :--- | :--- | :--- |
| How many years of professional software developmen... | 🟢 AI | I have 8 years of professional software development experien... | ✅ |
| Describe your hands-on experience with relational ... | 🟢 AI | I have hands-on experience with MySQL and relational databas... | ✅ |
| Will you now or in the future require visa sponsor... | 🟡 User |  | ✅ |
| What is your expected annual salary for this role? | 🟡 User |  | ✅ |
| What is your current notice period or earliest ava... | 🟡 User |  | ✅ |

✅ **PASS** — All 5 screening answers passed validation
> **Token Budget** — Used: 15,000 / 200,000 — Remaining: 185,000

---

## Suite C: Resume Generation (120B model — 1-2 jobs)

### Job: Laravel Senior Backend Developer (m/w/d) - Skaliere mit uns auf Millionen-Traffic at Kettner Edelmetalle

| Check | Result |
| :--- | :--- |
| Has Experiences | ✅ |
| Has Skills | ✅ |
| Has Summary | ✅ |
| Projects Count | 0 |
| Hallucination Check | ✅ Clean |

✅ **PASS** — Resume for "Laravel Senior Backend Developer (m/w/d) - Skaliere mit uns auf Millionen-Traffic" passed all checks
### Job: Senior Node Engineer at TestCo_1789643016886

| Check | Result |
| :--- | :--- |
| Has Experiences | ✅ |
| Has Skills | ✅ |
| Has Summary | ✅ |
| Projects Count | 1 |
| Hallucination Check | ✅ Clean |

✅ **PASS** — Resume for "Senior Node Engineer" passed all checks
> **Token Budget** — Used: 25,000 / 200,000 — Remaining: 175,000

---

## Suite D: Cover Letter (production model — 1-2 jobs)

### Job: Laravel Senior Backend Developer (m/w/d) - Skaliere mit uns auf Millionen-Traffic at Kettner Edelmetalle

| Check | Result |
| :--- | :--- |
| Has Opening | ✅ |
| Has Full Text | ✅ (1582 chars) |
| Hallucination Check | ❌ million |
| Tone Check | ✅ Professional |

❌ **FAIL** — Cover letter for "Laravel Senior Backend Developer (m/w/d) - Skaliere mit uns auf Millionen-Traffic" has issues
### Job: Senior Node Engineer at TestCo_1789643016886

| Check | Result |
| :--- | :--- |
| Has Opening | ✅ |
| Has Full Text | ✅ (1216 chars) |
| Hallucination Check | ✅ Clean |
| Tone Check | ✅ Professional |

✅ **PASS** — Cover letter for "Senior Node Engineer" passed all checks
> **Token Budget** — Used: 33,000 / 200,000 — Remaining: 167,000

---

## Token Usage Summary

> **Token Budget** — Used: 33,000 / 200,000 — Remaining: 167,000
