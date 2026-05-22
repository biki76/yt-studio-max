import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  type: '728x90' | '300x250';
}

export function AdBanner({ type }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    const script = document.createElement("script");
    script.src = "https://www.highperformanceformat.com/8a1e953718286fee6f5c906d6581bf1f/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    if (adRef.current) {
        adRef.current.innerHTML = "";
        adRef.current.appendChild(script);
    }
    
  }, [type]);

  const dimensions = type === '728x90' ? 'w-[728px] h-[90px]' : 'w-[300px] h-[250px]';

  return (
    <div
      ref={adRef}
      className={`mx-auto bg-white/5 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${dimensions}`}
    >
      <div className="text-white/30 text-sm font-mono flex flex-col items-center">
        <span>Adsterra Placeholder</span>
        <span>{type}</span>
      </div>
    </div>
  );
}
