export default function StoreLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-foreground/10 border-t-copper" />
        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-foreground/30">Loading</p>
      </div>
    </div>
  );
}
