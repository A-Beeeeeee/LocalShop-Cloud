import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon } from "../components/Icons";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === "success" && <CheckCircleIcon size={16} />}
              {t.type === "error" && <AlertCircleIcon size={16} />}
              {t.type === "warning" && <AlertTriangleIcon size={16} />}
              {t.type !== "success" && t.type !== "error" && t.type !== "warning" && <CheckCircleIcon size={16} />}
            </span>
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
