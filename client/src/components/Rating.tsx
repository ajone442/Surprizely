import React, { useState } from "react";
import { Star, StarHalf } from "lucide-react";

interface RatingProps {
  value: number;
  readonly?: boolean;
  onChange?: (rating: number) => void;
  disabled?: boolean;
}

export function Rating({ value = 0, readonly = false, onChange, disabled = false }: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const filledStars = Math.floor(value);
  const hasHalfStar = value - filledStars >= 0.5;

  const renderStar = (index: number) => {
    // If hovering and not readonly, show hover state
    if (hoverValue !== null && index < hoverValue && !readonly) {
      return <Star className="fill-primary text-primary h-4 w-4" />;
    }

    // Normal display logic
    if (index < filledStars) {
      return <Star className="fill-primary text-primary h-4 w-4" />;
    } else if (index === filledStars && hasHalfStar) {
      return <StarHalf className="fill-primary text-primary h-4 w-4" />;
    } else {
      return <Star className="text-muted-foreground h-4 w-4" />;
    }
  };

  const handleClick = (index: number) => {
    if (readonly || disabled || !onChange) return;
    onChange(index + 1); // Add 1 to convert from 0-based index to 1-5 rating
  };

  const handleMouseEnter = (index: number) => {
    if (!readonly && !disabled) {
      setHoverValue(index + 1);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  return (
    <div 
      className={`flex items-center ${disabled ? 'opacity-50' : ''}`}
      onMouseLeave={handleMouseLeave}
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <span 
          key={index} 
          className={readonly || disabled ? "" : "cursor-pointer hover:scale-110 transition-transform"}
          onClick={() => handleClick(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          title={`${index + 1} star${index === 0 ? '' : 's'}`}
        >
          {renderStar(index)}
        </span>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}