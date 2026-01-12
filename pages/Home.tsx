import React, { useState } from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { ValueProps } from '../components/home/ValueProps';
import { FeaturedProperties } from '../components/home/FeaturedProperties';

import { AlanyaIntro } from '../components/home/AlanyaIntro';

export const Home: React.FC = () => {
  const [location, setLocation] = useState('');

  return (
    <div className="min-h-screen">
      <HeroSection location={location} setLocation={setLocation} />
      <ValueProps />
      <AlanyaIntro />
      <FeaturedProperties />
    </div>
  );
};