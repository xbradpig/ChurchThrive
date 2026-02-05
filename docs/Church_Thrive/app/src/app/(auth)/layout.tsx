export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--ct-color-bg-secondary)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-ct-2xl font-bold text-ct-primary">
            ChurchThrive
          </h1>
          <p className="text-ct-sm text-[var(--ct-color-text-secondary)] mt-2">
            교회의 건강한 성장을 돕는 올인원 플랫폼
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
