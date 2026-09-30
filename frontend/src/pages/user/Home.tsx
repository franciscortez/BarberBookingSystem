import { useEffect } from "react";
import { useLandingCatalog } from "../../hooks/useLandingCatalog";
import { preloadBookingRoute } from "../../routes/lazyRoutes";
import HeroSection from "../../sections/user/home/HeroSection";
import ServicesSection from "../../sections/user/home/ServicesSection";
import TeamSection from "../../sections/user/home/TeamSection";
import ExperienceSection from "../../sections/user/home/ExperienceSection";
import BookingGuideSection from "../../sections/user/home/BookingGuideSection";
import ClosingSection from "../../sections/user/home/ClosingSection";
import "../../sections/user/home/landing.css";

const Home = () => {
  const { barbers, services, groupedServices, loading, preview } =
    useLandingCatalog();

  useEffect(() => {
    preloadBookingRoute();
  }, []);

  return (
    <>
      <HeroSection />
      <ServicesSection
        groupedServices={groupedServices}
        loading={loading}
        preview={preview}
      />
      <ExperienceSection services={services} />
      <TeamSection barbers={barbers} loading={loading} preview={preview} />
      <BookingGuideSection />
      <ClosingSection />
    </>
  );
};

export default Home;
