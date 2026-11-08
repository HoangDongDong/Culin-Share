export function finishAuthNavigation(navigate, state) {
  const from = state?.from;
  const destination = typeof from === "string" && /^\/(?!\/)/.test(from) && !/[\\\s]/.test(from)
    ? from : "/";
  const fridgeDraft = destination.split(/[?#]/)[0] === "/fridge" ? state?.fridgeDraft : null;
  if (fridgeDraft) localStorage.setItem("fridgeItems", JSON.stringify(fridgeDraft.fridgeItems));
  navigate(destination, { replace: true, state: fridgeDraft ? { fridgeDraft } : null });
}
