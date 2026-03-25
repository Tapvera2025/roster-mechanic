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
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3b82f6"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-[hsl(var(--color-foreground))]">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Coverage Section */}
      <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
        <h3 className="text-lg font-bold mb-5 text-[hsl(var(--color-foreground))]">
          Coverage Analytics
        </h3>

        <div className="flex items-start gap-6">
          <CircularProgress percentage={coverageData.percentage} />
          <div className="flex-1">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[hsl(var(--color-border))]">
                  <td className="py-2 text-[hsl(var(--color-foreground-secondary))]">Coverage HRS</td>
                  <td className="py-2 text-right font-medium">{coverageData.coverageHRS}</td>
                  <td className="py-2 text-right font-medium">{coverageData.coverageShifts}</td>
                </tr>
                <tr className="border-b border-[hsl(var(--color-border))]">
                  <td className="py-2 text-[hsl(var(--color-foreground-secondary))]">Actual HRS</td>
                  <td className="py-2 text-right font-medium">{coverageData.actualHRS}</td>
                  <td className="py-2 text-right font-medium">{coverageData.actualShifts}</td>
                </tr>
                <tr>
                  <td className="py-2 text-[hsl(var(--color-foreground-secondary))] font-semibold">Difference</td>
                  <td className="py-2 text-right font-semibold">{coverageData.differenceHRS}</td>
                  <td className="py-2 text-right font-semibold">{coverageData.differenceShifts}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="py-1 text-right text-[hsl(var(--color-foreground-muted))] text-xs">
                    {coverageData.differencePercentage}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Roster Section */}
      <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
        <h3 className="text-lg font-bold mb-5 text-[hsl(var(--color-foreground))]">
          Roster Analytics
        </h3>

        <div className="flex items-start gap-6">
          <CircularProgress percentage={rosterData.percentage} />
          <div className="flex-1">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[hsl(var(--color-border))]">
                  <td className="py-2 text-[hsl(var(--color-foreground-secondary))]">Roster HRS</td>
                  <td className="py-2 text-right font-medium">{rosterData.rosterHRS}</td>
                  <td className="py-2 text-right font-medium">{rosterData.rosterShifts}</td>
                </tr>
                <tr className="border-b border-[hsl(var(--color-border))]">
                  <td className="py-2 text-[hsl(var(--color-foreground-secondary))]">Actual HRS</td>
                  <td className="py-2 text-right font-medium">{rosterData.actualHRS}</td>
                  <td className="py-2 text-right font-medium">{rosterData.actualShifts}</td>
                </tr>
                <tr>
                  <td className="py-2 text-[hsl(var(--color-foreground-secondary))] font-semibold">Difference</td>
                  <td className="py-2 text-right font-semibold">{rosterData.differenceHRS}</td>
                  <td className="py-2 text-right font-semibold">{rosterData.differenceShifts}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="py-1 text-right text-[hsl(var(--color-foreground-muted))] text-xs">
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
