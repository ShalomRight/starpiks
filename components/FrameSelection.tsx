
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { type Frame } from '../types';
import { FRAMES, CATEGORIES } from '../constants';

interface FrameSelectionProps {
  onSelectFrame: (frame: Frame) => void;
  onBack: () => void;
}

const FrameSelection: React.FC<FrameSelectionProps> = ({ onSelectFrame, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState('All Frames');
  
  const filteredFrames = selectedCategory === 'All Frames' 
    ? FRAMES 
    : FRAMES.filter(f => f.category === selectedCategory.toLowerCase());
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold">Select a Frame</h2>
          <div className="w-10" />
        </div>
        
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4 pb-24">
        {filteredFrames.map(frame => (
          <button
            key={frame.id}
            onClick={() => onSelectFrame(frame)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <div className="aspect-square bg-gray-100">
              <img src={frame.url} alt={frame.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 text-left">
              <h3 className="font-semibold text-sm">{frame.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{frame.category}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default FrameSelection;
