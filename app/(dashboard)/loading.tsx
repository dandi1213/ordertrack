export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-12">
      <div className="h-32 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse"
          />
        ))}
      </div>
      <div className="h-80 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
    </div>
  );
}
