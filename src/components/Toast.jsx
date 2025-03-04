"use client";
import { useState, useEffect } from "react";

export default function Toast({ message, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000); // Auto-dismiss after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-5 right-5 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in">
      <span className="text-sm font-semibold">⚠️ {message}</span>
      <button
        onClick={() => {
          setVisible(false);
          onClose();
        }}
        className="text-white hover:text-gray-300 transition"
      >
        ✖
      </button>
    </div>
  );
}
