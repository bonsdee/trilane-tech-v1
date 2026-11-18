-- Starting content taken from the "Trilane Tech Packages" document.
-- Everything here is editable later in the admin dashboard.

-- One-time projects ---------------------------------------------------------
INSERT INTO services (slug, name, category, price, billing_period, regular_price, timeline, hours, summary, ideal_for, display_order, published)
VALUES
('foundation-website', 'Foundation Website', 'ONE_TIME', 2800.00, 'ONCE', NULL, '10–14 business days', NULL,
 'A custom 4–6 page website that gives your business a credible home online and a clear way for visitors to reach you. Content is due within 10 business days of kickoff. If it arrives later, the timeline pauses until it does, and the final payment is still due on the original launch date.',
 'Businesses with no website or a very basic one', 1, TRUE),
('landing-page', 'Landing Page', 'ONE_TIME', 1200.00, 'ONCE', NULL, '5–7 business days', NULL,
 'One focused page built to turn visitors from a campaign or a specific offer into leads.',
 'Ad campaigns, specific offers, or lead capture', 2, TRUE),
('website-optimization-sprint', 'Website Optimization Sprint', 'ONE_TIME', 800.00, 'ONCE', NULL, '5–7 business days', NULL,
 'A focused round of fixes that makes an existing site faster, easier to find and better at turning visitors into inquiries.',
 'Existing sites that need speed, SEO, or conversion fixes', 3, TRUE);

-- Ongoing retainers ---------------------------------------------------------
INSERT INTO services (slug, name, category, price, billing_period, regular_price, timeline, hours, summary, ideal_for, display_order, published)
VALUES
('website-care', 'Website Care', 'RETAINER', 200.00, 'MONTHLY', NULL, NULL, NULL,
 'Monthly maintenance that keeps your site secure, backed up and up to date.',
 'Anyone who wants the site maintained', 4, TRUE),
('operations-support-light', 'Operations Support — Light', 'RETAINER', 900.00, 'MONTHLY', NULL, NULL, 10,
 'Hands-on help with lead handling, so every inquiry gets a prompt reply and nothing slips through. Extra hours are $95/hour, only with your approval.',
 'Businesses that need basic lead handling', 5, TRUE),
('operations-support-standard', 'Operations Support — Standard', 'RETAINER', 1500.00, 'MONTHLY', NULL, NULL, 18,
 'Everything in Light, plus more active work to qualify, reach and follow up with prospects. Extra hours are $95/hour, only with your approval.',
 'Businesses that want more active support', 6, TRUE);

-- Bundles -------------------------------------------------------------------
INSERT INTO services (slug, name, category, price, billing_period, regular_price, timeline, hours, summary, ideal_for, display_order, published)
VALUES
('launch-bundle', 'Launch Bundle', 'BUNDLE', 3600.00, 'ONCE', 4600.00, NULL, NULL,
 'A Foundation Website plus 60 days of Operations Support — Light, our recommended first offer. After 60 days, Operations Support — Light continues at $900/month unless cancelled with 14 days'' notice. You can move up to the Full Pod Bundle at any time.',
 'Businesses that want a new website and help handling the leads it brings in', 7, TRUE),
('full-pod-bundle', 'Full Pod Bundle', 'BUNDLE', 1600.00, 'MONTHLY', 1700.00, NULL, NULL,
 'Website Care and Operations Support — Standard together as one ongoing monthly plan.',
 'Clients who want both the site maintained and operations handled long-term', 8, TRUE);

-- Inclusions and exclusions -------------------------------------------------
INSERT INTO service_items (service_id, kind, text, display_order)
SELECT s.id, v.kind, v.text, v.ord
FROM services s
JOIN (VALUES
  ('foundation-website', 'INCLUDED', 'Custom 4–6 page website (Home, About, Services, Contact + up to 2 additional pages)', 1),
  ('foundation-website', 'INCLUDED', 'Mobile-responsive design', 2),
  ('foundation-website', 'INCLUDED', 'Basic on-page SEO setup (titles, meta descriptions, headings, sitemap)', 3),
  ('foundation-website', 'INCLUDED', 'Contact form with email notifications', 4),
  ('foundation-website', 'INCLUDED', 'Google Analytics + Search Console setup', 5),
  ('foundation-website', 'INCLUDED', '2 rounds of revisions', 6),
  ('foundation-website', 'INCLUDED', '30-day post-launch support for minor fixes', 7),
  ('foundation-website', 'NOT_INCLUDED', 'Copywriting (you provide content, or add copywriting at $150 per page)', 8),
  ('foundation-website', 'NOT_INCLUDED', 'Advanced SEO', 9),
  ('foundation-website', 'NOT_INCLUDED', 'E-commerce', 10),
  ('foundation-website', 'NOT_INCLUDED', 'Ongoing updates after 30 days', 11),

  ('landing-page', 'INCLUDED', 'Single high-converting landing page', 1),
  ('landing-page', 'INCLUDED', 'Mobile-responsive design', 2),
  ('landing-page', 'INCLUDED', 'Form or booking integration', 3),
  ('landing-page', 'INCLUDED', 'Basic tracking setup', 4),
  ('landing-page', 'INCLUDED', '2 rounds of revisions', 5),

  ('website-optimization-sprint', 'INCLUDED', 'Speed and performance improvements', 1),
  ('website-optimization-sprint', 'INCLUDED', 'Basic on-page SEO fixes', 2),
  ('website-optimization-sprint', 'INCLUDED', 'Conversion improvements (CTAs, forms, layout tweaks)', 3),
  ('website-optimization-sprint', 'INCLUDED', 'Up to 5 content/page updates', 4),
  ('website-optimization-sprint', 'INCLUDED', 'Summary report of changes made', 5),

  ('website-care', 'INCLUDED', 'Uptime and security monitoring', 1),
  ('website-care', 'INCLUDED', 'Backups', 2),
  ('website-care', 'INCLUDED', 'Minor content updates (text, images, small edits — up to 1 hour)', 3),
  ('website-care', 'INCLUDED', 'Framework, dependency and security updates', 4),
  ('website-care', 'INCLUDED', 'Monthly performance check', 5),
  ('website-care', 'NOT_INCLUDED', 'Hosting and domain fees. You pay for these directly, in your own accounts.', 6),

  ('operations-support-light', 'INCLUDED', 'Lead triage and first-response drafting', 1),
  ('operations-support-light', 'INCLUDED', 'CRM updates and pipeline hygiene', 2),
  ('operations-support-light', 'INCLUDED', 'Appointment scheduling and confirmations', 3),
  ('operations-support-light', 'INCLUDED', 'Basic follow-up on inquiries', 4),
  ('operations-support-light', 'INCLUDED', 'Weekly summary of activity', 5),
  ('operations-support-light', 'NOT_INCLUDED', 'Software and data subscriptions, such as email sending tools, Apollo or CRM seats. You pay for these directly, in your own accounts.', 6),

  ('operations-support-standard', 'INCLUDED', 'Everything in Operations Support — Light', 1),
  ('operations-support-standard', 'INCLUDED', 'More proactive lead qualification', 2),
  ('operations-support-standard', 'INCLUDED', 'Outreach support (email or messaging sequences)', 3),
  ('operations-support-standard', 'INCLUDED', 'Prospect research assistance', 4),
  ('operations-support-standard', 'INCLUDED', 'Stronger pipeline management and reporting', 5),
  ('operations-support-standard', 'NOT_INCLUDED', 'Software and data subscriptions, such as email sending tools, Apollo or CRM seats. You pay for these directly, in your own accounts.', 6),

  ('launch-bundle', 'INCLUDED', 'Foundation Website', 1),
  ('launch-bundle', 'INCLUDED', '60 days of Operations Support — Light', 2),

  ('full-pod-bundle', 'INCLUDED', 'Website Care', 1),
  ('full-pod-bundle', 'INCLUDED', 'Operations Support — Standard', 2)
) AS v(slug, kind, text, ord) ON v.slug = s.slug;

-- Pilot offer for the Launch Bundle -------------------------------------------
INSERT INTO site_settings (key, value) VALUES
('pilot.enabled', 'true'),
('pilot.price', '2900.00'),
('pilot.spots_remaining', '5');

-- Team (names only; add positions, bios and photos in the dashboard) ----------
INSERT INTO team_members (full_name, position, bio, display_order, published) VALUES
('Jivonz', NULL, NULL, 1, TRUE),
('JL', NULL, NULL, 2, TRUE),
('Rusebel', NULL, NULL, 3, TRUE);

-- Starter FAQ entries, limited to facts stated in the packages document -------
INSERT INTO faqs (question, answer, display_order, published) VALUES
('How long does a project take?',
 'A Foundation Website takes 10–14 business days. A Landing Page and a Website Optimization Sprint each take 5–7 business days.', 1, TRUE),
('How many revisions are included?',
 'The Foundation Website and the Landing Page each include 2 rounds of revisions.', 2, TRUE),
('Do you write the content for my website?',
 'For the Foundation Website, you provide the content, or you can add copywriting at $150 per page.', 3, TRUE),
('What happens if my content is late?',
 'Content is due within 10 business days of kickoff. If it arrives later, the timeline pauses until it does, and the final payment is still due on the original launch date.', 4, TRUE),
('What support do I get after launch?',
 'The Foundation Website includes 30 days of post-launch support for minor fixes. After that, Website Care keeps the site monitored, backed up and updated for $200/month.', 5, TRUE),
('Are hosting and domain fees included?',
 'No. You pay for hosting and your domain directly, in your own accounts, so they always belong to you.', 6, TRUE),
('Are software subscriptions included in Operations Support?',
 'No. Software and data subscriptions, such as email sending tools, Apollo or CRM seats, are paid by you directly, in your own accounts.', 7, TRUE),
('What if I need more hours than my plan includes?',
 'Extra hours on Operations Support — Light and Standard are $95/hour, and we only use them with your approval.', 8, TRUE),
('What happens when the Launch Bundle''s 60 days end?',
 'Operations Support — Light continues at $900/month unless you cancel with 14 days'' notice. You can also move up to the Full Pod Bundle at any time.', 9, TRUE),
('Do you take on redesigns or larger sites?',
 'Yes. Redesigns and sites with 7 or more pages are quoted individually, starting at $3,400.', 10, TRUE),
('What is the pilot price?',
 'For our first few clients, the Launch Bundle is $2,900 instead of $3,600, in exchange for a short testimonial and permission to use the project as a case study.', 11, TRUE),
('What currency are your prices in?',
 'All prices are in US dollars.', 12, TRUE);
