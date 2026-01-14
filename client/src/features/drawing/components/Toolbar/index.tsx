import React from 'react';

// On définit le type ici pour qu'il soit réutilisable si besoin
export type Tool = 'pen' | 'eraser';

interface DrawToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

export const DrawToolbar: React.FC<DrawToolbarProps> = ({ activeTool, onToolChange }) => {
  // Petite fonction utilitaire pour le style des boutons
  const buttonStyle = (toolName: Tool) => ({
    padding: '8px 12px',
    background: activeTool === toolName ? 'black' : 'white',
    color: activeTool === toolName ? 'white' : 'black',
    border: '1px solid black',
    cursor: 'pointer',
    borderRadius: '4px',
    fontWeight: activeTool === toolName ? 'bold' : 'normal',
    minWidth: '80px',
    textAlign: 'center' as const
  });

  return (
    <div className="flex gap-2 p-2 bg-white rounded shadow-sm">
      <button onClick={() => onToolChange('pen')} style={buttonStyle('pen')}>
        Crayon
      </button>
      <button onClick={() => onToolChange('eraser')} style={buttonStyle('eraser')}>
        Gomme
      </button>
    </div>
  );
};