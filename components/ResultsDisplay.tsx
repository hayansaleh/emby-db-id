
import React from 'react';
import type { MovieData } from '../types';

interface ResultsDisplayProps {
  results: MovieData[];
  database: string;
}

const DATABASE_INFO: { [key: string]: { name: string } } = {
  imdb: { name: 'IMDb' },
  tmdb: { name: 'TMDb' },
  rotten_tomatoes: { name: 'Rotten Tomatoes' },
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, database }) => {
  if (results.length === 0) {
    return (
      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
        <p className="text-gray-400">No movie data was extracted. The file might be empty or the format unrecognized.</p>
      </div>
    );
  }

  const dbInfo = DATABASE_INFO[database] || DATABASE_INFO.imdb;

  const generateLink = (id: string): string | null => {
    if (id === 'N/A' || !id) return null;
    switch (database) {
      case 'imdb':
        return `https://www.imdb.com/title/${id}/`;
      case 'tmdb':
        return `https://www.themoviedb.org/movie/${id}`;
      case 'rotten_tomatoes':
        return id; // The ID is the full URL
      default:
        return null;
    }
  };


  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left bg-slate-800">
          <thead className="bg-slate-900/70">
            <tr>
              <th scope="col" className="px-6 py-3 text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Movie Title
              </th>
              <th scope="col" className="px-6 py-3 text-sm font-semibold text-gray-300 uppercase tracking-wider">
                {dbInfo.name} ID / Link
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {results.map((item, index) => {
              const link = generateLink(item.databaseId);
              return (
                <tr key={index} className="hover:bg-slate-700/50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-200 font-medium">
                    {item.movieTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200"
                      >
                        {item.databaseId}
                      </a>
                    ) : (
                      <span className="text-gray-500">{item.databaseId || 'N/A'}</span>
                    )}
                  </td>
                </tr>
              )}
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsDisplay;
