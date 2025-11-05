import { useEffect, useState } from "react";
import api from "../api/axios";
import SwapModal from "../components/SwapModal";
import { socket } from "../socket";
import { Store, Clock } from "lucide-react";

export default function Marketplace() {
  const [slots, setSlots] = useState([]);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSlots = async () => {
    try {
      const res = await api.get("/swappable-slots");
      setSlots(res.data);
    } catch (err) {
      console.error("Error fetching swappable slots", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();

    socket.on("swapUpdated", fetchSlots);
    socket.on("eventUpdated", fetchSlots);

    return () => {
      socket.off("swapUpdated", fetchSlots);
      socket.off("eventUpdated", fetchSlots);
    };
  }, []);

  const openSwapModal = (slot) => {
    setSelectedSlot(slot);
    setSwapModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-900 py-12 px-6 text-neutral-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
              <Store className="w-7 h-7 text-white" strokeWidth={1.7} />
            </div>
            <h1 className="text-4xl font-semibold text-white">
              Swappable Slots Marketplace
            </h1>
          </div>
          <p className="text-neutral-400 text-sm text-center max-w-md">
            Discover available time slots marked as swappable and request a
            trade instantly.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-neutral-400">Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="text-center text-neutral-500">
            No swappable slots available right now.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {slots.map((slot) => (
              <div
                key={slot._id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-2xl shadow-lg hover:shadow-neutral-800/40 hover:scale-[1.02] p-6 transition-all duration-200 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white truncate">
                    {slot.title}
                  </h2>
                  <Clock className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-400">
                  {new Date(slot.startTime).toLocaleString()} –{" "}
                  {new Date(slot.endTime).toLocaleString()}
                </p>
                <p className="text-sm text-neutral-500 mt-2">
                  Owner:{" "}
                  <span className="text-neutral-300">
                    {slot.owner?.name || "User"}
                  </span>
                </p>

                <button
                  onClick={() => openSwapModal(slot)}
                  className="mt-5 w-full bg-gradient-to-r from-neutral-700 via-neutral-800 to-black text-white py-2.5 rounded-lg font-semibold hover:shadow-md hover:shadow-neutral-800/50 hover:scale-[1.03] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Request Swap
                </button>
              </div>
            ))}
          </div>
        )}

        <SwapModal
          isOpen={swapModalOpen}
          onClose={() => setSwapModalOpen(false)}
          targetSlot={selectedSlot}
          onSwapRequest={fetchSlots}
        />
      </div>
    </div>
  );
}
