export default function LoadingScreen({ message = 'Cargando información...', label }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--app-surface)] px-6">
      <div className="spinner-border" role="status" />
      <p className="text-center text-sm font-medium text-[var(--app-text-muted)]">{label || message}</p>
    </div>
  );
}
