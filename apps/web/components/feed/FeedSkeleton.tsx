interface FeedSkeletonProps {
  count?: number;
}

export function FeedSkeleton({ count = 5 }: FeedSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Author skeleton */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="w-10 h-10 rounded-full shimmer flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-28 rounded shimmer" />
              <div className="h-2.5 w-20 rounded shimmer" />
            </div>
          </div>
          {/* Image skeleton — only show on even cards for variety */}
          {i % 3 !== 2 && <div className="w-full aspect-[4/3] shimmer" />}
          {/* Text skeleton */}
          <div className="px-4 py-3 space-y-2">
            <div className="h-3 w-full rounded shimmer" />
            <div className="h-3 w-4/5 rounded shimmer" />
            <div className="h-3 w-2/3 rounded shimmer" />
          </div>
          {/* Action skeleton */}
          <div className="flex items-center gap-4 px-4 pb-4 pt-1">
            <div className="h-6 w-14 rounded-full shimmer" />
            <div className="h-6 w-10 rounded-full shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
