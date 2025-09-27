
import React, { useState, useCallback } from 'react';
import { extractMovieIds } from './services/geminiService';
import type { MovieData } from './types';
import FileUpload from './components/FileUpload';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const DATABASES: { [key: string]: { name: string } } = {
  imdb: { name: 'IMDb' },
  tmdb: { name: 'The Movie Database (TMDb)' },
  rotten_tomatoes: { name: 'Rotten Tomatoes' },
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<MovieData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('imdb');

  const processContent = useCallback(async (content: string, sourceName: string) => {
    if (!content.trim()) {
      setError(`The ${sourceName === 'pasted list' ? 'pasted text' : 'uploaded file'} is empty. Please provide a list of movie titles.`);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);
    setFileName(sourceName);

    try {
      const data = await extractMovieIds(content, selectedDatabase);
      setResults(data);
    } catch (e) {
      console.error(e);
      setError('Failed to process the movie list. The API might be busy or an error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDatabase]);
  
  const handleFileProcess = useCallback((content: string, name: string) => {
     processContent(content, name);
  }, [processContent]);

  const handlePasteProcess = useCallback(() => {
    processContent(pasteContent, 'pasted list');
  }, [processContent, pasteContent]);

  const handleDownloadCsv = () => {
    if (!results) return;

    const dbInfo = DATABASES[selectedDatabase];
    const headers = ['"Movie Title"', `"${dbInfo.name} ID"`];
    const rows = results.map(item => 
      `"${(item.movieTitle || '').replace(/"/g, '""')}","${(item.databaseId || '').replace(/"/g, '""')}"`
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'movie_ids_extraction.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const TabButton: React.FC<{ tabId: 'upload' | 'paste'; children: React.ReactNode }> = ({ tabId, children }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      disabled={isLoading}
      className={`flex-1 py-3 px-4 text-sm font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:cursor-not-allowed ${
        activeTab === tabId
          ? 'bg-slate-700/80 text-white'
          : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/60'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700">
          
          <div className="p-6 md:p-8 border-b border-slate-700">
            <label htmlFor="database-select" className="block text-sm font-medium text-gray-400 mb-2">
              Select Database to Extract IDs From:
            </label>
            <select
              id="database-select"
              value={selectedDatabase}
              onChange={(e) => setSelectedDatabase(e.target.value)}
              disabled={isLoading}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200 text-gray-200 p-3"
              aria-label="Select database for extraction"
            >
              {Object.entries(DATABASES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex border-b border-slate-700">
            <TabButton tabId="upload">Upload File</TabButton>
            <TabButton tabId="paste">Paste Text</TabButton>
          </div>
          
          <div className="p-6 md:p-8">
            <p className="text-center text-gray-400 mb-6">
              {activeTab === 'upload' 
                ? 'Upload a text file (.txt, .csv) with a list of movie titles, one per line.'
                : 'Paste a list of movie titles, one per line, into the text area below.'}
            </p>
            
            {activeTab === 'upload' && (
              <FileUpload onFileProcess={handleFileProcess} disabled={isLoading} />
            )}

            {activeTab === 'paste' && (
              <div className="flex flex-col space-y-4">
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  disabled={isLoading}
                  rows={8}
                  className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200 placeholder-gray-500 text-gray-200 resize-y"
                  placeholder="The Shawshank Redemption&#10;The Godfather&#10;The Dark Knight&#10;..."
                  aria-label="Paste movie list"
                />
                <button
                  onClick={handlePasteProcess}
                  disabled={isLoading || !pasteContent.trim()}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>{isLoading ? 'Processing...' : 'Extract from Text'}</span>
                </button>
              </div>
            )}

            {isLoading && (
              <div className="mt-8 text-center">
                <Loader />
                <p className="mt-4 text-lg text-blue-400 animate-pulse">
                  Extracting IDs from <span className="font-semibold">{fileName}</span>...
                </p>
                <p className="text-sm text-gray-500">This may take a moment.</p>
              </div>
            )}

            {error && (
              <div className="mt-8 text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                <p className="font-bold">An Error Occurred</p>
                <p>{error}</p>
              </div>
            )}

            {results && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <h2 className="text-2xl font-bold text-gray-100">Extraction Results</h2>
                  <button 
                    onClick={handleDownloadCsv}
                    className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out flex items-center justify-center space-x-2"
                    aria-label="Download results as CSV"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download CSV</span>
                  </button>
                </div>
                <ResultsDisplay results={results} database={selectedDatabase} />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
