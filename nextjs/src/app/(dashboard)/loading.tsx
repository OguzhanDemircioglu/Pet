export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-white dark:bg-gray-950" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-white dark:bg-gray-950" />
    </div>
  )
}
