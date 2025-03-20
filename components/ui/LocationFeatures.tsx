import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getLocationImageUrl } from "@/utils/locationImages";

interface Feature {
  id: string;
  title: string;
  description: string;
}

interface LocationFeaturesProps {
  location: string;
  features: Feature[];
}

export const LocationFeatures = ({ location, features }: LocationFeaturesProps) => {
  const imageUrl = getLocationImageUrl(location, 800, 600);
  
  return (
    <section className="py-16">
      <div className="container">
        <h2 className="text-3xl font-bold mb-2 text-center">
          Why Choose {location}
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          Discover what makes {location} a perfect destination for your next stay
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div 
            className="relative h-[400px] rounded-xl bg-cover bg-center overflow-hidden"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          
          <div className="space-y-6">
            {features.map((feature) => (
              <Card key={feature.id}>
                <CardContent className="p-5">
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}; 