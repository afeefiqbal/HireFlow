# n8n Automation Workflows for AI Job Agent

This directory contains scheduled workflows to automate job discovery from public endpoints (Greenhouse, Lever, Ashby, and remote feeds).

## How to Import
1. Access your running n8n instance (e.g., `http://localhost:5678`).
2. Navigate to **Workflows** > **Import from File**.
3. Select `n8n/workflows/job-discovery-polling.json`.
4. Configure your environment credentials or API access token if changed from default.
5. Activate the workflow for hourly polling.
