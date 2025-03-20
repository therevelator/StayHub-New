import React from "react";
import { Button } from "@/components/ui/button";
import { getLocationImageUrl } from "@/utils/locationImages";

interface HeroProps {
  location?: string;
}

export const Hero = ({ location = "Default" }: HeroProps) => {
  const imageUrl = getLocationImageUrl(location, 1920, 1080);
  
  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center brightness-75"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 bg-black/30">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
          Find Your Perfect Stay in {location}
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl text-center">
          Discover amazing accommodations tailored to your needs
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" variant="default">
            Browse Properties
          </Button>
          <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}; 