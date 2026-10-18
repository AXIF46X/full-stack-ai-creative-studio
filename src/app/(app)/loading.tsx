export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-56" />
      <div className="skeleton h-4 w-80" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="skeleton h-48 lg:col-span-2" />
        <div className="skeleton h-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </div>
    </div>
  );
}
