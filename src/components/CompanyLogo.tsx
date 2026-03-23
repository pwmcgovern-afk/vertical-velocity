import { useState, useEffect } from 'react';
import { getLogoUrl } from '../utils';

interface CompanyLogoProps {
  domain: string;
  name: string;
  color: string;
  size?: number;
  className?: string;
  wrapperClassName?: string;
}

export function CompanyLogo({ domain, name, color, size = 64, className = 'company-logo', wrapperClassName }: CompanyLogoProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [domain]);

  const fallback = (
    <div className={`${className} fallback`} style={{ background: `${color}30`, color }}>
      {initials}
    </div>
  );

  if (wrapperClassName) {
    return (
      <div className={wrapperClassName}>
        {(!loaded || error) && fallback}
        {!error && (
          <img
            src={getLogoUrl(domain, size)}
            alt={name}
            className={`${className}${loaded ? '' : ' loading'}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
      </div>
    );
  }

  if (error) return fallback;

  return (
    <img
      src={getLogoUrl(domain, size)}
      alt={name}
      className={className}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    />
  );
}
