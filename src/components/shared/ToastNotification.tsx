"use client";

interface ToastNotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function ToastNotification({ message, isVisible, onClose }: ToastNotificationProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
      aria-live="polite"
    >
      <div
        className="bg-[#2d5a4a] text-white rounded-2xl px-8 py-6 shadow-2xl pointer-events-auto flex items-center gap-4 animate-toast-pop"
        onClick={onClose}
      >
        <span className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl shrink-0">
          🔔
        </span>
        <p className="font-semibold text-lg">{message}</p>
      </div>
    </div>
  );
}