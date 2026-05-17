import clsx from "clsx";

const VARIANT_STYLES = {
  dark: {
    container:
      "rounded-2xl bg-slate-800/40 border border-slate-700/40 backdrop-blur-sm",
    iconRing: "bg-slate-700/40 ring-slate-600/40",
    icon: "text-slate-500",
    title: "text-slate-100",
    description: "text-slate-400",
  },
  light: {
    container: "rounded-2xl bg-white border border-slate-200 shadow-sm",
    iconRing: "bg-slate-50 ring-slate-200",
    icon: "text-slate-400",
    title: "text-slate-900",
    description: "text-slate-500",
  },
};

function DefaultEmptyIcon({ className }) {
  return (
    <svg
      className={clsx("h-14 w-14", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
      />
    </svg>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionButton,
  className,
  variant = "dark",
}) {
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.dark;

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        styles.container,
        className,
      )}
      role="status"
      aria-label={title}
    >
      <div
        className={clsx(
          "mb-5 flex h-24 w-24 items-center justify-center rounded-full ring-1",
          styles.iconRing,
        )}
      >
        {icon ?? <DefaultEmptyIcon className={styles.icon} />}
      </div>

      <h3 className={clsx("text-lg font-semibold mb-2", styles.title)}>
        {title}
      </h3>

      {description && (
        <p
          className={clsx(
            "text-sm max-w-xs leading-relaxed mb-6",
            styles.description,
          )}
        >
          {description}
        </p>
      )}

      {actionButton && <div className="mt-2">{actionButton}</div>}
    </div>
  );
}

export default EmptyState;
