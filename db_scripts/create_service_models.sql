-- Create the service_models table
CREATE TABLE IF NOT EXISTS service_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'car', 'bike', etc.
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(type, brand, model)
);

-- Enable RLS
ALTER TABLE service_models ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access" ON service_models
    FOR SELECT USING (true);

-- Allow all access to admins (assuming admin role check is handled or using service role)
-- For now, allow all modify for authenticated users to simplify, or strictly for admins if possible.
-- Since we often disable RLS for development, we can set a basic policy.
CREATE POLICY "Allow admin full access" ON service_models
    FOR ALL USING (auth.role() = 'authenticated'); -- Simplified for now

-- Seed Data for Cars
INSERT INTO service_models (type, brand, model, description) VALUES
-- Hyundai
('car', 'Hyundai', 'i20', 'The Hyundai i20 is the perfect vehicle for your trip. This compact hatchback is easy to park and maneuver in tight city streets while offering enough interior space for five passengers and luggage. It features a modern infotainment system to keep you connected and impressive fuel economy to save you money on gas. Reliable, safe, and fun to drive, it is ideal for both city errands and highway cruising.'),
('car', 'Hyundai', 'i10', 'The Hyundai i10 is a clever city car that combines compact dimensions with a surprisingly spacious interior. Perfect for navigating narrow streets and finding parking spots with ease. It offers excellent fuel economy and a smooth ride, making it an ideal choice for couples or solo travelers exploring the city.'),
('car', 'Hyundai', 'Bayon', 'The Hyundai Bayon is a stylish crossover SUV designed for urban adventures. It offers elevated seating for better visibility, a spacious cabin, and advanced safety features. With its fuel-efficient engine and compact footprint, it''s perfect for both city driving and weekend getaways along the coast.'),
('car', 'Hyundai', 'Tucson', 'The Hyundai Tucson is a premium SUV that blends sophisticated design with cutting-edge technology. It offers generous space for families, advanced safety systems, and a powerful yet efficient engine. Whether you''re heading to the beach or the mountains, the Tucson provides comfort and confidence on every journey.'),
('car', 'Hyundai', 'Elantra', 'The Hyundai Elantra is a sleek and spacious sedan that offers a premium driving experience. With its striking design, advanced technology, and comfortable interior, it''s perfect for longer trips and business travel. Enjoy a smooth, quiet ride with excellent fuel efficiency.'),

-- Fiat
('car', 'Fiat', 'Egea', 'The Fiat Egea is a popular choice for its reliability and comfort. This spacious sedan offers plenty of legroom and a large trunk, making it great for families with luggage. Its efficient diesel or petrol engines ensure a cost-effective journey, whether you''re driving in the city or on the open road.'),
('car', 'Fiat', '500', 'The Fiat 500 is an icon of Italian design and the perfect companion for city driving. Its compact size makes parking a breeze, while its stylish retro look turns heads everywhere. Ideal for couples or solo explorers looking for a fun and chic way to get around.'),
('car', 'Fiat', 'Panda', 'The Fiat Panda is a practical and versatile city car with a high driving position and robust character. It''s easy to drive, park, and extremely fuel-efficient. A great budget-friendly option for getting around town and exploring nearby attractions.'),
('car', 'Fiat', 'Doblo', 'The Fiat Doblo is a versatile LAV (Leisure Activity Vehicle) offering massive cargo space and sliding rear doors for easy access. Perfect for large families or groups carrying sports equipment. Reliable and spacious, it handles all your holiday needs with ease.'),
('car', 'Fiat', 'Fiorino', 'The Fiat Fiorino is a compact van that''s surprisingly spacious inside. It''s agile in traffic and easy to park, with plenty of room for luggage. A practical choice for small groups or those needing extra cargo capacity without driving a large vehicle.'),

-- Renault
('car', 'Renault', 'Clio', 'The Renault Clio is a chic and modern hatchback that delivers a dynamic driving experience. It features a high-quality interior, smart technology, and efficient engines. Its compact size is perfect for the city, yet it''s comfortable and stable enough for highway driving.'),
('car', 'Renault', 'Taliant', 'The Renault Taliant is a practical sedan designed for efficiency and space. It offers a large trunk and comfortable seating for five, making it a great value choice for families. Reliable and economical, it''s built to handle daily driving with ease.'),
('car', 'Renault', 'Megane', 'The Renault Megane is a stylish sedan with a premium feel. It offers a refined ride, excellent sound insulation, and advanced driver-assistance systems. Perfect for those who appreciate comfort and style on their travels.'),
('car', 'Renault', 'Captur', 'The Renault Captur is a compact SUV that combines style with practicality. With its customizable interior, sliding rear bench, and high driving position, it adapts to your needs. Agile in the city and capable on the open road, it''s a versatile choice.'),
('car', 'Renault', 'Austral', 'The Renault Austral is a modern, high-tech SUV offering a premium driving experience. It features a spacious, digitized cockpit and efficient hybrid powertrains. Ideal for families seeking comfort, safety, and advanced technology on their journey.'),

-- Toyota
('car', 'Toyota', 'Corolla', 'The Toyota Corolla is the world''s best-selling car for a reason. It offers legendary reliability, a comfortable ride, and excellent fuel efficiency, especially in hybrid models. A safe and sensible choice that guarantees a stress-free driving experience.'),
('car', 'Toyota', 'Yaris', 'The Toyota Yaris is a smart, compact hybrid perfect for city living. It offers class-leading fuel economy and nimble handling. Its compact size helps you zip through traffic, while the interior is surprisingly roomy and packed with safety features.'),
('car', 'Toyota', 'C-HR', 'The Toyota C-HR stands out with its bold, futuristic design. This coupe-style SUV offers a dynamic driving experience with the efficiency of a hybrid. High ride height, premium interior, and safety tech make it a cool choice for modern travelers.'),
('car', 'Toyota', 'Rav4', 'The Toyota RAV4 is a capable and spacious SUV ready for any adventure. It offers a large trunk, comfortable seating for five, and robust performance. Whether you''re exploring off the beaten path or cruising the highway, the RAV4 delivers.'),

-- Honda
('car', 'Honda', 'City', 'The Honda City is a comfortable and efficient sedan known for its spacious interior and smooth engine. It offers ample legroom and a large trunk, making it practical for families. A reliable choice for comfortable city and highway driving.'),
('car', 'Honda', 'Civic', 'The Honda Civic is a sporty sedan that combines performance with practicality. It features a low, wide stance for great handling and a spacious, high-tech cabin. Fun to drive yet efficient, it''s perfect for those who enjoy the journey as much as the destination.'),
('car', 'Honda', 'Jazz', 'The Honda Jazz is famous for its ''Magic Seats'' and incredible versatility. Despite its small exterior, the interior space rivals larger cars. It offers excellent visibility and fuel economy, making it a clever choice for practical travelers.'),
('car', 'Honda', 'HR-V', 'The Honda HR-V is a subcompact SUV with a coupe-like design and versatile interior space. It''s comfortable, fuel-efficient, and easy to drive. A great all-rounder for couples and small families looking for style and practicality.'),

-- Ford
('car', 'Ford', 'Focus', 'The Ford Focus is renowned for its excellent handling and driving dynamics. It offers a solid, premium feel and a comfortable ride. With advanced technology and safety features, it''s a driver-focused car that doesn''t compromise on comfort.'),
('car', 'Ford', 'Fiesta', 'The Ford Fiesta is widely considered the most fun-to-drive small car. It''s agile, responsive, and perfect for twisting roads and city streets. Compact yet practical, it serves up a great driving experience with good fuel economy.'),
('car', 'Ford', 'Puma', 'The Ford Puma is a stylish compact crossover with clever storage solutions like the ''Megabox''. It combines the fun driving dynamics of a Fiesta with SUV practicality. Mild-hybrid technology ensures efficiency without sacrificing performance.'),
('car', 'Ford', 'Kuga', 'The Ford Kuga is a spacious family SUV with a sleek design. It offers a commanding driving position, plenty of room for passengers, and a refined ride. Packed with technology, it''s a comfortable cruiser for long distances.'),
('car', 'Ford', 'Tourneo Courier', 'The Ford Tourneo Courier is a compact people mover that prioritizes space and practicality. With sliding rear doors and a huge cargo area, it''s perfect for active families or groups with lots of gear. Rugged and reliable.'),

-- Dacia
('car', 'Dacia', 'Duster', 'The Dacia Duster is a rugged, no-nonsense SUV that offers incredible value. It''s capable, spacious, and built to handle rougher roads with ease. A popular choice for adventurous travelers looking for a practical and affordable vehicle.'),
('car', 'Dacia', 'Sandero', 'The Dacia Sandero is a straightforward hatchback that delivers everything you need. It''s spacious, reliable, and extremely economical. A smart, budget-friendly choice that gets you from A to B in comfort.'),
('car', 'Dacia', 'Jogger', 'The Dacia Jogger is a unique family car blending estate practicality with SUV styling. It offers seating for up to seven (depending on config) and massive cargo space. The ultimate value choice for large families on the move.')

ON CONFLICT (type, brand, model) DO UPDATE 
SET description = EXCLUDED.description;
