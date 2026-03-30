function Bone({ className = '' }) {
  return <div className={`bg-white/[.06] rounded-[3px] animate-pulse ${className}`} />
}

function CardSkeleton() {
  return (
    <div className="rx-card rounded-[4px] p-5">
      <div className="flex items-center gap-3 mb-4">
        <Bone className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Bone className="h-3 w-2/3" />
          <Bone className="h-2.5 w-1/3" />
        </div>
      </div>
      <Bone className="h-2.5 w-full mb-2" />
      <Bone className="h-2.5 w-3/4" />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[.05]">
      <Bone className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Bone className="h-3 w-1/2" />
        <Bone className="h-2.5 w-1/3" />
      </div>
    </div>
  )
}

function TextSkeleton() {
  return <Bone className="h-3 w-full" />
}

function CircleSkeleton({ size = 40 }) {
  return <Bone className="rounded-full" style={{ width: size, height: size }} />
}

const COMPONENTS = {
  card:   CardSkeleton,
  list:   ListSkeleton,
  text:   TextSkeleton,
  circle: CircleSkeleton,
}

/**
 * Skeleton placeholder per stati di loading.
 * @param {string}  variant  — 'card' | 'list' | 'text' | 'circle'
 * @param {number}  count    — numero di elementi da renderizzare
 * @param {number}  size     — usato solo da variant='circle'
 */
export function Skeleton({ variant = 'card', count = 1, size }) {
  const Component = COMPONENTS[variant] ?? CardSkeleton
  return Array.from({ length: count }, (_, i) => <Component key={i} size={size} />)
}
