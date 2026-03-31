export default function Navbar({ user, onLogout }) {
  return (
    <nav className="flex justify-between px-8 py-4 border-b border-slate-700 bg-slate-800">
      <div className="text-indigo-400 font-bold text-xl">ARKA Auditor</div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-slate-300 text-sm">{user.username}</span>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-red-400 text-sm transition-colors"
            >
              Logout
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
}