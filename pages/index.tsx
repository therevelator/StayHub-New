import { Hero } from "@/components/ui/Hero";
import { PropertyList } from "@/components/ui/PropertyList";
import { Destinations } from "@/components/ui/Destinations";
import { LocationFeatures } from "@/components/ui/LocationFeatures";
// ... other imports

export default function Home() {
  // Current location - in a real app this might come from user selection or geolocation
  const currentLocation = "London";
  
  // Sample data
  const destinations = [
    {
      id: "1",
      name: "London",
      description: "Explore the historic landmarks and vibrant neighborhoods of London.",
      propertyCount: 1243
    },
    {
      id: "2",
      name: "Paris",
      description: "Experience the romance and culture of the City of Light.",
      propertyCount: 843
    },
    {
      id: "3",
      name: "New York",
      description: "Discover the energy and excitement of the Big Apple.",
      propertyCount: 1547
    }
    // ... more destinations
  ];
  
  const features = [
    {
      id: "1",
      title: "Rich Cultural Heritage",
      description: "Immerse yourself in centuries of history and cultural landmarks."
    },
    {
      id: "2",
      title: "Diverse Neighborhoods",
      description: "Explore unique areas each with their own character and charm."
    },
    {
      id: "3",
      title: "World-Class Dining",
      description: "Enjoy culinary excellence from casual eateries to fine dining."
    }
    // ... more features
  ];

  return (
    <main>
      <Hero location={currentLocation} />
      
      {/* Property list remains unchanged as specified */}
      <PropertyList 
        properties={properties} 
        title="Featured Properties"
        subtitle="Discover our most popular accommodations"
      />
      
      <Destinations destinations={destinations} />
      
      <LocationFeatures location={currentLocation} features={features} />
      
      {/* Other sections */}
    </main>
  );
} 