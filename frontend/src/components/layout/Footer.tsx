export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-6 text-center text-sm md:flex-row md:justify-between md:text-left">
        <span className="font-semibold">
          &copy; {new Date().getFullYear()} Hand Me Down
        </span>

        <div className="flex gap-6">
          <span>About</span>
          <span>Safety tips</span>
          <span>Privacy</span>
          <span>Terms</span>
        </div>
      </div>
    </footer>
  );
}
