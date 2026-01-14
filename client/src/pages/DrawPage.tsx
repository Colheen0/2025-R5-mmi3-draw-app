import { useState } from 'react'; 
import { AppHeader } from '../shared/components/AppHeader/AppHeader';
import { DrawLayout } from '../shared/components/layouts/DrawLayout/DrawLayout';
import { UserList } from '../features/user/components/UserList';
import { useUpdatedUserList } from '../features/user/hooks/useUpdatedUserList';
import { useJoinMyUser } from '../features/user/hooks/useJoinMyUser';
import { DrawArea } from '../features/drawing/components/DrawArea';
import { DrawToolbar } from '../features/drawing/components/Toolbar';
import type { Tool } from '../features/drawing/components/Toolbar';
import { SocketManager } from '../shared/services/SocketManager';
import { useMyUserStore } from '../features/user/store/useMyUserStore';

function DrawPage() {
  const { joinMyUser } = useJoinMyUser();
  const { userList } = useUpdatedUserList();
  // AJOUT : Récupération du profil de l'utilisateur connecté
  const { myUser } = useMyUserStore();

  // ÉTATS GLOBAUX
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);

  // LOGIQUE : Changement de couleur + Synchronisation profil
  const handleColorChange = (newColor: string) => {
    // 1. On change la couleur locale du pinceau
    setStrokeColor(newColor);
    
    // 2. On informe le serveur pour mettre à jour la pastille dans la liste
    if (myUser) {
      SocketManager.emit('myUser:edit', myUser.id, { color: newColor });
    }
  };

  // FONCTION : Tout effacer
  const handleClearAll = () => {
    if (window.confirm("Voulez-vous vraiment vider tout le canvas pour tout le monde ?")) {
      SocketManager.emit('draw:clear');
    }
  };

  return (
    <DrawLayout
      topArea={
        <AppHeader onClickJoin={() => joinMyUser()} />
      }
      rightArea={
        <UserList users={userList} />
      }
      bottomArea={
        <div className="pointer-events-auto flex justify-center pb-4">
            <DrawToolbar 
              activeTool={activeTool} 
              onToolChange={setActiveTool} 
              strokeColor={strokeColor}
              // CORRECTION : On utilise handleColorChange au lieu de setStrokeColor
              onColorChange={handleColorChange} 
              strokeWidth={strokeWidth}
              onWidthChange={setStrokeWidth}
              onClearAll={handleClearAll}
            />
        </div>
      }
    >
      <DrawArea 
        strokeColor={strokeColor} 
        strokeWidth={strokeWidth}
      />
    </DrawLayout>
  );
}

export default DrawPage;