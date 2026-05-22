import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/30 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default Loader;