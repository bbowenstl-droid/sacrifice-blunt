import Link from "next/link";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <div className="display text-[5rem] text-dim">0-1</div>
      <h1 className="wide mt-4 text-2xl font-black">That page isn&apos;t in the record book</h1>
      <p className="mx-auto mt-2 max-w-md text-mute">The link may be wrong, or the season or game hasn&apos;t been added yet.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded bg-chalk px-4 py-2 font-bold text-night">Go home</Link>
        <Link href="/seasons" className="rounded border border-line px-4 py-2 font-semibold">Browse seasons</Link>
      </div>
    </Container>
  );
}
