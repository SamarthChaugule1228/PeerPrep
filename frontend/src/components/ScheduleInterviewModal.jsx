import React, { useState } from 'react';

const ScheduleInterviewModal = ({ onSchedule, onClose }) => {
  // Get current time + 10 minutes for default start time
  const getCurrentDefaultTime = () => {
    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + 10);
    return currentTime.toTimeString().slice(0, 5);
  };

  const getDefaultEndTime = (startTime) => {
    if (!startTime) return '10:45';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + 45, 0);
    return endDate.toTimeString().slice(0, 5);
  };

  const defaultStartTime = getCurrentDefaultTime();

  const [formData, setFormData] = useState({
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: defaultStartTime,
    endTime: getDefaultEndTime(defaultStartTime),
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;

      if (startTotalMin >= endTotalMin) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (formData.scheduledDate && formData.startTime) {
      const now = new Date();
      const selectedDateTime = new Date(formData.scheduledDate);
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      selectedDateTime.setHours(startHour, startMin, 0, 0);

      // Check if it's at least 10 minutes from now
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
      
      if (selectedDateTime < tenMinutesFromNow) {
        newErrors.startTime = 'Interview must be scheduled at least 10 minutes from now';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSchedule(formData);
    }
  };

  // Get minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule Interview</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Schedule an interview today or later. We'll search for an interviewer and match you with a peer if needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Interview Date
            </label>
            <input
              type="date"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleChange}
              min={minDate}
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                errors.scheduledDate
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-gray-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700'
              }`}
            />
            {errors.scheduledDate && (
              <p className="mt-1 text-sm text-red-500">{errors.scheduledDate}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                  errors.startTime
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-gray-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700'
                }`}
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                  errors.endTime
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-gray-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700'
                }`}
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Schedule
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
            <p className="font-semibold">📝 How it works:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• We'll search for an interviewer from now until 120 minutes before your scheduled time</li>
              <li>• If an interviewer is found, you'll be matched</li>
              <li>• If no interviewer is available, we'll match you with a candidate at the 120-minute mark</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
