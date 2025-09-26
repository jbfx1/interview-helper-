interface FeatureSectionProps {
  title: string;
  description: string;
  cta: string;
  anchor: string;
}

function FeatureSection({ title, description, cta, anchor }: FeatureSectionProps) {
  return (
    <a className="feature-card" href={`#${anchor}`}>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="cta">{cta}</span>
    </a>
  );
}

export default FeatureSection;
