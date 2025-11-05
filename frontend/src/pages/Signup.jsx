import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserPlus } from "lucide-react"; 

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      await signup(name, email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-black to-neutral-950 p-6">
      <div className="w-full max-w-md backdrop-blur-xl bg-neutral-900/80 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden transition-all hover:shadow-neutral-700/50 duration-300">
        <div className="bg-gradient-to-r from-neutral-800 via-neutral-900 to-black px-8 py-7 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" strokeWidth={1.8} />
            </div>
          </div>
          <h2 className="text-3xl font-semibold text-white tracking-tight">
            Create Account
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Join us to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-neutral-700 bg-neutral-800/70 focus:bg-neutral-900 p-3 w-full rounded-xl text-neutral-200 placeholder-neutral-500 focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-neutral-700 bg-neutral-800/70 focus:bg-neutral-900 p-3 w-full rounded-xl text-neutral-200 placeholder-neutral-500 focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-neutral-700 bg-neutral-800/70 focus:bg-neutral-900 p-3 w-full rounded-xl text-neutral-200 placeholder-neutral-500 focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              loading
                ? "bg-neutral-700 cursor-not-allowed"
                : "bg-gradient-to-r from-neutral-700 via-neutral-800 to-black hover:shadow-lg hover:shadow-neutral-800/40 hover:scale-[1.02]"
            }`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="px-8 py-4 bg-neutral-900/60 border-t border-neutral-800 text-center">
          <p className="text-sm text-neutral-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-white font-medium hover:text-neutral-200 transition-colors"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
