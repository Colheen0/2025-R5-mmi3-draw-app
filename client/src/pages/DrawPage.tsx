import { useEffect } from 'react'
import { AppHeader } from '../components/AppHeader/AppHeader'
import { DrawLayout } from '../components/DrawLayout/DrawLayout'
import { DrawArea} from '../components/DrawArea/drawArea'
import { DrawSocket } from '../DrawSocket'
import { useMyUserStore } from '../store/useMyUserStore'
import { useMyUsersStore } from '../store/useMyUsersStore'
import { createMyUser } from '../utils/create-my-user'
import { Instructions } from '../components/Instructions/Instructions'
import { UserList } from '../components/UserList/UserList'
import { getInstructions } from '../utils/get-instructions'

function DrawPage() {
  const setMyUser = useMyUserStore((state) => state.setMyUser);
  const setMyUsers = useMyUsersStore((state) => state.setMyUsers);
  const users = useMyUsersStore((state) => state.users); 

  const onClickJoin = () => {
    DrawSocket.emit("myUser:join", createMyUser() );
  }

  useEffect(() => {
    DrawSocket.get('users').then((data) => { if (data){
      setMyUsers(data.users);}})
     }, [setMyUsers]);

  useEffect(() => {
    DrawSocket.listen("myUser:joined", (data) => {
      setMyUser(data.user);

      console.log("My User joined:success", data);
    });
    return () => {
      DrawSocket.off("myUser:joined");
    }
  }, [setMyUser]);

  useEffect(() => {
    DrawSocket.listen("users:updated", (data) => {
      setMyUsers(data.users);

      console.log("My User updated:success", data);
    });
    return () => {
      DrawSocket.off("users:updated");
    }
  }, [setMyUsers]);

  return (
    <DrawLayout
      topArea={<AppHeader 
        onClickJoin={onClickJoin}
        
      />}
      rightArea={
        <>
          <UserList users= {users}/>
        </>
      }
      bottomArea={
        <>
          <Instructions>
            {getInstructions('toolbar')}
          </Instructions>
        </>
      }
    >
      {/*<Instructions>
        {getInstructions('draw-area')}
      </Instructions>*/}
      <DrawArea/>
    </DrawLayout>
  )
}

export default DrawPage;
