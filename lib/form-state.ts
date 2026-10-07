/**
 * The shape every form action in app/actions.ts returns.
 *
 * It lives outside that file because a `"use server"` module may only export
 * async functions, and a form's state type has to be importable from the client
 * components that render it.
 */
export type AuthFormState = {
  error: string | null;
  notice: string | null;
};

export const idleFormState: AuthFormState = { error: null, notice: null };