export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#171717]/10 border-t-copper" />
        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-[#171717]/30">Loading</p>
      </div>
    </div>
  );
}
