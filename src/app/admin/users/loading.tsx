export default function UsersLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-20 bg-[#171717]/10" />
      <div className="mt-3 h-10 w-40 bg-[#171717]/10" />
      <div className="mt-6 h-10 w-full max-w-xs border border-[#171717]/10 bg-white" />
      <div className="mt-5 overflow-hidden border border-[#171717]/10 bg-white">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-12 border-b border-[#171717]/5 last:border-b-0" />
        ))}
      </div>
    </div>
  );
}
