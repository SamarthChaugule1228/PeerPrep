import React, { useState } from 'react';

const StarRating = ({ label, value, onChange }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl transition-colors"
          >
            <span className={star <= (hover || value) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}>
              ★
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StarRating;