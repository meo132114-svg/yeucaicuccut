import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { session: Session | null; ready: boolean };

let state: AuthState = { session: null, ready: false };
const SERVER_SNAPSHOT: AuthState = { session: null, ready: false };
const listeners = new Set<() => void>();

function setState(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

void supabase.auth.getSession().then(({ data }) => {
  setState({ session: data.session, ready: true });
});

supabase.auth.onAuthStateChange((_event, session) => {
  setState({ session, ready: true });
});

export function useAuthState(): AuthState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => state,
    () => SERVER_SNAPSHOT,
  );
}
