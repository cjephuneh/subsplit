export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}

