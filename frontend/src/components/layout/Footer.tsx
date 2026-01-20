export function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-auto">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Headshot AI. All rights reserved.
        </p>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </a>
          <a href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  )
}
