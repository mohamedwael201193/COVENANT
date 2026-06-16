import { useEffect, useState } from "react";
import { createDecisionEventSource, type DecisionEvent } from "@/lib/api";

export function useDecisionStream() {
  const [events, setEvents] = useState<DecisionEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = createDecisionEventSource(
      (event) => {
        setConnected(true);
        setEvents((prev) => {
          if (prev.some((e) => e.id === event.id)) return prev;
          return [event, ...prev].slice(0, 100);
        });
      },
      () => setConnected(false),
    );

    source.onopen = () => setConnected(true);

    return () => {
      source.close();
    };
  }, []);

  return { events, connected };
}
