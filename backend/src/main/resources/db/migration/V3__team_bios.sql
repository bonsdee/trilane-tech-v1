-- Team names, roles and bios supplied by the team.
-- Only updates the seeded profiles if they still have their original
-- first-name-only seed values, so edits made in the dashboard are never overwritten.

UPDATE team_members
SET full_name = 'Jivonz M. Dy',
    position  = 'Web Development & Frontend',
    bio       = 'Builds fast, responsive websites and user-centered interfaces, working with React and Vite, HTML and CSS, Figma-based UI/UX design, and AI-assisted development workflows.

Currently works on GoHighLevel funnels, sites and automation projects alongside custom web development. Previously handled frontend development and database planning during an IT internship, and ran freelance web projects.'
WHERE full_name = 'Jivonz' AND position IS NULL AND bio IS NULL;

UPDATE team_members
SET full_name = 'Jose Louis B. Enecio (JL)',
    position  = 'Lead Generation, CRM & Operations',
    bio       = 'Handles both outbound and operational work. At ChainPatrol, ran high-volume prospect outreach over chat, email and cold calls and researched target accounts, while also managing customer success and triage: responding to client requests, keeping conversations organized and escalating issues across multiple active accounts.

Earlier customer service roles built a habit of clear communication, careful documentation and structured follow-up.'
WHERE full_name = 'JL' AND position IS NULL AND bio IS NULL;

UPDATE team_members
SET full_name = 'Rusebel A. Biarcal',
    position  = 'Sales Admin, Outreach & Operational Support',
    bio       = 'Brings a strong background in operational support, CRM work, outreach and customer handling. Experience includes managing an eBay store and customer communications for an Australian retailer, sales development and outreach at ChainPatrol (proposals and meeting booking), executive assistance, and growth outreach roles covering email campaigns, lead nurturing and CRM tracking.

Comfortable with Notion, Google Workspace and a range of CRMs, plus the admin, follow-ups and process work that keep things moving.'
WHERE full_name = 'Rusebel' AND position IS NULL AND bio IS NULL;
