import Swal from "sweetalert2";

// ─── Confirm Action ─────────────────────────────────────────────────────────

interface ConfirmOptions {
  title?: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "warning";
}

export async function confirmAction(
  opts: ConfirmOptions = {},
): Promise<boolean> {
  const {
    title = "Are you sure?",
    text = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "primary",
  } = opts;

  const iconColor =
    variant === "danger"
      ? "#ef4444"
      : variant === "warning"
        ? "#f59e0b"
        : "#f59e0b";

  const confirmBtnColor = variant === "danger" ? "#ef4444" : "#f59e0b";

  const result = await Swal.fire({
    title,
    text,
    icon: variant === "danger" ? "warning" : "question",
    iconColor,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: confirmBtnColor,
    reverseButtons: true,
  });

  return result.isConfirmed;
}

// ─── Success Toast ───────────────────────────────────────────────────────────

export function successToast(title: string, text?: string): void {
  void Swal.fire({
    icon: "success",
    title,
    text,
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
  });
}

// ─── Error Toast ─────────────────────────────────────────────────────────────

export function errorToast(title: string, text?: string): void {
  void Swal.fire({
    icon: "error",
    title,
    text,
    timer: 3500,
    timerProgressBar: true,
    showConfirmButton: false,
  });
}

// ─── Confirm Delete (destructive shorthand) ───────────────────────────────────

export async function confirmDelete(opts: {
  title?: string;
  text?: string;
  confirmText?: string;
}): Promise<boolean> {
  return confirmAction({
    title: opts.title ?? "Delete this item?",
    text: opts.text ?? "This will be permanently removed.",
    confirmText: opts.confirmText ?? "Delete",
    variant: "danger",
  });
}
