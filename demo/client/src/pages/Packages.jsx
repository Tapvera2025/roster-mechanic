import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "../components/ui/Button";
import PurchaseSuccessModal from "../components/packages/PurchaseSuccessModal";

export default function Packages() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [purchasedPackage, setPurchasedPackage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const packages = [
    {
      id: "basic",
      name: "Basic",
      price: "$15K",
      period: "/mo",
      discount: "Upto $1K discount for referal",
      features: ["Dummy"],
      color: "from-gray-700 to-gray-800",
      borderColor: "border-gray-600",
      textColor: "text-gray-100",
    },
    {
      id: "premium",
      name: "Premium",
      price: "$25K",
      period: "/mo",
      discount: "Upto $2K discount for referal",
      features: ["Dummy"],
      recommended: true,
      color: "from-yellow-600 to-yellow-700",
      borderColor: "border-yellow-500",
      textColor: "text-white",
    },
    {
      id: "scale",
      name: "Scale",
      price: "$125K",
      period: "/mo",
      discount: "Upto $12K discount for referal",
      features: ["Dummy"],
      color: "from-gray-700 to-gray-800",
      borderColor: "border-gray-600",
      textColor: "text-gray-100",
    },
  ];

  const handlePurchase = (pkg) => {
    setPurchasedPackage(pkg.name);
    setShowSuccessModal(true);
    setHoveredCard(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute top-10 left-10 w-64 h-64 border-2 border-red-500 rounded-full"
          style={{
            background:
              "radial-gradient(circle, transparent 40%, rgba(239, 68, 68, 0.1) 100%)",
            filter: "blur(2px)",
          }}
        />
        <div
          className="absolute bottom-10 right-10 w-96 h-96 border-2 border-red-500 rounded-full"
          style={{
            background:
              "radial-gradient(circle, transparent 40%, rgba(239, 68, 68, 0.1) 100%)",
            filter: "blur(2px)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your <span className="text-yellow-500">Package</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Select the perfect plan for your event management needs
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative group transition-all duration-300 ${
                pkg.recommended ? "md:-mt-8 md:mb-8" : ""
              }`}
              onMouseEnter={() => setHoveredCard(pkg.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Recommended Badge */}
              {pkg.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-yellow-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Recommended
                  </div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative bg-gradient-to-br ${
                  pkg.color
                } rounded-2xl p-8 border-2 ${
                  pkg.borderColor
                } shadow-2xl transition-all duration-300 ${
                  hoveredCard === pkg.id
                    ? `transform scale-105 ${
                        pkg.recommended
                          ? "shadow-yellow-500/50"
                          : "shadow-red-500/50"
                      }`
                    : ""
                }`}
              >
                {/* Package Name */}
                <div className="text-center mb-6">
                  <h2 className={`text-2xl font-bold ${pkg.textColor} mb-2`}>
                    {pkg.name}
                  </h2>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center">
                    <span
                      className={`text-5xl font-bold ${
                        pkg.recommended ? "text-yellow-400" : "text-red-500"
                      }`}
                    >
                      {pkg.price}
                    </span>
                    <span className="text-xl text-gray-400 ml-2">
                      {pkg.period}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{pkg.discount}</p>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <p className="text-sm text-gray-400 font-semibold mb-3">
                    Includes:
                  </p>
                  <ul className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-gray-300"
                      >
                        <Check
                          className={`w-5 h-5 ${
                            pkg.recommended ? "text-yellow-400" : "text-red-500"
                          } flex-shrink-0`}
                        />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Buy Now Button - Shows on Hover */}
                <div
                  className={`transition-all duration-300 ${
                    hoveredCard === pkg.id
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <Button
                    onClick={() => handlePurchase(pkg)}
                    className={`w-full ${
                      pkg.recommended
                        ? "bg-yellow-500 hover:bg-yellow-600 hover:shadow-yellow-500/50"
                        : "bg-red-500 hover:bg-red-600 hover:shadow-red-500/50"
                    } text-white font-bold py-3 rounded-lg shadow-lg transition-all`}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Modal */}
      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        packageName={purchasedPackage}
      />
    </div>
  );
}
