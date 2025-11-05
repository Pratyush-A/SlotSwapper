import { useEffect, useState } from "react";
import api from "../api/axios";
import { socket } from "../socket";
import { RefreshCw, ArrowLeftRight } from "lucide-react";

export default function Requests() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/swap-requests");
      setIncoming(res.data.incoming || []);
      setOutgoing(res.data.outgoing || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    socket.on("swapUpdated", fetchRequests);
    socket.on("eventUpdated", fetchRequests);

    return () => {
      socket.off("swapUpdated", fetchRequests);
      socket.off("eventUpdated", fetchRequests);
    };
  }, []);

  const respondToRequest = async (id, accept) => {
    try {
      await api.post(`/swap-response/${id}`, { accept });
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  const formatTime = (time) =>
    new Date(time).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-900 py-12 px-6 text-neutral-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
              <ArrowLeftRight className="w-7 h-7 text-white" strokeWidth={1.7} />
            </div>
            <h1 className="text-4xl font-semibold text-white">
              Swap Requests
            </h1>
          </div>
          <p className="text-neutral-400 text-sm text-center max-w-md">
            Review incoming and outgoing swap requests for your time slots.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-3" />
            <p>Loading requests...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
          
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-4">
                Incoming Requests
              </h2>
              {incoming.length === 0 ? (
                <p className="text-neutral-500">No incoming requests</p>
              ) : (
                incoming.map((req) => (
                  <div
                    key={req._id}
                    className="border border-neutral-700 rounded-xl p-4 mb-4 bg-neutral-800/60 hover:bg-neutral-800 transition-all duration-200"
                  >
                    <p className="font-medium text-neutral-200 mb-1">
                      <span className="text-emerald-400 font-semibold">
                        {req.requester?.name || "Unknown"}
                      </span>{" "}
                      wants to swap:
                    </p>
                    <p className="text-sm text-neutral-400 mb-2">
                      <strong className="text-neutral-300">Their Slot:</strong>{" "}
                      {req.mySlot?.title} <br />
                      {formatTime(req.mySlot?.startTime)} –{" "}
                      {formatTime(req.mySlot?.endTime)}
                    </p>
                    <p className="text-sm text-neutral-400 mb-4">
                      <strong className="text-neutral-300">Your Slot:</strong>{" "}
                      {req.theirSlot?.title} <br />
                      {formatTime(req.theirSlot?.startTime)} –{" "}
                      {formatTime(req.theirSlot?.endTime)}
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => respondToRequest(req._id, true)}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-green-700 text-white py-2 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.03] transition-all duration-200"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToRequest(req._id, false)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-rose-700 text-white py-2 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.03] transition-all duration-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-4">
                Outgoing Requests
              </h2>
              {outgoing.length === 0 ? (
                <p className="text-neutral-500">No outgoing requests</p>
              ) : (
                outgoing.map((req) => (
                  <div
                    key={req._id}
                    className="border border-neutral-700 rounded-xl p-4 mb-4 bg-neutral-800/60 hover:bg-neutral-800 transition-all duration-200"
                  >
                    <p className="text-sm text-neutral-300 mb-1">
                      To:{" "}
                      <strong className="text-white">
                        {req.responder?.name || "Unknown"}
                      </strong>
                    </p>
                    <p className="text-sm text-neutral-400">
                      <strong className="text-neutral-300">Offered Slot:</strong>{" "}
                      {req.mySlot?.title} <br />
                      {formatTime(req.mySlot?.startTime)} –{" "}
                      {formatTime(req.mySlot?.endTime)}
                    </p>
                    <p className="text-sm text-neutral-400 mt-2">
                      <strong className="text-neutral-300">Requested Slot:</strong>{" "}
                      {req.theirSlot?.title} <br />
                      {formatTime(req.theirSlot?.startTime)} –{" "}
                      {formatTime(req.theirSlot?.endTime)}
                    </p>
                    <p
                      className={`text-sm mt-3 font-semibold ${
                        req.status === "PENDING"
                          ? "text-amber-400"
                          : req.status === "ACCEPTED"
                          ? "text-emerald-400"
                          : "text-rose-500"
                      }`}
                    >
                      Status: {req.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
