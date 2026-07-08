import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-crunchy-cream">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-12">
        <div className="w-full">
          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Image src="/brand/logo.webp" alt="CrunchyBowl" width={140} height={140} className="rounded-3xl" priority />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
