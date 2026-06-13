export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-[var(--line)] px-4 pb-10 pt-8 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">
          &copy; {year} everything-blog
        </p>
        <p className="island-kicker m-0 text-xs">writing about code & life</p>
      </div>
    </footer>
  )
}
