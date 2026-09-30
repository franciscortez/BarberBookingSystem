import type { Service } from "../../../types";

interface ExperienceSectionProps {
  services: Service[];
}

const ExperienceSection = ({ services }: ExperienceSectionProps) => {
  const offerings = [...new Set(services.map((service) => service.name))].slice(
    0,
    4,
  );
  return (
    <section className="landing-experience" aria-labelledby="experience-title">
      <div className="landing-container landing-experience-layout">
        <figure className="landing-still-life">
          <img
            src="/images/landing/tools-900.jpg"
            srcSet="/images/landing/tools-450.jpg 450w, /images/landing/tools-900.jpg 900w"
            sizes="(min-width: 768px) 45vw, 100vw"
            alt="Silver scissors, a comb, a folded towel and an amber grooming bottle on stone"
            width="900"
            height="1125"
            loading="lazy"
            decoding="async"
          />
          <figcaption>Illustrative still life</figcaption>
        </figure>
        <div className="landing-experience-copy">
          <h2 id="experience-title">
            Make room
            <br />
            for yourself.
          </h2>
          <p>
            A little time in the chair. A look that feels like you. Find your
            service and make your next visit yours.
          </p>
          {offerings.length > 0 && (
            <ul className="landing-offerings">
              {offerings.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
          <a href="#services" className="landing-text-link">
            Explore the menu
          </a>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
