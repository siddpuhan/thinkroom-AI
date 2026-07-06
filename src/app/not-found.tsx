import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-3xl font-bold text-slate-200">Not Found</h2>
      <p className="text-slate-400">Could not find requested resource</p>
      <Link href="/" className="rounded bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-700">
        Return Home
      </Link>
    </div>
  )
}
