
-- Seed engagement: fake auth users, profiles, reviews, location posts, rsvps
-- Idempotent via fixed UUIDs + ON CONFLICT.

-- 1) Create 24 seeded auth users
WITH seed AS (
  SELECT * FROM (VALUES
    ('11111111-0000-4000-8000-000000000001'::uuid,'maria.koch@kiez.demo','Maria Koch'),
    ('11111111-0000-4000-8000-000000000002'::uuid,'jonas.weber@kiez.demo','Jonas Weber'),
    ('11111111-0000-4000-8000-000000000003'::uuid,'ana.silva@kiez.demo','Ana Silva'),
    ('11111111-0000-4000-8000-000000000004'::uuid,'tarek.haddad@kiez.demo','Tarek Haddad'),
    ('11111111-0000-4000-8000-000000000005'::uuid,'lena.fischer@kiez.demo','Lena Fischer'),
    ('11111111-0000-4000-8000-000000000006'::uuid,'sofia.rossi@kiez.demo','Sofia Rossi'),
    ('11111111-0000-4000-8000-000000000007'::uuid,'david.cohen@kiez.demo','David Cohen'),
    ('11111111-0000-4000-8000-000000000008'::uuid,'priya.nair@kiez.demo','Priya Nair'),
    ('11111111-0000-4000-8000-000000000009'::uuid,'ola.nowak@kiez.demo','Ola Nowak'),
    ('11111111-0000-4000-8000-000000000010'::uuid,'felix.becker@kiez.demo','Felix Becker'),
    ('11111111-0000-4000-8000-000000000011'::uuid,'amelie.dubois@kiez.demo','Amélie Dubois'),
    ('11111111-0000-4000-8000-000000000012'::uuid,'kenji.tanaka@kiez.demo','Kenji Tanaka'),
    ('11111111-0000-4000-8000-000000000013'::uuid,'noor.alami@kiez.demo','Noor Alami'),
    ('11111111-0000-4000-8000-000000000014'::uuid,'lukas.schmidt@kiez.demo','Lukas Schmidt'),
    ('11111111-0000-4000-8000-000000000015'::uuid,'isabel.garcia@kiez.demo','Isabel García'),
    ('11111111-0000-4000-8000-000000000016'::uuid,'malik.diallo@kiez.demo','Malik Diallo'),
    ('11111111-0000-4000-8000-000000000017'::uuid,'hanna.virtanen@kiez.demo','Hanna Virtanen'),
    ('11111111-0000-4000-8000-000000000018'::uuid,'rafael.mendes@kiez.demo','Rafael Mendes'),
    ('11111111-0000-4000-8000-000000000019'::uuid,'mira.popescu@kiez.demo','Mira Popescu'),
    ('11111111-0000-4000-8000-000000000020'::uuid,'omar.farouk@kiez.demo','Omar Farouk'),
    ('11111111-0000-4000-8000-000000000021'::uuid,'ines.almeida@kiez.demo','Inês Almeida'),
    ('11111111-0000-4000-8000-000000000022'::uuid,'theo.hansen@kiez.demo','Theo Hansen'),
    ('11111111-0000-4000-8000-000000000023'::uuid,'yara.haddad@kiez.demo','Yara Haddad'),
    ('11111111-0000-4000-8000-000000000024'::uuid,'paul.lemoine@kiez.demo','Paul Lemoine')
  ) AS t(id, email, name)
)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT
  '00000000-0000-0000-0000-000000000000', s.id, 'authenticated','authenticated',
  s.email, crypt('seed-pw-' || s.id::text, gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', s.name),
  now() - (random()*interval '180 days'), now(),
  '','','',''
FROM seed s
ON CONFLICT (id) DO NOTHING;

-- 2) Profiles for those users
WITH seed AS (
  SELECT u.id, u.raw_user_meta_data->>'display_name' AS name
  FROM auth.users u
  WHERE u.email LIKE '%@kiez.demo'
), data AS (
  SELECT s.id, s.name,
    (ARRAY['Mitte','Kreuzberg','Neukölln','Prenzlauer Berg','Friedrichshain','Charlottenburg','Schöneberg','Wedding'])[1+floor(random()*8)::int] AS district,
    (ARRAY['founder','operator','engineer','designer','researcher','investor','operator'])[1+floor(random()*7)::int] AS role,
    (ARRAY['pre-seed','idea','seed','series-a','bootstrapped'])[1+floor(random()*5)::int] AS stage,
    (ARRAY['climate','fintech','health','ai','mobility','consumer','b2b saas','deeptech'])[1+floor(random()*8)::int] AS sector
  FROM seed s
)
INSERT INTO profiles (id, display_name, district, role, stage, sector, bio, avatar_url, background, looking_for, industries, interests, current_focus, created_at, updated_at)
SELECT d.id, d.name, d.district, d.role, d.stage, d.sector,
  'Building in ' || d.sector || ' from ' || d.district || '. ' ||
    (ARRAY[
      'New to Berlin, looking for co-founders and mentors.',
      'Second-time founder, happy to share what works.',
      'Coming from a corporate background, going independent.',
      'Just relocated from Lisbon — exploring the scene.',
      'Lab-to-market enthusiast, hunting deeptech opportunities.',
      'Looking for design-led product partners.'
    ])[1+floor(random()*6)::int],
  'https://api.dicebear.com/9.x/avataaars/svg?seed=' || replace(d.name,' ',''),
  ARRAY[d.role],
  ARRAY['co-founder','mentor','funding','community'],
  ARRAY[d.sector],
  ARRAY['startup','berlin', d.sector],
  ARRAY['fundraising','product'],
  now() - (random()*interval '120 days'), now()
FROM data d
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;

-- 3) Reviews — random 2-6 reviews per location, weighted positive
WITH users AS (
  SELECT id FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@kiez.demo')
), locs AS (
  SELECT id, name, category FROM locations WHERE approved = true
), picks AS (
  SELECT l.id AS location_id, u.id AS user_id,
    row_number() OVER (PARTITION BY l.id ORDER BY random()) AS rn,
    (2 + floor(random()*5))::int AS take_n
  FROM locs l CROSS JOIN users u
), chosen AS (
  SELECT location_id, user_id FROM picks WHERE rn <= take_n
)
INSERT INTO reviews (location_id, user_id, rating, would_recommend, pros, cons, comment, created_at)
SELECT
  c.location_id, c.user_id,
  CASE WHEN random() < 0.7 THEN 5 WHEN random() < 0.85 THEN 4 WHEN random() < 0.95 THEN 3 ELSE 2 END,
  random() < 0.88,
  (ARRAY[
    'Friendly community, easy to plug in',
    'Helpful staff and responsive team',
    'Great location and good vibes',
    'Solid programming and intros',
    'Quiet focus areas when you need them',
    'Active founder community',
    'Got real intros within a week'
  ])[1+floor(random()*7)::int],
  CASE WHEN random() < 0.5 THEN NULL ELSE
    (ARRAY[
      'Pricing on the higher side',
      'Can get noisy on event nights',
      'Booking system a bit clunky',
      'Coffee could be better',
      'Wish there were more deep-work zones'
    ])[1+floor(random()*5)::int]
  END,
  (ARRAY[
    'Honestly, one of the best decisions I made after moving to Berlin.',
    'Came for a tour, stayed for the community.',
    'I''d recommend it to any first-time founder.',
    'Real signal here — not just a coworking shell.',
    'The team actually cares about helping you ship.',
    'Felt at home from day one.',
    'Met two of my advisors here.',
    'Worth the visit even if you''re just exploring.'
  ])[1+floor(random()*8)::int],
  now() - (random()*interval '90 days')
FROM chosen c
ON CONFLICT (location_id, user_id) DO NOTHING;

-- 4) Location posts — 0-3 per location for ~40% of locations
WITH users AS (
  SELECT id FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@kiez.demo')
), locs AS (
  SELECT id FROM locations WHERE approved = true AND random() < 0.4
), picks AS (
  SELECT l.id AS location_id, u.id AS user_id,
    row_number() OVER (PARTITION BY l.id ORDER BY random()) AS rn
  FROM locs l CROSS JOIN users u
)
INSERT INTO location_posts (location_id, user_id, body, created_at, updated_at)
SELECT
  p.location_id, p.user_id,
  (ARRAY[
    'Has anyone tried the trial day here? Worth it?',
    'Heads up — the front door code rotates monthly, ask reception.',
    'Looking for a co-founder with a backend background, DM me.',
    'Free coffee tasting Thursday 4pm — bring a friend.',
    'Their accelerator demo day next week is open, RSVP is free.',
    'Just got my Anmeldung sorted with their help, huge relief.',
    'Tip: book the small phone booth in advance, they go fast.',
    'Anyone here working in climate tech? Happy to grab a coffee.'
  ])[1+floor(random()*8)::int],
  now() - (random()*interval '30 days'),
  now() - (random()*interval '30 days')
FROM picks p WHERE p.rn <= (1 + floor(random()*3))::int;

-- 5) RSVPs — sprinkle on upcoming events
WITH users AS (
  SELECT id FROM auth.users WHERE email LIKE '%@kiez.demo'
), evts AS (
  SELECT id FROM events WHERE starts_at >= now()
), picks AS (
  SELECT e.id AS event_id, u.id AS user_id,
    row_number() OVER (PARTITION BY e.id ORDER BY random()) AS rn
  FROM evts e CROSS JOIN users u
)
INSERT INTO rsvps (event_id, user_id, created_at)
SELECT p.event_id, p.user_id, now() - (random()*interval '10 days')
FROM picks p WHERE p.rn <= (3 + floor(random()*12))::int
ON CONFLICT DO NOTHING;
