export default function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-[var(--app-border)] bg-white/70 px-5 py-8 text-center shadow-[var(--shadow-soft)]">
      <div className="mb-3 text-4xl text-[var(--app-text-muted)]">
        <i className={`bi bi-${icon}`} />
      </div>
      <h3 className="text-lg font-bold text-[var(--app-text)]">{title}</h3>
      {description && <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
