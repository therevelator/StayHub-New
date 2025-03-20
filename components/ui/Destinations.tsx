import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { getLocationImageUrl } from "@/utils/locationImages";

interface Destination {
  id: string;
  name: string;
  description: string;
  propertyCount: number;
}

interface DestinationsProps {
  destinations: Destination[];
}

export const Destinations = ({ destinations }: DestinationsProps) => {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Popular Destinations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => (
            <Card key={destination.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div 
                className="relative h-48 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${getLocationImageUrl(destination.name, 400, 300)})` }}
              />
              <CardContent className="p-5">
                <h3 className="text-xl font-semibold mb-2">{destination.name}</h3>
                <p className="text-muted-foreground mb-3">{destination.description}</p>
                <p className="text-sm font-medium">
                  {destination.propertyCount} properties
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}; 