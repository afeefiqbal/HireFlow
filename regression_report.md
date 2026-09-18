# AI Job Agent — Regression Test Report

**Generated**: 2026-09-17 06:23:16
**Mode**: Development
**Smart Model**: openai/gpt-oss-120b
**Fast Model**: openai/gpt-oss-20b

---

## Suite A: Context Builder (Deterministic — No LLM)

| Job | Task | Tokens | Status |
| :--- | :--- | :--- | :--- |
| Laravel Senior Backend Developer (m/w/d) | JOB_MATCHING | ~1368 | ✅ |
| Laravel Senior Backend Developer (m/w/d) | RESUME_GENERATION | ~2278 | ✅ |
| Laravel Senior Backend Developer (m/w/d) | COVER_LETTER | ~1368 | ✅ |
| Laravel Senior Backend Developer (m/w/d) | SCREENING_QUESTION | ~1368 | ✅ |
| Senior Backend Developer (Node.js) | JOB_MATCHING | ~1240 | ✅ |
| Senior Backend Developer (Node.js) | RESUME_GENERATION | ~2150 | ✅ |
| Senior Backend Developer (Node.js) | COVER_LETTER | ~1240 | ✅ |
| Senior Backend Developer (Node.js) | SCREENING_QUESTION | ~1240 | ✅ |
| Senior / Staff Fullstack Engineer | JOB_MATCHING | ~1287 | ✅ |
| Senior / Staff Fullstack Engineer | RESUME_GENERATION | ~2197 | ✅ |
| Senior / Staff Fullstack Engineer | COVER_LETTER | ~1287 | ✅ |
| Senior / Staff Fullstack Engineer | SCREENING_QUESTION | ~1287 | ✅ |
| Senior Professional Services Project Man | JOB_MATCHING | ~1175 | ✅ |
| Senior Professional Services Project Man | RESUME_GENERATION | ~2085 | ✅ |
| Senior Professional Services Project Man | COVER_LETTER | ~1175 | ✅ |
| Senior Professional Services Project Man | SCREENING_QUESTION | ~1175 | ✅ |

✅ **PASS** — All 16 context builds passed structural validation

---

## Suite F: Deterministic Fallback Validation (No LLM)

| Job | Tech Score | Rec | Missing | Status |
| :--- | :--- | :--- | :--- | :--- |
| Laravel Senior Backend Developer (m | 99 | APPLY | 0 | ✅ |
| Senior Backend Developer (Node.js) | 90 | APPLY | 0 | ✅ |
| Senior / Staff Fullstack Engineer | 67 | APPLY | 1 | ✅ |
| Senior Professional Services Projec | 78 | APPLY | 0 | ✅ |

✅ **PASS** — All 4 deterministic evaluations passed

---

## Suite B: Job Matching (20B model — 4-5 jobs)

| Job | Tech Score | Rec | Validation |
| :--- | :--- | :--- | :--- |
| Laravel Senior Backend Developer (m | 65 | REVIEW | ❌ hallucination detected |
| Senior Backend Developer (Node.js) | 65 | REVIEW | ✅  |
| Senior / Staff Fullstack Engineer | 70 | REVIEW | ✅  |
| Senior Professional Services Projec | 100 | SKIP | ✅  |

> **Token Budget** — Used: 10,000 / 200,000 — Remaining: 190,000

---

## Suite E: Screening Questions (20B model)

### Job: Laravel Senior Backend Developer (m/w/d) - Skaliere mit uns auf Millionen-Traffic

| Question | Source | Answer Preview | Valid |
| :--- | :--- | :--- | :--- |
| How many years of professional software developmen... | 🟢 AI | I have 7 years of professional software development experien... | ✅ |
| Describe your hands-on experience with relational ... | 🟡 User |  | ✅ |
| Will you now or in the future require visa sponsor... | 🟡 User |  | ✅ |
| What is your expected annual salary for this role? | 🟡 User |  | ✅ |
| What is your current notice period or earliest ava... | 🟡 User |  | ✅ |

✅ **PASS** — All 5 screening answers passed validation
### Job: Senior Backend Developer (Node.js)

| Question | Source | Answer Preview | Valid |
| :--- | :--- | :--- | :--- |
| How many years of professional software developmen... | 🟢 AI | I have 7 years of professional software development experien... | ✅ |
| Describe your hands-on experience with relational ... | 🟡 User |  | ✅ |
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
| Projects Count | 3 |
| Hallucination Check | ✅ Clean |

✅ **PASS** — Resume for "Laravel Senior Backend Developer (m/w/d) - Skaliere mit uns auf Millionen-Traffic" passed all checks
### Job: Senior Backend Developer (Node.js) at OmniCloud Labs

| Check | Result |
| :--- | :--- |
| Has Experiences | ✅ |
| Has Skills | ✅ |
| Has Summary | ✅ |
| Projects Count | 1 |
| Hallucination Check | ✅ Clean |

✅ **PASS** — Resume for "Senior Backend Developer (Node.js)" passed all checks
> **Token Budget** — Used: 25,000 / 200,000 — Remaining: 175,000

---

## Suite D: Cover Letter (production model — 1-2 jobs)

### Job: Laravel Senior Backend Developer (m/w/d) - Skaliere mit uns auf Millionen-Traffic at Kettner Edelmetalle

| Check | Result |
| :--- | :--- |
| Has Opening | ✅ |
| Has Full Text | ✅ (1487 chars) |
| Hallucination Check | ❌ million |
| Tone Check | ✅ Professional |

❌ **FAIL** — Cover letter for "Laravel Senior Backend Developer (m/w/d) - Skaliere mit uns auf Millionen-Traffic" has issues
### Job: Senior Backend Developer (Node.js) at OmniCloud Labs

| Check | Result |
| :--- | :--- |
| Has Opening | ✅ |
| Has Full Text | ✅ (1141 chars) |
| Hallucination Check | ✅ Clean |
| Tone Check | ✅ Professional |

✅ **PASS** — Cover letter for "Senior Backend Developer (Node.js)" passed all checks
> **Token Budget** — Used: 33,000 / 200,000 — Remaining: 167,000

---

## Token Usage Summary

> **Token Budget** — Used: 33,000 / 200,000 — Remaining: 167,000
