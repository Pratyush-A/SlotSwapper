import { useEffect, useState } from "react";
import api from "../api/axios";

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

  const respondToRequest = async (id, accept) => {
    try {
      await api.post(`/swap-response/${id}`, { accept });
      setIncoming((prev) => prev.filter((req) => req._id !== id));
      setOutgoing((prev) => prev.filter((req) => req._id !== id));
    } catch (err) {
      console.error("Response failed:", err.response?.data || err);
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatTime = (time) =>
    new Date(time).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Swap Requests
          </h1>
          <p className="text-gray-600">
            Manage your incoming and outgoing swap requests
          </p>
        </div>

        
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-gray-500 text-lg animate-pulse">
              Loading requests...
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6">
              <h2 className="text-xl font-semibold text-blue-600 mb-4">
                Incoming Requests
              </h2>

              {incoming.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No incoming requests at the moment.
                </p>
              ) : (
                incoming.map((req) => (
                  <div
                    key={req._id}
                    className="border border-blue-100 rounded-xl bg-blue-50 p-4 mb-4 hover:bg-blue-100 transition-all"
                  >
                    <p className="font-medium text-gray-800 mb-2">
                      {req.requester?.name || "Unknown User"} wants to swap:
                    </p>

                    
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold text-gray-700">
                        Their Slot:
                      </span>{" "}
                      {req.mySlot?.title} <br />
                      <span className="ml-4 text-gray-500">
                        {formatTime(req.mySlot?.startTime)} —{" "}
                        {formatTime(req.mySlot?.endTime)}
                      </span>
                    </div>

                   
                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-semibold text-gray-700">
                        Your Slot:
                      </span>{" "}
                      {req.theirSlot?.title} <br />
                      <span className="ml-4 text-gray-500">
                        {formatTime(req.theirSlot?.startTime)} —{" "}
                        {formatTime(req.theirSlot?.endTime)}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => respondToRequest(req._id, true)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-lg font-semibold hover:shadow-md hover:scale-[1.02] transition-all"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToRequest(req._id, false)}
                        className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-2 rounded-lg font-semibold hover:shadow-md hover:scale-[1.02] transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6">
              <h2 className="text-xl font-semibold text-blue-600 mb-4">
                Outgoing Requests
              </h2>

              {outgoing.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No outgoing requests yet.
                </p>
              ) : (
                outgoing.map((req) => (
                  <div
                    key={req._id}
                    className="border border-gray-100 rounded-xl bg-white p-4 mb-4 hover:bg-blue-50 transition-all"
                  >
                    <p className="text-sm text-gray-700 mb-1">
                      Requested to:{" "}
                      <span className="font-semibold">
                        {req.responder?.name || "Unknown"}
                      </span>
                    </p>

                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Offered Slot:</span>{" "}
                      {req.mySlot?.title} <br />
                      <span className="ml-4 text-gray-500">
                        {formatTime(req.mySlot?.startTime)} —{" "}
                        {formatTime(req.mySlot?.endTime)}
                      </span>
                    </p>

                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-semibold">Requested Slot:</span>{" "}
                      {req.theirSlot?.title} <br />
                      <span className="ml-4 text-gray-500">
                        {formatTime(req.theirSlot?.startTime)} —{" "}
                        {formatTime(req.theirSlot?.endTime)}
                      </span>
                    </p>

                    <p
                      className={`text-sm mt-3 font-semibold ${
                        req.status === "PENDING"
                          ? "text-yellow-600"
                          : req.status === "ACCEPTED"
                          ? "text-green-600"
                          : "text-red-600"
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
