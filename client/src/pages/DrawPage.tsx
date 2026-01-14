import { useState } from 'react'; // CHANGEMENT : Import useState
import { AppHeader } from '../shared/components/AppHeader/AppHeader';
import { DrawLayout } from '../shared/components/layouts/DrawLayout/DrawLayout';
import { UserList } from '../features/user/components/UserList';
import { useUpdatedUserList } from '../features/user/hooks/useUpdatedUserList';
import { useJoinMyUser } from '../features/user/hooks/useJoinMyUser';
import { DrawArea } from '../features/drawing/components/DrawArea';
import { DrawToolbar } from '../features/drawing/components/Toolbar';
import type { Tool } from '../features/drawing/components/Toolbar'; // Import du type Tool
function DrawPage() {
  const { joinMyUser } = useJoinMyUser();
  const { userList } = useUpdatedUserList();


  // CHANGEMENT : L'état vit ici maintenant (Lift State Up)
  const [activeTool, setActiveTool] = useState<Tool>('pen');

  return (
    <DrawLayout
      topArea={
        <AppHeader onClickJoin={() => joinMyUser()} />
      }
      rightArea={
        <UserList users={userList} />
      }
      bottomArea={
        // CHANGEMENT : On remplace les instructions par la Toolbar
        <div className="pointer-events-auto flex justify-center pb-4">
           <DrawToolbar activeTool={activeTool} onToolChange={setActiveTool} />
        </div>
      }
    >
      {/* CHANGEMENT : On passe l'outil actif à DrawArea */}
      <DrawArea activeTool={activeTool} />
    </DrawLayout>
  )
}

export default DrawPage;