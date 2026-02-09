import { CheckCircle, X } from "lucide-react";
import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";

export default function PurchaseSuccessModal({ isOpen, onClose, packageName }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleContinue = () => {
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Purchase Successful!
          </h2>
          <p className="text-gray-600 text-center mb-6">
            You have successfully purchased the <span className="font-semibold text-gray-900">{packageName}</span> package.
          </p>

          {/* Credentials Box */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
              Your Login Credentials
            </h3>
            <div className="space-y-3">
              <div className="bg-white rounded-md p-3 border border-blue-100">
                <div className="text-xs text-gray-500 mb-1">Username</div>
                <div className="text-base font-mono font-semibold text-gray-900">admin</div>
              </div>
              <div className="bg-white rounded-md p-3 border border-blue-100">
                <div className="text-xs text-gray-500 mb-1">Password</div>
                <div className="text-base font-mono font-semibold text-gray-900">adminpass123</div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 text-center">
              Please save these credentials for future reference
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={handleContinue}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
