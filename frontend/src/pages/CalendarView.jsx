import { useEffect, useState } from "react";
import { socket } from "../socket";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../api/axios";
import moment from "moment";
import SwapModal from "../components/SwapModal";
import { Plus, X, AlertTriangle } from "lucide-react";

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState(null);
  const [creatingEvent, setCreatingEvent] = useState({
    title: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });
  const [toast, setToast] = useState({ visible: false, message: "" });

  const fetchEvents = async () => {
    try {
      const [myRes, othersRes] = await Promise.all([
        api.get("/events/me"),
        api.get("/events/other-events"),
      ]);

      const formatted = [
        ...myRes.data.map((e) => ({
          id: e._id,
          title: e.title + (e.status !== "BUSY" ? ` (${e.status})` : ""),
          start: e.startTime,
          end: e.endTime,
          backgroundColor:
            e.status === "SWAPPABLE"
              ? "#10b981"
              : e.status === "SWAP_PENDING"
                ? "#f59e0b"
                : "#3b82f6",
          borderColor:
            e.status === "SWAPPABLE"
              ? "#047857"
              : e.status === "SWAP_PENDING"
                ? "#d97706"
                : "#1e40af",
          textColor: "#ffffff",
          extendedProps: { owner: "me", raw: e },
        })),
        ...othersRes.data.map((e) => ({
          id: e._id,
          title: `${e.title} (${e.status})`,
          start: e.startTime,
          end: e.endTime,
          backgroundColor:
            e.status === "SWAPPABLE" ? "#8b5cf6" : "#4b5563",
          borderColor:
            e.status === "SWAPPABLE" ? "#7e22ce" : "#374151",
          textColor: "#ffffff",
          extendedProps: { owner: "other", raw: e },
        })),
      ];

      setEvents(formatted);
    } catch (err) {
      console.error("Error loading events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();

    socket.on("eventUpdated", fetchEvents);
    socket.on("swapUpdated", fetchEvents);

    return () => {
      socket.off("eventUpdated");
      socket.off("swapUpdated");
    };
  }, []);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 3000);
  };

  const handleDateClick = (info) => {
    setCreatingEvent({
      title: "",
      startDate: info.dateStr,
      startTime: "",
      endDate: info.dateStr,
      endTime: "",
    });
    setTargetSlot(null);
    setEventModalOpen(true);
  };

  const handleEventClick = (info) => {
    const { raw, owner } = info.event.extendedProps;

    if (owner === "me") {
      if (raw.status === "SWAP_PENDING") {
        showToast(
          "This slot has a pending swap request. You’ll be notified once it’s accepted or rejected."
        );
        return;
      }

      setTargetSlot(raw);
      setEventModalOpen(true);
      return;
    }

    if (raw.status !== "SWAPPABLE") {
      showToast("This event cannot be swapped.");
      return;
    }

    setTargetSlot(raw);
    setSwapModalOpen(true);
  };

  const handleCreateEvent = async () => {
    const { title, startDate, startTime, endDate, endTime } = creatingEvent;
    if (!title || !startDate || !startTime || !endDate || !endTime) {
      showToast("Please fill in all event details.");
      return;
    }

    const start = moment(`${startDate}T${startTime}`).toISOString();
    const end = moment(`${endDate}T${endTime}`).toISOString();

    try {
      await api.post("/events", { title, startTime: start, endTime: end });
      setEventModalOpen(false);
      fetchEvents();
    } catch (err) {
      if (err.response?.status === 409) {
        const { conflict } = err.response.data;
        showToast(
          `Time slot already booked by ${conflict?.owner?.name || "someone"}.`
        );
      } else {
        showToast("Error creating event.");
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/events/${id}`, { status });
      fetchEvents();
      setEventModalOpen(false);
    } catch {
      showToast("Status update failed.");
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await api.delete(`/events/${id}`);
      setEventModalOpen(false);
      fetchEvents();
    } catch {
      showToast("Error deleting event.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-900 relative text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-semibold text-white mb-2">
                My Calendar
              </h1>
              <p className="text-neutral-400">
                Manage your schedule and swap time slots effortlessly
              </p>
            </div>
            <button
              onClick={() => {
                setTargetSlot(null);
                setCreatingEvent({
                  title: "",
                  startDate: "",
                  startTime: "",
                  endDate: "",
                  endTime: "",
                });
                setEventModalOpen(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-neutral-700 via-neutral-800 to-black text-white px-6 py-3 rounded-xl shadow-md hover:shadow-neutral-800/40 hover:scale-[1.03] transition-all duration-200 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Event
            </button>
          </div>

          <div className="bg-neutral-900/60 rounded-xl border border-neutral-800 p-4 backdrop-blur-sm shadow-lg">
            <div className="flex flex-wrap items-center gap-5 text-sm">
              <Legend color="bg-blue-500" label="My Busy" />
              <Legend color="bg-emerald-500" label="My Swappable" />
              <Legend color="bg-amber-500" label="Swap Pending" />
              <Legend color="bg-gray-600" label="Others' Busy" />
              <Legend color="bg-purple-500" label="Others' Swappable" />
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/70 rounded-2xl shadow-xl border border-neutral-800 p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="75vh"
            selectable
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            headerToolbar={{
              start: "prev,next today",
              center: "title",
              end: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            eventDisplay="block"
            eventContent={(arg) => (
              <div className="text-xs font-semibold leading-tight px-1">
                <div className="truncate">{arg.event.title}</div>
              </div>
            )}
          />
        </div>
      </div>

      {eventModalOpen && (
        <EventModal
          targetSlot={targetSlot}
          creatingEvent={creatingEvent}
          setCreatingEvent={setCreatingEvent}
          onClose={() => setEventModalOpen(false)}
          onCreate={handleCreateEvent}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteEvent}
        />
      )}

      <SwapModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        targetSlot={targetSlot}
        onSwapRequest={fetchEvents}
      />

      <div
        className={`fixed z-50 left-1/2 transform -translate-x-1/2 px-6 py-4 text-white rounded-xl shadow-2xl transition-all duration-500 flex items-center gap-3 ${toast.visible
            ? "bottom-8 opacity-100 scale-100"
            : "bottom-[-80px] opacity-0 scale-95"
          } bg-gradient-to-r from-red-500 to-rose-600`}
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium">{toast.message}</span>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-4 rounded-md ${color} border border-neutral-700`}
      ></div>
      <span className="text-neutral-300 text-sm">{label}</span>
    </div>
  );
}

function EventModal({
  targetSlot,
  creatingEvent,
  setCreatingEvent,
  onClose,
  onCreate,
  onStatusChange,
  onDelete,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
      <div className="bg-neutral-900 text-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-800 p-6 relative">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
          <h2 className="text-2xl font-semibold">
            {!targetSlot ? "Create Event" : "Manage Event"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!targetSlot ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Event Title"
              value={creatingEvent.title}
              onChange={(e) =>
                setCreatingEvent({ ...creatingEvent, title: e.target.value })
              }
              className="bg-neutral-800 border border-neutral-700 p-3 w-full rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={creatingEvent.startDate}
                onChange={(e) =>
                  setCreatingEvent({
                    ...creatingEvent,
                    startDate: e.target.value,
                  })
                }
                className="bg-neutral-800 border border-neutral-700 p-3 rounded-lg focus:ring-2 focus:ring-neutral-500 text-white"
              />
              <input
                type="time"
                value={creatingEvent.startTime}
                onChange={(e) =>
                  setCreatingEvent({
                    ...creatingEvent,
                    startTime: e.target.value,
                  })
                }
                className="bg-neutral-800 border border-neutral-700 p-3 rounded-lg focus:ring-2 focus:ring-neutral-500 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={creatingEvent.endDate}
                onChange={(e) =>
                  setCreatingEvent({
                    ...creatingEvent,
                    endDate: e.target.value,
                  })
                }
                className="bg-neutral-800 border border-neutral-700 p-3 rounded-lg focus:ring-2 focus:ring-neutral-500 text-white"
              />
              <input
                type="time"
                value={creatingEvent.endTime}
                onChange={(e) =>
                  setCreatingEvent({
                    ...creatingEvent,
                    endTime: e.target.value,
                  })
                }
                className="bg-neutral-800 border border-neutral-700 p-3 rounded-lg focus:ring-2 focus:ring-neutral-500 text-white"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={onCreate}
                className="flex-1 bg-gradient-to-r from-neutral-700 via-neutral-800 to-black text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition"
              >
                Create
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-neutral-800 text-neutral-300 py-3 rounded-lg font-semibold hover:bg-neutral-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
              <h3 className="font-semibold text-lg mb-1">
                {targetSlot.title}
              </h3>
              <p className="text-sm text-neutral-400">
                {moment(targetSlot.startTime).format("DD MMM, h:mm A")} –{" "}
                {moment(targetSlot.endTime).format("h:mm A")}
              </p>
            </div>
            <button
              onClick={() =>
                onStatusChange(
                  targetSlot._id,
                  targetSlot.status === "SWAPPABLE" ? "BUSY" : "SWAPPABLE"
                )
              }
              className="w-full bg-gradient-to-r from-emerald-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition"
            >
              {targetSlot.status === "SWAPPABLE"
                ? "Mark as Busy"
                : "Make Swappable"}
            </button>
            <button
              onClick={() => onDelete(targetSlot._id)}
              className="w-full bg-gradient-to-r from-red-600 to-rose-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition"
            >
              Delete Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
