import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../api/axios";
import moment from "moment";
import SwapModal from "../components/SwapModal";

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
              : "#2563eb",
          borderColor:
            e.status === "SWAPPABLE"
              ? "#059669"
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
            e.status === "SWAPPABLE" ? "#a855f7" : "#6b7280",
          borderColor:
            e.status === "SWAPPABLE" ? "#7e22ce" : "#4b5563",
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
    } catch (err) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Calendar</h1>
              <p className="text-gray-600">Manage your schedule and swap time slots</p>
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </button>
          </div>

          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <Legend color="bg-blue-600" label="My Busy" />
              <Legend color="bg-emerald-500" label="My Swappable" />
              <Legend color="bg-amber-500" label="Swap Pending" />
              <Legend color="bg-gray-500" label="Others' Busy" />
              <Legend color="bg-purple-500" label="Others' Swappable" />
            </div>
          </div>
        </div>

        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 relative z-0">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              start: "prev,next today",
              center: "title",
              end: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height="75vh"
            selectable
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
          />
        </div>
      </div>

      {/* Event Modal */}
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
        className={`fixed z-50 left-1/2 transform -translate-x-1/2 px-6 py-4 text-white rounded-xl shadow-2xl transition-all duration-500 flex items-center gap-3 ${
          toast.visible
            ? "bottom-8 opacity-100 scale-100"
            : "bottom-[-80px] opacity-0 scale-95"
        } bg-gradient-to-r from-red-500 to-rose-600`}
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="font-medium">{toast.message}</span>
      </div>
    </div>
  );
}


function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-5 h-5 rounded-md ${color} shadow-sm border-2 border-white`}></div>
      <span className="text-gray-700 font-medium">{label}</span>
    </div>
  );
}


function EventModal({ targetSlot, creatingEvent, setCreatingEvent, onClose, onCreate, onStatusChange, onDelete }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative p-6">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {!targetSlot ? "Create Event" : "Manage Event"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
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
              className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={creatingEvent.startDate}
                onChange={(e) =>
                  setCreatingEvent({ ...creatingEvent, startDate: e.target.value })
                }
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="time"
                value={creatingEvent.startTime}
                onChange={(e) =>
                  setCreatingEvent({ ...creatingEvent, startTime: e.target.value })
                }
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={creatingEvent.endDate}
                onChange={(e) =>
                  setCreatingEvent({ ...creatingEvent, endDate: e.target.value })
                }
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="time"
                value={creatingEvent.endTime}
                onChange={(e) =>
                  setCreatingEvent({ ...creatingEvent, endTime: e.target.value })
                }
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={onCreate}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg"
              >
                Create
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-1">{targetSlot.title}</h3>
              <p className="text-sm text-gray-600">
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
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg"
            >
              {targetSlot.status === "SWAPPABLE" ? "Mark as Busy" : "Make Swappable"}
            </button>
            <button
              onClick={() => onDelete(targetSlot._id)}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg"
            >
              Delete Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
