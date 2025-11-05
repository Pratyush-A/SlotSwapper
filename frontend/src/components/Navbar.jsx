import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between">
      <div className="space-x-4">
        <Link to="/">Dashboard</Link>
        <Link to="/marketplace">Marketplace</Link>
        <Link to="/requests">Requests</Link>
      </div>
      {user && (
        <div className="space-x-3">
          <span>{user.name}</span>
          <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">Logout</button>
        </div>
      )}
    </nav>
  );
}
