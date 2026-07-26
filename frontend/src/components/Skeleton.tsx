export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={`rounded-md bg-hover animate-shimmer ${className ?? ""}`}
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="rounded-xl border border-outline bg-surface p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-3 w-1/3" />
        </div>
    );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
                />
            ))}
        </div>
    );
}
