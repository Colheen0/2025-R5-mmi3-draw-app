import React from 'react';

// On définit le type ici pour qu'il soit réutilisable si besoin
export type Tool = 'pen' | 'fill';

interface DrawToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  strokeColor: string;              
  onColorChange: (color: string) => void; 
  strokeWidth?: number;
  onWidthChange?: (width: number) => void;
  onClearAll: () => void;
}

export const DrawToolbar: React.FC<DrawToolbarProps> = 
({ activeTool,
   onToolChange,
    strokeColor,
    onColorChange,
    strokeWidth,
    onWidthChange,
    onClearAll
  }) => {
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
      <button 
        onClick={onClearAll} 
        style={{ padding: '8px 12px', border: '1px solid red', color: 'red', cursor: 'pointer', borderRadius: '4px' }}
      >
        Tout effacer 🗑️
      </button>
    {/* Séparateur visuel */}
      <div style={{ borderLeft: '1px solid #ccc', height: '24px', margin: '0 8px' }} />

      {/* Sélecteur de couleur */}
      <div className="flex items-center gap-2">
        <label htmlFor="colorPicker" style={{ fontSize: '14px' }}>Couleur :</label>
        <input
          id="colorPicker"
          type="color"
          value={strokeColor}
          onChange={(e) => onColorChange(e.target.value)}
          style={{ cursor: 'pointer', border: 'none', background: 'none', width: '30px', height: '30px' }}
        />
      </div>

      <div style={{ borderLeft: '1px solid #ccc', height: '24px', margin: '0 8px' }} />

      {/* NOUVEAU : Sélecteur d'épaisseur */}
      <div className="flex items-center gap-2">
        <label htmlFor="widthPicker" className="text-sm">Taille : {strokeWidth}px</label>
        <input
          id="widthPicker"
          type="range"
          min="1"
          max="50"
          value={strokeWidth}
          onChange={(e) => onWidthChange?.(parseInt(e.target.value))}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
};