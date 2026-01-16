
export const CAR_CATALOG: Record<string, string[]> = {
    'Fiat': ['Egea', '500', 'Panda', 'Doblo', 'Fiorino'],
    'Renault': ['Clio', 'Taliant', 'Megane', 'Captur', 'Austral'],
    'Hyundai': ['i10', 'i20', 'Bayon', 'Tucson', 'Elantra'],
    'Toyota': ['Corolla', 'Yaris', 'C-HR', 'Rav4'],
    'Honda': ['City', 'Civic', 'Jazz', 'HR-V'],
    'Ford': ['Focus', 'Fiesta', 'Puma', 'Kuga', 'Tourneo Courier'],
    'Dacia': ['Duster', 'Sandero', 'Jogger'],
    'Citroen': ['C3', 'C3 Aircross', 'C4', 'C5 Aircross'],
    'Peugeot': ['208', '2008', '3008', '5008', 'Rifter'],
    'Opel': ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland'],
    'Volkswagen': ['Polo', 'Golf', 'T-Roc', 'Tiguan', 'Passat'],
    'Skoda': ['Fabia', 'Scala', 'Kamiq', 'Octavia', 'Kodiaq'],
    'Nissan': ['Juke', 'Qashqai', 'X-Trail'],
    'BMW': ['1 Series', '2 Series', '3 Series', '5 Series', 'X1', 'X3'],
    'Mercedes': ['A-Class', 'C-Class', 'E-Class', 'CLA', 'GLA', 'GLB'],
    'Chery': ['Omoda 5', 'Tiggo 7 Pro', 'Tiggo 8 Pro'],
};

export const BIKE_CATALOG: Record<string, string[]> = {
    'Honda': ['PCX 125', 'Dio', 'Activa', 'Forza 250', 'ADV 350', 'NC 750'],
    'Yamaha': ['NMAX 125', 'NMAX 155', 'XMAX 250', 'Delight', 'MT-25', 'R25'],
    'Vespa': ['Primavera 150', 'GTS 300', 'Sprint'],
    'Arora': ['Cappucino', 'Verano', 'Freedom'],
    'Kuba': ['Blueberry', 'Chia', 'Space'],
    'Sym': ['Fiddle III', 'Jet 14', 'Wolf'],
    'Suzuki': ['Address 125', 'Burgman 200'],
    'Piaggio': ['Liberty 150', 'Medley 150', 'Beverly'],
    'RKS': ['Spontini', 'Wildcat', 'Vieste'],
    'Mondial': ['Drift L', 'Turismo'],
};

export const CAR_DESCRIPTIONS: Record<string, string> = {
    // Hyundai
    'Hyundai i20': "The Hyundai i20 is the perfect vehicle for your trip. This compact hatchback is easy to park and maneuver in tight city streets while offering enough interior space for five passengers and luggage. It features a modern infotainment system to keep you connected and impressive fuel economy to save you money on gas. Reliable, safe, and fun to drive, it is ideal for both city errands and highway cruising.",
    'Hyundai i10': "The Hyundai i10 is a clever city car that combines compact dimensions with a surprisingly spacious interior. Perfect for navigating narrow streets and finding parking spots with ease. It offers excellent fuel economy and a smooth ride, making it an ideal choice for couples or solo travelers exploring the city.",
    'Hyundai Bayon': "The Hyundai Bayon is a stylish crossover SUV designed for urban adventures. It offers elevated seating for better visibility, a spacious cabin, and advanced safety features. With its fuel-efficient engine and compact footprint, it's perfect for both city driving and weekend getaways along the coast.",
    'Hyundai Tucson': "The Hyundai Tucson is a premium SUV that blends sophisticated design with cutting-edge technology. It offers generous space for families, advanced safety systems, and a powerful yet efficient engine. Whether you're heading to the beach or the mountains, the Tucson provides comfort and confidence on every journey.",
    'Hyundai Elantra': "The Hyundai Elantra is a sleek and spacious sedan that offers a premium driving experience. With its striking design, advanced technology, and comfortable interior, it's perfect for longer trips and business travel. Enjoy a smooth, quiet ride with excellent fuel efficiency.",

    // Fiat
    'Fiat Egea': "The Fiat Egea is a popular choice for its reliability and comfort. This spacious sedan offers plenty of legroom and a large trunk, making it great for families with luggage. Its efficient diesel or petrol engines ensure a cost-effective journey, whether you're driving in the city or on the open road.",
    'Fiat 500': "The Fiat 500 is an icon of Italian design and the perfect companion for city driving. Its compact size makes parking a breeze, while its stylish retro look turns heads everywhere. Ideal for couples or solo explorers looking for a fun and chic way to get around.",
    'Fiat Panda': "The Fiat Panda is a practical and versatile city car with a high driving position and robust character. It's easy to drive, park, and extremely fuel-efficient. A great budget-friendly option for getting around town and exploring nearby attractions.",
    'Fiat Doblo': "The Fiat Doblo is a versatile LAV (Leisure Activity Vehicle) offering massive cargo space and sliding rear doors for easy access. Perfect for large families or groups carrying sports equipment. Reliable and spacious, it handles all your holiday needs with ease.",
    'Fiat Fiorino': "The Fiat Fiorino is a compact van that's surprisingly spacious inside. It's agile in traffic and easy to park, with plenty of room for luggage. A practical choice for small groups or those needing extra cargo capacity without driving a large vehicle.",

    // Renault
    'Renault Clio': "The Renault Clio is a chic and modern hatchback that delivers a dynamic driving experience. It features a high-quality interior, smart technology, and efficient engines. Its compact size is perfect for the city, yet it's comfortable and stable enough for highway driving.",
    'Renault Taliant': "The Renault Taliant is a practical sedan designed for efficiency and space. It offers a large trunk and comfortable seating for five, making it a great value choice for families. Reliable and economical, it's built to handle daily driving with ease.",
    'Renault Megane': "The Renault Megane is a stylish sedan with a premium feel. It offers a refined ride, excellent sound insulation, and advanced driver-assistance systems. Perfect for those who appreciate comfort and style on their travels.",
    'Renault Captur': "The Renault Captur is a compact SUV that combines style with practicality. With its customizable interior, sliding rear bench, and high driving position, it adapts to your needs. Agile in the city and capable on the open road, it's a versatile choice.",
    'Renault Austral': "The Renault Austral is a modern, high-tech SUV offering a premium driving experience. It features a spacious, digitized cockpit and efficient hybrid powertrains. Ideal for families seeking comfort, safety, and advanced technology on their journey.",

    // Toyota
    'Toyota Corolla': "The Toyota Corolla is the world's best-selling car for a reason. It offers legendary reliability, a comfortable ride, and excellent fuel efficiency, especially in hybrid models. A safe and sensible choice that guarantees a stress-free driving experience.",
    'Toyota Yaris': "The Toyota Yaris is a smart, compact hybrid perfect for city living. It offers class-leading fuel economy and nimble handling. Its compact size helps you zip through traffic, while the interior is surprisingly roomy and packed with safety features.",
    'Toyota C-HR': "The Toyota C-HR stands out with its bold, futuristic design. This coupe-style SUV offers a dynamic driving experience with the efficiency of a hybrid. High ride height, premium interior, and safety tech make it a cool choice for modern travelers.",
    'Toyota Rav4': "The Toyota RAV4 is a capable and spacious SUV ready for any adventure. It offers a large trunk, comfortable seating for five, and robust performance. Whether you're exploring off the beaten path or cruising the highway, the RAV4 delivers.",

    // Honda
    'Honda City': "The Honda City is a comfortable and efficient sedan known for its spacious interior and smooth engine. It offers ample legroom and a large trunk, making it practical for families. A reliable choice for comfortable city and highway driving.",
    'Honda Civic': "The Honda Civic is a sporty sedan that combines performance with practicality. It features a low, wide stance for great handling and a spacious, high-tech cabin. Fun to drive yet efficient, it's perfect for those who enjoy the journey as much as the destination.",
    'Honda Jazz': "The Honda Jazz is famous for its 'Magic Seats' and incredible versatility. Despite its small exterior, the interior space rivals larger cars. It offers excellent visibility and fuel economy, making it a clever choice for practical travelers.",
    'Honda HR-V': "The Honda HR-V is a subcompact SUV with a coupe-like design and versatile interior space. It's comfortable, fuel-efficient, and easy to drive. A great all-rounder for couples and small families looking for style and practicality.",

    // Ford
    'Ford Focus': "The Ford Focus is renowned for its excellent handling and driving dynamics. It offers a solid, premium feel and a comfortable ride. With advanced technology and safety features, it's a driver-focused car that doesn't compromise on comfort.",
    'Ford Fiesta': "The Ford Fiesta is widely considered the most fun-to-drive small car. It's agile, responsive, and perfect for twisting roads and city streets. Compact yet practical, it serves up a great driving experience with good fuel economy.",
    'Ford Puma': "The Ford Puma is a stylish compact crossover with clever storage solutions like the 'Megabox'. It combines the fun driving dynamics of a Fiesta with SUV practicality. Mild-hybrid technology ensures efficiency without sacrificing performance.",
    'Ford Kuga': "The Ford Kuga is a spacious family SUV with a sleek design. It offers a commanding driving position, plenty of room for passengers, and a refined ride. Packed with technology, it's a comfortable cruiser for long distances.",
    'Ford Tourneo Courier': "The Ford Tourneo Courier is a compact people mover that prioritizes space and practicality. With sliding rear doors and a huge cargo area, it's perfect for active families or groups with lots of gear. Rugged and reliable.",

    // Dacia
    'Dacia Duster': "The Dacia Duster is a rugged, no-nonsense SUV that offers incredible value. It's capable, spacious, and built to handle rougher roads with ease. A popular choice for adventurous travelers looking for a practical and affordable vehicle.",
    'Dacia Sandero': "The Dacia Sandero is a straightforward hatchback that delivers everything you need. It's spacious, reliable, and extremely economical. A smart, budget-friendly choice that gets you from A to B in comfort.",
    'Dacia Jogger': "The Dacia Jogger is a unique family car blending estate practicality with SUV styling. It offers seating for up to seven (depending on config) and massive cargo space. The ultimate value choice for large families on the move.",
};

export const DEFAULT_DESCRIPTION = "A reliable and comfortable vehicle perfect for your holiday in Alanya. Maintained to the highest standards, this car offers a safe and smooth driving experience. Ideal for exploring the local beaches, historical sites, and scenic coastal roads. Features air conditioning and standard safety equipment.";
