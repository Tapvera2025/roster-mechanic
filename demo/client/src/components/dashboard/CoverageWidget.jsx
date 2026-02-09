import { Card } from "../ui/Card";

export default function CoverageWidget() {
  const coverageData = {
    percentage: 0,
    coverageHRS: "0.00 HRS",
    coverageShifts: "0 Shifts",
    actualHRS: "0.00 HRS",
    actualShifts: "0 Shifts",
    differenceHRS: "0.00 HRS",
    differenceShifts: "0 Shifts",
    differencePercentage: "0%",
  };

  const rosterData = {
    percentage: 0,
    rosterHRS: "0.00 HRS",
    rosterShifts: "0 Shifts",
    actualHRS: "0.00 HRS",
    actualShifts: "0 Shifts",
    differenceHRS: "0.00 HRS",
    differenceShifts: "0 Shifts",
    differencePercentage: "0%",
  };

  const CircularProgress = ({ percentage, size = 120 }) => {
    const radius = (size - 10) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(220, 15%, 20%)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EA580C"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-100">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Coverage Section */}
      <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all">
        <h3 className="text-lg font-bold mb-5 text-gray-100">
          Coverage Analytics
        </h3>

        <div className="flex items-start gap-6">
          <CircularProgress percentage={coverageData.percentage} />
          <div className="flex-1">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[hsl(220,15%,22%)]">
                  <td className="py-2 text-gray-300">Coverage HRS</td>
                  <td className="py-2 text-right font-medium text-gray-200">{coverageData.coverageHRS}</td>
                  <td className="py-2 text-right font-medium text-gray-200">{coverageData.coverageShifts}</td>
                </tr>
                <tr className="border-b border-[hsl(220,15%,22%)]">
                  <td className="py-2 text-gray-300">Actual HRS</td>
                  <td className="py-2 text-right font-medium text-gray-200">{coverageData.actualHRS}</td>
                  <td className="py-2 text-right font-medium text-gray-200">{coverageData.actualShifts}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-200 font-semibold">Difference</td>
                  <td className="py-2 text-right font-semibold text-gray-100">{coverageData.differenceHRS}</td>
                  <td className="py-2 text-right font-semibold text-gray-100">{coverageData.differenceShifts}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="py-1 text-right text-gray-500 text-xs">
                    {coverageData.differencePercentage}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Roster Section */}
      <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all">
        <h3 className="text-lg font-bold mb-5 text-gray-100">
          Roster Analytics
        </h3>

        <div className="flex items-start gap-6">
          <CircularProgress percentage={rosterData.percentage} />
          <div className="flex-1">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[hsl(220,15%,22%)]">
                  <td className="py-2 text-gray-300">Roster HRS</td>
                  <td className="py-2 text-right font-medium text-gray-200">{rosterData.rosterHRS}</td>
                  <td className="py-2 text-right font-medium text-gray-200">{rosterData.rosterShifts}</td>
                </tr>
                <tr className="border-b border-[hsl(220,15%,22%)]">
                  <td className="py-2 text-gray-300">Actual HRS</td>
                  <td className="py-2 text-right font-medium text-gray-200">{rosterData.actualHRS}</td>
                  <td className="py-2 text-right font-medium text-gray-200">{rosterData.actualShifts}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-200 font-semibold">Difference</td>
                  <td className="py-2 text-right font-semibold text-gray-100">{rosterData.differenceHRS}</td>
                  <td className="py-2 text-right font-semibold text-gray-100">{rosterData.differenceShifts}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="py-1 text-right text-gray-500 text-xs">
                    {rosterData.differencePercentage}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
