import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogOut, LayoutDashboard, Store, Shuffle } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-black shadow-lg sticky top-0 z-50 border-b border-neutral-800 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className="flex items-center gap-2 text-neutral-200 px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 hover:text-white transition-all duration-200 hover:scale-[1.05]"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to="/marketplace"
              className="flex items-center gap-2 text-neutral-200 px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 hover:text-white transition-all duration-200 hover:scale-[1.05]"
            >
              <Store className="w-4 h-4" />
              Marketplace
            </Link>
            <Link
              to="/requests"
              className="flex items-center gap-2 text-neutral-200 px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 hover:text-white transition-all duration-200 hover:scale-[1.05]"
            >
              <Shuffle className="w-4 h-4" />
              Requests
            </Link>
          </div>

          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2 bg-neutral-800/60 px-4 py-2 rounded-lg backdrop-blur-sm border border-neutral-700">
                <User className="w-5 h-5 text-neutral-300" />
                <span className="text-neutral-100 font-medium">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-neutral-700 via-neutral-800 to-black text-white px-5 py-2 rounded-lg font-semibold hover:shadow-md hover:shadow-neutral-800/40 hover:scale-[1.05] transition-all duration-200 flex items-center gap-2 border border-neutral-700"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
