-- Update Car Images
UPDATE service_models SET image_url = CASE 
    -- Fiat
    WHEN brand = 'Fiat' AND model = 'Egea' THEN 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Fiat' AND model = '500' THEN 'https://images.unsplash.com/photo-1551522435-a13afa10f103?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Fiat' AND model = 'Panda' THEN 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1200&auto=format&fit=crop'

    -- Renault
    WHEN brand = 'Renault' AND model = 'Clio' THEN 'https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Renault' AND model = 'Megane' THEN 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Renault' AND model = 'Captur' THEN 'https://images.unsplash.com/photo-1609529669235-c07e4e1bd6e9?q=80&w=1200&auto=format&fit=crop'

    -- Hyundai
    WHEN brand = 'Hyundai' AND model = 'i20' THEN 'https://images.unsplash.com/photo-1580273916550-e323be2ebcc5?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Hyundai' AND model = 'Tucson' THEN 'https://images.unsplash.com/photo-1621993202323-f438eec9348d?q=80&w=1200&auto=format&fit=crop'
    
    -- Toyota
    WHEN brand = 'Toyota' AND model = 'Corolla' THEN 'https://images.unsplash.com/photo-1623869675785-3e284a4413e1?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Toyota' AND model = 'Yaris' THEN 'https://images.unsplash.com/photo-1594535182308-8ff2489c085a?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Toyota' AND model = 'C-HR' THEN 'https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?q=80&w=1200&auto=format&fit=crop'

    -- BMW
    WHEN brand = 'BMW' AND model = '5 Series' THEN 'https://images.unsplash.com/photo-1555215695-3004980adade?q=80&w=1200&auto=format&fit=crop'
    
    -- Citroen
    WHEN brand = 'Citroen' AND model = 'C3' THEN 'https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?q=80&w=1200&auto=format&fit=crop'

    -- Dacia
    WHEN brand = 'Dacia' AND model = 'Duster' THEN 'https://images.unsplash.com/photo-1621213306122-f19819717cb4?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Dacia' AND model = 'Sandero' THEN 'https://images.unsplash.com/photo-1621213306122-f19819717cb4?q=80&w=1200&auto=format&fit=crop'

    -- Ford
    WHEN brand = 'Ford' AND model = 'Focus' THEN 'https://images.unsplash.com/photo-1618774776104-58586fe8fa55?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Ford' AND model = 'Fiesta' THEN 'https://images.unsplash.com/photo-1618774776104-58586fe8fa55?q=80&w=1200&auto=format&fit=crop'

    -- Honda (Scooters)
    WHEN brand = 'Honda' AND model LIKE '%PCX%' THEN 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Honda' AND model LIKE '%Forza%' THEN 'https://images.unsplash.com/photo-1558981806-ec527fa84f3a?q=80&w=1200&auto=format&fit=crop'

    -- Yamaha (Scooters)
    WHEN brand = 'Yamaha' AND model LIKE '%NMAX%' THEN 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?q=80&w=1200&auto=format&fit=crop'
    WHEN brand = 'Yamaha' AND model LIKE '%XMAX%' THEN 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?q=80&w=1200&auto=format&fit=crop'

    -- Vespa
    WHEN brand = 'Vespa' THEN 'https://images.unsplash.com/photo-1473216839655-e51c6c646ae8?q=80&w=1200&auto=format&fit=crop'

    ELSE image_url
END
WHERE type IN ('car', 'bike');
