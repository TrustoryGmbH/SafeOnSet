import React from 'react';

interface SmileyProps {
  score: number; // 0 (Stressed/Sad) to 100 (Happy)
  size?: number;
  animate?: boolean;
}

const Smiley: React.FC<SmileyProps> = ({ score, size = 120, animate = false }) => {
  // Logic: 
  // Score 100 (Happy) -> Curve 90 (deep smile)
  // Score 50 (Neutral) -> Curve 75 (straight)
  // Score 0 (Sad) -> Curve 60 or less (frown)
  
  // Mapping score (0-100 Goodness):
  // 100 -> 85 (Big Smile)
  // 0 -> 45 (Big Frown)
  const curveValue = 45 + (score / 100) * 40; 
  
  // Color calculation
  const getColor = (s: number) => {
    if (s >= 90) return '#22c55e'; // Green
    if (s >= 60) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const color = getColor(score);

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="flex-shrink-0 overflow-visible">
       {animate && (
         <>
            {/* Outer spinning ring */}
            <circle 
              cx="60" cy="60" r="58" 
              fill="none" 
              stroke={color} 
              strokeWidth="1"
              strokeDasharray="4 8" 
              className="opacity-30 animate-spin-slow origin-center transition-colors duration-500"
            />
            {/* Inner pulsing ring */}
            <circle 
              cx="60" cy="60" r="55" 
              fill="none" 
              stroke={color} 
              strokeWidth="2"
              strokeDasharray="60 40" 
              className="opacity-60 animate-[spin_6s_linear_infinite] origin-center transition-colors duration-500"
            />
         </>
       )}
      
      {/* Main Face Circle */}
      <circle 
        cx="60" cy="60" r="45" 
        className="transition-[fill] duration-500"
        fill={color}
        stroke="#eab308" 
        strokeWidth={score >= 90 ? "0" : "0"} 
        style={{ stroke: score >= 60 ? '#eab308' : '#b91c1c' }}
      />
      
      {/* Eyes Group with Blink Animation */}
      {/* transform-box: 'fill-box' is crucial for SVG transforms to use the element's bounding box as origin */}
      <g 
        className={animate ? "animate-blink origin-center" : ""} 
        style={{ transformBox: 'fill-box' }}
      >
          {/* Left Eye */}
          <ellipse cx="45" cy="50" rx="5" ry="6" fill="#f1f5f9" />
          {/* Right Eye */}
          <ellipse cx="75" cy="50" rx="5" ry="6" fill="#f1f5f9" />
      </g>

      {/* Mouth */}
      <path 
        d={`M 40 75 Q 60 ${curveValue} 80 75`} 
        fill="none" 
        stroke="#f1f5f9" 
        strokeWidth="5" 
        strokeLinecap="round"
        className="transition-[d] duration-300 ease-out"
      />
    </svg>
  );
};

export default Smiley;