import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  type: '728x90' | '300x250';
}

export function AdBanner({ type }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real environment, we would inject the Adsterra script tag.
    // For React SPA, we usually append the script dynamically if needed.
    // E.g.,
    /*
    const script = document.createElement("script");
    script.src = "//www.topcreativeformat.com/YOUR_ID/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    if (adRef.current) {
        adRef.current.innerHTML = "";
        adRef.current.appendChild(script);
    }
    */
  }, [type]);

  const dimensions = type === '728x90' ? 'w-full max-w-[728px] h-auto min-h-[90px]' : 'w-full max-w-[300px] h-auto min-h-[250px]';

  return (
    <div
      ref={adRef}
      className={`mx-auto bg-white/5 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${dimensions} max-w-full`}
    >
      <div className="text-white/30 text-sm font-mono flex flex-col items-center">
        <span>Adsterra Placeholder</span>
        <span>{type}</span>
      </div>
    </div>
  );
}
