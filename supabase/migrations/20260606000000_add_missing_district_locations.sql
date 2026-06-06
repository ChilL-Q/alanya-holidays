-- Purpose: Add missing Alanya district/town locations for SEO district pages
-- These 5 locations are needed for the district landing pages programmatic SEO strategy

INSERT INTO locations (name, name_tr, lat, lng, parent_region, type, display_order) VALUES
    ('Oba', 'Oba', 36.5500, 32.0100, 'Alanya', 'town', 16),
    ('Tosmur', 'Tosmur', 36.5340, 32.0400, 'Alanya', 'town', 17),
    ('Turkler', 'Türkler', 36.6140, 31.6930, 'Alanya', 'town', 18),
    ('Okurcalar', 'Okurcalar', 36.6270, 31.6600, 'Alanya', 'town', 19),
    ('Incekum', 'İncekum', 36.6260, 31.7770, 'Alanya', 'town', 20)
ON CONFLICT DO NOTHING;