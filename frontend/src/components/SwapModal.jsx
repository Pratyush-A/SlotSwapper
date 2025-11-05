import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import api from "../api/axios";

Modal.setAppElement("#root");

export default function SwapModal({ isOpen, onClose, targetSlot, onSwapRequest }) {
  const [mySwappables, setMySwappables] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get("/events/me").then((res) => {
        const data = res.data.filter((e) => e.status === "SWAPPABLE");
        setMySwappables(data);
      });
    }
  }, [isOpen]);

  const handleSwap = async () => {
    if (!selected) return alert("Please select one of your swappable slots!");
    setLoading(true);
    try {
      await api.post("/swap-request", {
        mySlotId: selected,
        theirSlotId: targetSlot._id,
      });
      onSwapRequest();
      onClose();
      alert("Swap request sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Error sending swap request!");
    } finally {
      setLoading(false);
    }
  };

  if (!targetSlot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={true}
      className="relative bg-white rounded-2xl shadow-2xl p-6 w-[380px] sm:w-[420px] z-[1001] transition-all"
      overlayClassName={`fixed inset-0 flex justify-center items-center transition-all duration-300 z-[1000] ${
        isOpen ? "bg-black/40 backdrop-blur-sm pointer-events-auto opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <h2 className="text-2xl font-semibold mb-2 text-blue-600 text-center">
        Request Swap
      </h2>

      <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
        <p className="font-semibold text-gray-800 mb-1">{targetSlot.title}</p>
        <p className="text-gray-600 text-sm">
          {new Date(targetSlot.startTime).toLocaleString()} —{" "}
          {new Date(targetSlot.endTime).toLocaleString()}
        </p>
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-gray-700 font-medium">
          Select one of your swappable slots:
        </label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="border w-full rounded p-2 focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="">-- Select slot --</option>
          {mySwappables.length === 0 && (
            <option disabled>No swappable slots available</option>
          )}
          {mySwappables.map((s) => (
            <option key={s._id} value={s._id}>
              {s.title} ({new Date(s.startTime).toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={handleSwap}
          disabled={loading}
          className={`px-4 py-2 rounded text-white font-semibold ${
            loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } transition`}
        >
          {loading ? "Sending..." : "Send Request"}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
