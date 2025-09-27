
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="p-4 text-center">
      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
        IMDb ID Extractor
      </h1>
      <p className="text-gray-400 mt-1">Powered by Gemini</p>
    </header>
  );
};
