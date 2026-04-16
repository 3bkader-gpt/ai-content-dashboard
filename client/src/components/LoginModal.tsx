import type { ReactNode } from "react";

type LoginModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  loading?: boolean;
  onClose: () => void;
  onLogin: () => void | Promise<void>;
  footer?: ReactNode;
};

export default function LoginModal(props: LoginModalProps) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">
              {props.title ?? "Login to continue"}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
              {props.description ?? "Please sign in first to continue with upgrade."}
            </p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500 transition"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => void props.onLogin()}
          disabled={props.loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-base">login</span>
          {props.loading ? "Opening Google..." : "Continue with Google"}
        </button>

        {props.footer ? <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{props.footer}</div> : null}
      </div>
    </div>
  );
}
