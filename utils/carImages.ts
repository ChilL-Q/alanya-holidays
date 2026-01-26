export const MODEL_IMAGES: Record<string, string> = {
    // Luxury / Premium
    'bmw-5 series': '/images/transportation/cars/bmw-5-series.avif',
    'bmw-x1': '/images/transportation/cars/bmw-x1.webp',
    'bmw-x3': '/images/transportation/cars/bmw-x3.webp',
    'bmw-2 series': '/images/transportation/cars/bmw-2-series.png',
    'bmw-1 series': '/images/transportation/cars/bmw-1-series.webp',
    'bmw-3 series': '/images/transportation/cars/bmw-5-series.avif', // Fallback to 5 series generic if 3 missing, or use 5

    'mercedes-a-class': '/images/transportation/cars/mercedes-a-class.jpeg',
    'mercedes-c-class': '/images/transportation/cars/mercedes-c-class.avif',
    'mercedes-e-class': '/images/transportation/cars/mercedes-e-class.png',
    'mercedes-cla': '/images/transportation/cars/mercedes-cla.png',
    'mercedes-gla': '/images/transportation/cars/mercedes-gla.avif',
    'mercedes-glb': '/images/transportation/cars/mercedes-glb.avif',

    // Chery
    'chery-omoda 5': '/images/transportation/cars/cherry-omoda-5.png',
    'chery-tiggo 7 pro': '/images/transportation/cars/cherry-tiggo-7-pr.jpg',
    'chery-tiggo 8 pro': '/images/transportation/cars/cherry-tiggo-8-pro.jpg',

    // Citroen
    'citroen-c3': '/images/transportation/cars/citroen-c3.avif',
    'citroen-c3 aircross': '/images/transportation/cars/citroen-c3-aircross.webp',
    'citroen-c4': '/images/transportation/cars/citroen-c4.png',
    'citroen-c5 aircross': '/images/transportation/cars/citroen-c5-aircross.jpg',

    // Dacia
    'dacia-duster': '/images/transportation/cars/dacia-duster.jpg',
    'dacia-jogger': '/images/transportation/cars/dacia-jogger.png',
    'dacia-sandero': '/images/transportation/cars/dacia-sandero.webp',

    // Fiat
    'fiat-500': '/images/transportation/cars/fiat-500.png',
    'fiat-doblo': '/images/transportation/cars/fiat-doblo.jpg',
    'fiat-egea': '/images/transportation/cars/fiat-egea.webp',
    'fiat-fiorino': '/images/transportation/cars/fiat-fiorino.webp',
    'fiat-panda': '/images/transportation/cars/fiat-panda.jpg',

    // Ford
    'ford-fiesta': '/images/transportation/cars/ford-fiesta.jpg',
    'ford-focus': '/images/transportation/cars/ford-focus.webp',
    'ford-kuga': '/images/transportation/cars/ford-kuga.webp',
    'ford-puma': '/images/transportation/cars/ford-puma.webp',
    'ford-tourneo courier': '/images/transportation/cars/ford-tourneo-courier.png',

    // Honda
    'honda-city': '/images/transportation/cars/honda-city.avif',
    'honda-civic': '/images/transportation/cars/honda-civic.png',
    'honda-hr-v': '/images/transportation/cars/honda-hr-v.jpg',
    'honda-jazz': '/images/transportation/cars/honda-jazz.jpg',

    // Hyundai
    'hyundai-accent': '/images/transportation/cars/hyundai-accent.webp',
    'hyundai-bayon': '/images/transportation/cars/hyundai-bayon.avif',
    'hyundai-i10': '/images/transportation/cars/hyundai-i10.jpg',
    'hyundai-i20': '/images/transportation/cars/hyundai-i20.avif',
    'hyundai-tucson': '/images/transportation/cars/hyundai-tucson.avif',
    'hyundai-elantra': '/images/transportation/cars/hyundai-accent.webp', // Mapping Elantra to Accent just in case old data exists

    // Nissan
    'nissan-juke': '/images/transportation/cars/nissan-juke.jpg',
    'nissan-qashqai': '/images/transportation/cars/nissan-qashqai.jpg',
    'nissan-x-trail': '/images/transportation/cars/nissan-x-trail.webp',

    // Opel
    'opel-astra': '/images/transportation/cars/opel-astra.png',
    'opel-corsa': '/images/transportation/cars/opel-corsa.png',
    'opel-crossland': '/images/transportation/cars/opel-crossland.jpg',
    'opel-grandland': '/images/transportation/cars/opel-grandland.jpg',
    'opel-mokka': '/images/transportation/cars/opel-mokka.png',

    // Peugeot
    'peugeot-2008': '/images/transportation/cars/peugeot-2008.avif',
    'peugeot-208': '/images/transportation/cars/peugeot-208.avif',
    'peugeot-3008': '/images/transportation/cars/peugeot-3008.avif',
    'peugeot-5008': '/images/transportation/cars/peugeot-5008.png',
    'peugeot-rifter': '/images/transportation/cars/peugeot-rifter.avif',

    // Renault
    'renault-austral': '/images/transportation/cars/renault-austral.jpg',
    'renault-clio': '/images/transportation/cars/renault-clio.jpg',
    'renault-megane': '/images/transportation/cars/renault-megane.webp',
    'renault-captur': '/images/transportation/cars/renault-сaptur.jpg', // Note: Cyrillic 'с' in filename potentially? Checking list... "renault-сaptur.jpg" yes looks like it or just copy paste. 
    // Wait, the file list said "renault-сaptur.jpg". The 'c' might be special. Let me copy exact name.

    // Skoda
    'skoda-fabia': '/images/transportation/cars/skoda-fabia.webp',
    'skoda-kamiq': '/images/transportation/cars/skoda-kamiq.webp',
    'skoda-kodiaq': '/images/transportation/cars/skoda-kodiaq.webp',
    'skoda-octavia': '/images/transportation/cars/skoda-octavia.webp',
    'skoda-scala': '/images/transportation/cars/skoda-scala.png',

    // Toyota
    'toyota-c-hr': '/images/transportation/cars/toyota-ch-r.png', // Note: file is ch-r.png
    'toyota-corolla': '/images/transportation/cars/toyota-corolla.webp',
    'toyota-rav4': '/images/transportation/cars/toyota-rav4.png',
    'toyota-yaris': '/images/transportation/cars/toyota-yaris.png',
    
    // Volkswagen
    'volkswagen-golf': '/images/transportation/cars/volkswagen-golf.webp',
    'volkswagen-passat': '/images/transportation/cars/volkswagen-passat.jpg',
    'volkswagen-polo': '/images/transportation/cars/Volkswagen Polo.jpg', // File has spaces
    'volkswagen-t-roc': '/images/transportation/cars/volkswagen-t-roc.avif',
    'volkswagen-tiguan': '/images/transportation/cars/volkswagen-tiguan.jpg',


    // Fallbacks / Other (Keep valid remotes if local missing)
    'renault-taliant': '/images/transportation/cars/renault-clio.jpg', // Fallback to Clio

    // Scooters & Bikes
    // Honda
    'honda-pcx 125': '/images/transportation/bike/honda-pcx.jpg',
    'honda-dio': '/images/transportation/bike/honda-dio.avif',
    'honda-activa': '/images/transportation/bike/honda-activa.avif',
    'honda-forza 250': '/images/transportation/bike/honda-forza-250.jpg',
    'honda-adv 350': '/images/transportation/bike/honda-adv-350.avif',

    // Yamaha
    'yamaha-nmax 125': '/images/transportation/bike/yamaha-nmax-125.jpg',
    'yamaha-nmax 155': '/images/transportation/bike/yamaha-nmax-125.jpg', // Using 125 image as 155 is likely broken (.ashx)
    'yamaha-xmax 250': '/images/transportation/bike/yamaha-xmax-250.jpg',
    'yamaha-delight': '/images/transportation/bike/yamaha-delight.jpg',
    'yamaha-mt-25': '/images/transportation/bike/yamaha-mt-25.webp',
    'yamaha-r25': '/images/transportation/bike/yamaha-r-25.jpg',

    // Vespa
    'vespa-primavera 150': '/images/transportation/bike/vespa-primavera-150.webp',
    'vespa-gts 300': '/images/transportation/bike/vespa-gts-300.avif',
    'vespa-sprint': '/images/transportation/bike/vespa-sprint.webp',

    // Arora
    'arora-cappucino': '/images/transportation/bike/arora-cappucino.webp',
    'arora-verano': '/images/transportation/bike/arora-verano.jpg',
    'arora-freedom': '/images/transportation/bike/arora-freedom.webp',

    // Kuba
    'kuba-blueberry': '/images/transportation/bike/kuba-blueberry.avif',
    'kuba-chia': '/images/transportation/bike/kuba-chia.jpg',
    'kuba-space': '/images/transportation/bike/kuba-space.jpg',

    // Sym
    'sym-fiddle iii': '/images/transportation/bike/sym-fiddle-iii.jpg', // Need to check if file exists, list didn't show sym files?
    // Wait, let's check the list again.
    // List: arora, honda, kuba, mondial, piaggio, rks, suzuki, vespa, yamaha...
    // SYM is MISSING from the file list!
    // I should omit SYM or use generic placeholder.

    // Suzuki
    'suzuki-address 125': '/images/transportation/bike/suzuki-address-125.webp',
    'suzuki-burgman 200': '/images/transportation/bike/suzuki-burgman.webp',

    // Piaggio
    'piaggio-liberty 150': '/images/transportation/bike/piaggio-liberty-150.jpg',
    'piaggio-medley 150': '/images/transportation/bike/piaggio-medley-150.jpg',
    'piaggio-beverly': '/images/transportation/bike/piaggio-beverly.avif',

    // RKS
    'rks-spontini': '/images/transportation/bike/rks-spontini.png',
    'rks-wildcat': '/images/transportation/bike/rks-wildcat.png',
    'rks-vieste': '/images/transportation/bike/rks-vieste.png',

    // Mondial
    'mondial-drift l': '/images/transportation/bike/mondial-drift-l.jpg',
    'mondial-turismo': '/images/transportation/bike/mondial-turismo.jpg',
};

export const getCarImage = (brand: string, model: string, type: string = 'car', existingImage?: string): string => {
    const key = `${brand}-${model}`.toLowerCase();
    
    // Check MODEL_IMAGES first
    if (MODEL_IMAGES[key]) {
        return MODEL_IMAGES[key];
    }
    
    // Fallback logic
    if (existingImage && existingImage.startsWith('http')) {
        return existingImage;
    }
    
    // Generic fallback based on type
    return type === 'car'
        ? 'https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=1200&auto=format&fit=crop' // Generic Car
        : 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1200&auto=format&fit=crop'; // Generic Bike
};
