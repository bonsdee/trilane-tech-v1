-- Website revisions 1.1 --------------------------------------------------------
-- Each change only touches text that still matches the original wording, so
-- anything already edited in the admin is left alone.

-- Foundation Website timeline: the 10–14 business days start once all content
-- is in, which works out to about 3–5 weeks from kickoff.
UPDATE services
SET timeline = '10–14 business days after we receive all content',
    updated_at = now()
WHERE slug = 'foundation-website' AND timeline = '10–14 business days';

UPDATE services
SET summary = replace(summary,
        'Content is due within 10 business days of kickoff.',
        'Content is due within 10 business days of kickoff, and launch is about 3–5 weeks from kickoff.'),
    updated_at = now()
WHERE slug = 'foundation-website'
  AND summary LIKE '%Content is due within 10 business days of kickoff.%';

UPDATE faqs
SET answer = 'A Foundation Website takes 10–14 business days after we receive all content, which is about 3–5 weeks from kickoff. A Landing Page and a Website Optimization Sprint each take 5–7 business days.',
    updated_at = now()
WHERE question = 'How long does a project take?'
  AND answer = 'A Foundation Website takes 10–14 business days. A Landing Page and a Website Optimization Sprint each take 5–7 business days.';

-- "Not included" lists for the Landing Page and the Website Optimization Sprint.
INSERT INTO service_items (service_id, kind, text, display_order)
SELECT s.id, 'NOT_INCLUDED', v.text, v.ord
FROM services s
JOIN (VALUES
    ('landing-page', 'Copywriting ($150 per page)', 6),
    ('landing-page', 'Ad campaign setup', 7),
    ('landing-page', 'Extra pages', 8),
    ('landing-page', 'Hosting and domain fees. You pay for these directly, in your own accounts.', 9),
    ('website-optimization-sprint', 'Redesigns or new pages', 6),
    ('website-optimization-sprint', 'More than 5 content/page updates', 7),
    ('website-optimization-sprint', 'Advanced SEO', 8),
    ('website-optimization-sprint', 'Moving to a new host', 9),
    ('website-optimization-sprint', 'Hosting and domain fees. You pay for these directly, in your own accounts.', 10)
) AS v (slug, text, ord) ON v.slug = s.slug
WHERE NOT EXISTS (
    SELECT 1 FROM service_items i WHERE i.service_id = s.id AND i.kind = 'NOT_INCLUDED'
);

-- Payment terms and cancelling retainers, placed just before the currency FAQ.
UPDATE faqs SET display_order = 14, updated_at = now() WHERE question = 'What currency are your prices in?';

INSERT INTO faqs (question, answer, display_order, published)
SELECT 'What are your payment terms?',
       'We take a 50% deposit to start, which is non-refundable once work begins. The balance is due before launch. Retainers are billed monthly in advance, and transfer fees are covered by the client.',
       12, TRUE
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = 'What are your payment terms?');

INSERT INTO faqs (question, answer, display_order, published)
SELECT 'Can I cancel a retainer?',
       'Yes. Cancel anytime with 14 days'' notice before your next billing date.',
       13, TRUE
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = 'Can I cancel a retainer?');

-- The Skyline GT-R page is a portfolio piece, not client work: label it Concept.
UPDATE portfolio_projects
SET is_concept = TRUE, updated_at = now()
WHERE slug = 'skyline-gt-r-scroll-driven-tribute-concept';
