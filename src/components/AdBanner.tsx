import React, { useEffect, useRef } from 'react';

export function AdBanner() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adWindow = window as any;
    const [width, height] = [728, 90];

    // Set up Adsterra options configuration with your new key
    adWindow.atOptions = {
      key: '5cfe7365609efaca5715e6f4ef5b729e',
      format: 'iframe',
      height: height,
      width: width,
      params: {},
    };

    // Create and append your specific script tag dynamically
    const script = document.createElement('script');
    script.src = 'https://elementalconsessionconsession.com/5cfe7365609efaca5715e6f4ef5b729e/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    if (adRef.current) {
      adRef.current.innerHTML = ''; // Clear previous ad container contents
      adRef.current.appendChild(script);
    }

    return () => {
      if (adRef.current) adRef.current.innerHTML = '';
    };
  }, []);

  const dimensions = 'w-full max-w-[728px] min-h-[90px]';

  return (
    <div
      ref={adRef}
      className={`mx-auto bg-white/5 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${dimensions} max-w-full`}
    />
  );
}
