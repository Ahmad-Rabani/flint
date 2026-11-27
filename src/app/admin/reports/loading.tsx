export default function ReportsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-24 bg-[#171717]/10" />
      <div className="mt-3 h-10 w-56 bg-[#171717]/10" />
      <div className="mt-2 h-4 w-80 max-w-full bg-[#171717]/5" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 border border-[#171717]/10 bg-white" />
        ))}
      </div>
      <div className="mt-6 h-72 border border-[#171717]/10 bg-white" />
    </div>
  );
}
