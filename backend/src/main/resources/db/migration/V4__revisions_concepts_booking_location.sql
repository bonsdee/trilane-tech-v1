-- Website revisions 1.0 --------------------------------------------------------

-- Portfolio entries can be marked as concept work (built to show skills, not
-- for a client). The public site labels them clearly.
ALTER TABLE portfolio_projects ADD COLUMN is_concept BOOLEAN NOT NULL DEFAULT FALSE;

-- One shared booking page link, set from the admin Settings page. Empty means
-- the "Book a call" buttons stay hidden.
INSERT INTO site_settings (key, value) VALUES ('booking.url', '')
ON CONFLICT (key) DO NOTHING;

-- The pilot price is now offered only in outreach and proposals. Switch the
-- public offer off and hide its FAQ. Both can be turned back on in the admin.
UPDATE site_settings SET value = 'false', updated_at = now() WHERE key = 'pilot.enabled';
UPDATE faqs SET published = FALSE, updated_at = now() WHERE question = 'What is the pilot price?';

-- Where the team is and when to expect replies. Shown first in the FAQ.
INSERT INTO faqs (question, answer, display_order, published)
SELECT 'Where are you based, and when can we reach you?',
       'We''re based in Cebu, Philippines (GMT+8), and our working hours overlap with US mornings and Australian business hours. Most replies go out within one business day.',
       0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = 'Where are you based, and when can we reach you?');
