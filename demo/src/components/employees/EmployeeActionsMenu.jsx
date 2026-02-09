// components/employees/EmployeeActionsMenu.jsx
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Pencil,
  X,
  Check,
  CircleSlash,
  Key,
  RotateCcw,
  CreditCard,
  Calendar,
  QrCode,
  History,
  Clock,
  Mail,
  ChevronDown,
} from "lucide-react";

export default function EmployeeActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const menuItems = [
    { icon: Plus, label: "Add", divider: false },
    { icon: Pencil, label: "Edit", divider: false },
    { icon: X, label: "Delete", divider: true },
    { icon: Check, label: "Mark As Active", divider: false },
    { icon: CircleSlash, label: "Mark As Inactive", divider: true },
    { icon: Key, label: "App Access", divider: false },
    { icon: RotateCcw, label: "Reset Password", divider: true },
    { icon: CreditCard, label: "Payroll Details", divider: false },
    { icon: Calendar, label: "Edit Availability", divider: false },
    { icon: QrCode, label: "Print Emp QR code", divider: false },
    { icon: History, label: "Change History", divider: false },
    { icon: Clock, label: "View Work Hours", divider: false },
    { icon: Mail, label: "Send Invitation", divider: false },
  ];

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 224, // 224px = 14rem (w-56)
      });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,30%)] rounded text-sm text-gray-300 hover:bg-[hsl(220,15%,22%)] transition-colors flex items-center gap-1"
      >
        Actions
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen &&
        createPortal(
          <>
            {/* Backdrop to close menu when clicking outside */}
            <div
              className="fixed inset-0 z-[1000]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <div
              className="fixed w-56 bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,24%)] rounded-md shadow-2xl z-[1001]"
              style={{ top: `${position.top}px`, left: `${position.left}px` }}
            >
              <div className="py-1">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index}>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[hsl(220,15%,20%)] hover:text-orange-500 transition-colors flex items-center gap-3"
                        onClick={() => {
                          setIsOpen(false);
                          // Handle action here
                        }}
                      >
                        <Icon className="w-4 h-4 text-gray-400" />
                        {item.label}
                      </button>
                      {item.divider && (
                        <div className="border-t border-[hsl(220,15%,24%)] my-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
