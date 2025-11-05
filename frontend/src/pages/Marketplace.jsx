import { useEffect, useState } from "react";
import api from "../api/axios";
import SwapModal from "../components/SwapModal";

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
  }, []);

  const openSwapModal = (slot) => {
    setSelectedSlot(slot);
    setSwapModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Swappable Slots Marketplace
          </h1>
          <p className="text-gray-600">
            Browse available time slots and request swaps instantly
          </p>
        </div>

        
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-gray-500 text-lg animate-pulse">
              Loading slots...
            </p>
          </div>
        ) : slots.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-gray-500 text-lg">
              No swappable slots available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {slots.map((slot) => (
              <div
                key={slot._id}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    {slot.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {new Date(slot.startTime).toLocaleString()} —{" "}
                    {new Date(slot.endTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="font-medium">Owner:</span>{" "}
                    {slot.owner?.name || `User-${slot.owner?._id?.slice(-5)}`}
                  </p>
                </div>

                <button
                  onClick={() => openSwapModal(slot)}
                  className="mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold shadow hover:shadow-md hover:scale-[1.03] transition-all duration-200"
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
