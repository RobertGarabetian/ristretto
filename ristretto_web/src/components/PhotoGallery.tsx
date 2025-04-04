"use client";
import React, { useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface PhotoGalleryProps {
  photos: string[];
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  if (!photos || photos.length === 0) {
    return (
      <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No photos available</p>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  const goToPrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Handle keyboard navigation for the lightbox
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showLightbox) return;

      switch (e.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          closeLightbox();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox]);

  return (
    <>
      {/* Photo grid */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Photos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.slice(0, 6).map((photo, index) => (
            <div
              key={index}
              className="aspect-w-1 aspect-h-1 relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <img
                src={photo}
                alt={`Coffee shop photo ${index + 1}`}
                className="object-cover w-full h-full hover:opacity-90 transition-opacity"
                onError={(e) => {
                  console.log(e);
                  e.currentTarget.src = "/vercel.svg?height=300&width=300";
                }}
              />
            </div>
          ))}
        </div>
        {photos.length > 6 && (
          <p
            className="text-sm text-blue-600 mt-2 cursor-pointer"
            onClick={() => openLightbox(6)}
          >
            +{photos.length - 6} more photos
          </p>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-gray-800"
            aria-label="Close lightbox"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <button
            onClick={goToPrevious}
            className="absolute left-4 text-white p-2 rounded-full hover:bg-gray-800"
            aria-label="Previous photo"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>

          <div className="max-w-4xl max-h-[80vh] flex items-center justify-center">
            <img
              src={photos[currentPhotoIndex]}
              alt={`Coffee shop photo ${currentPhotoIndex + 1}`}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                console.log(e);
                e.currentTarget.src = "";
              }}
            />
          </div>

          <button
            onClick={goToNext}
            className="absolute right-4 text-white p-2 rounded-full hover:bg-gray-800"
            aria-label="Next photo"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>

          <div className="absolute bottom-4 text-white">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
