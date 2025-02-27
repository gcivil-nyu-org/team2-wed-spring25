'use client'


import { Map, Navigation, Shield, AlertCircle } from 'lucide-react';

export const AnimatedBackground = () => {
  const createIconRows = (count, rowIndex) =>
    Array(count).fill(null).map((_, index) => ({
      Icon: [Map, Navigation, Shield, AlertCircle][index % 4],
      delay: `${index * 0.5 + rowIndex * 0.5}s`
    }));

  const rows = [
    createIconRows(8, 0),
    createIconRows(8, 1),
    createIconRows(8, 2),
    createIconRows(8, 3)
  ];

  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.15]">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="absolute w-full flex items-center justify-around translate-x-full animate-slide-left"
          style={{
            top: `${rowIndex * 25}%`,
            animationDelay: `${rowIndex * 0.5}s`
          }}
        >
          {row.map((item, iconIndex) => {
            const IconComponent = item.Icon;
            return (
              <div
                key={iconIndex}
                className="transform rotate-45"
              >
                <IconComponent 
                  className="w-8 h-8 text-white"
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default AnimatedBackground;