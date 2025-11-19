type Props = {
  users: Array<{username: string, avatar: string;}>;
}

export function UserList({users}: Props) {
  return<div className="list">
    {users.map((user) => <div className="list-row" key={user.username}><div className="my-user-badge badge badge-lg badge-primary badge-soft"><div className="avatar"><div className="w-4 rounded-full"><img className="size-10 rounded-box" src={user.avatar} alt={user.username}></img></div></div>{user.username}</div></div>)}
  </div>
  }