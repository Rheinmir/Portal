import React, { useState, useEffect } from 'react';

export default function Clock({ utcOffset = 7, className = '' }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: `Etc/GMT${utcOffset >= 0 ? '-' : '+'}${Math.abs(utcOffset)}`
  }).format(time);

  // Fallback if timezone string is invalid (though Etc/GMT+/-N is standard)
  // or simply manual calculation for robustness
  const getManuallyOffsetTime = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * utcOffset));
    return nd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className={`font-mono text-xl font-bold tracking-widest opacity-80 ${className}`}>
      {getManuallyOffsetTime()}
    </div>
  );
}
