/**
 * ==============================================
 * use-toast.ts - Custom Toast (Snackbar) Utility
 * ==============================================
 *
 * Unified client-side Toast HUD system with external imperative toast API,
 * reducer logic, and React hook state synchronization.
 *
 * Features:
 * - Displays in-app toasts with queue limit
 * - Imperative API for firing/dismissing/updating toasts globally
 * - Removable listeners, reducer state management, and delayed remove
 *
 * Inspired by Radix UI primitives but designed for global app needs.
 */

import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

// === Configuration constants ===

// Maximum number of toasts to show at any time
const TOAST_LIMIT = 1;

// How long (ms) before toasts are forcibly removed after being dismissed (1000000 = long for demo)
const TOAST_REMOVE_DELAY = 1000000;

// === Types and Interfaces ===

/**
 * ToasterToast
 * The shape of a toast object that is managed internally.
 */
type ToasterToast = ToastProps & {
  id: string; // unique identifier for the toast
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

/**
 * Internal action types for the toast reducer.
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

/**
 * Generates unique toast IDs (simple integer increment with wrap).
 */
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

// Reducer Actions
type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

/**
 * State object interface for the reducer.
 */
interface State {
  toasts: ToasterToast[];
}

// === Toast Dismiss Queue/Timeouts ===

/**
 * Maps toast IDs to their removal timeout (ensures proper "remove after dismiss").
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Adds a toast ID to the remove queue, ensuring it's eventually fully removed
 * after the given delay, unless already queued.
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// === Reducer logic for toast list state ===

/**
 * Reducer function to handle toast state by action.
 * Handles queueing, updating, dismissing, and removing toasts per the actions.
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // Add new toast to queue, respecting TOAST_LIMIT (oldest dropped)
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      // Update existing toast with matching ID
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Put toast(s) in the remove queue for auto-removal after timeout
      // (side effect for scheduling actual removal)
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }
      // Set open=false for targeted toast(s)
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      // Remove toast(s) by id, or all if no id provided
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// === Global Toast State and Listeners ===

/** All functions subscribed to toast state changes (for React hook eventing) */
const listeners: Array<(state: State) => void> = [];

/** Global (memory) state for all toasts (kept in sync with dispatch/reducer) */
let memoryState: State = { toasts: [] };

/**
 * Dispatches an action to the reducer, updates memoryState, notifies listeners.
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// === Toast API: create/update/dismiss ===

/**
 * Public argument shape for firing a new toast without an ID.
 */
type Toast = Omit<ToasterToast, "id">;

/**
 * Imperative toast API: Fires a toast, allows updating/dismissing it via closure methods.
 * Returns id, update, and dismiss helpers for the created toast.
 */
function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

// === React Hook for Toast State Integration ===

/**
 * useToast
 * React hook to synchronize the component with global toast state.
 * Returns the list of current toasts, toast API, and a manual dismiss helper.
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  // Subscribe this React component to global state/listener set
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
    // Only need to register/deregister once (do not depend on [state])
    // eslint-disable-next-line
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

// === Exports ===

export { useToast, toast };
