import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  type: '728x90' | '300x250';
}

export function AdBanner({ type }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adWindow = window as any;
    const [width, height] = type === '728x90' ? [728, 90] : [300, 250];

    // Set up Adsterra options configuration
    adWindow.atOptions = {
      key: '63ce391a2385772566fc0d4160073389',
      format: 'iframe',
      height: height,
      width: width,
      params: {},
    };

    // Create and append the script tag dynamically
    const script = document.createElement('script');
    script.src = `//www.highperformanceformat.com/29405667/invoke.js`;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    if (adRef.current) {
      adRef.current.innerHTML = ''; // Clear previous ad on type change
      adRef.current.appendChild(script);
    }

    return () => {
      if (adRef.current) adRef.current.innerHTML = '';
    };
  }, [type]);

  const dimensions = type === '728x90' 
    ? 'w-full max-w-[728px] min-h-[90px]' 
    : 'w-full max-w-[300px] min-h-[250px]';

  return (
    <div
      ref={adRef}
      className={`mx-auto bg-white/5 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${dimensions} max-w-full`}
    />
  );
}
