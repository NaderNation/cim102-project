import React from "react";

const houses = [
  "modern-stone.jpg", "coastal.jpg", "brick-colonial.jpg",
  "modern-stucco.jpg", "log-cabin.jpg", "estate-garden.jpg",
  "modern-white.jpg", "timber-contemporary.jpg", "waterfront-estate.jpg",
].map((name) => `${import.meta.env.BASE_URL}houses/${name}`);

const rows = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [5, 2, 7, 0, 8, 3, 6, 1, 4],
];

export default function MovingHouseCollage() {
  return (
    <div className="ef-house-collage" aria-hidden="true">
      {rows.map((row, rowIndex) => (
        <div className={`ef-collage-track ef-collage-track-${rowIndex + 1}`} key={rowIndex}>
          {[...row, ...row].map((index, imageIndex) => (
            <img
              src={houses[index]}
              alt=""
              className="ef-collage-tile"
              key={`${rowIndex}-${imageIndex}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
