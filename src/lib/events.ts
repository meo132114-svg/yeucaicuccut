import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { compareEvents } from "./timeline-utils";

export type TimelineEvent = {
  id: string;
  year: number;
  month: number | null;
  day: number | null;
  title: string;
  description: string;
  image_url: string | null;
};

/** Luôn sort lại trong code theo thời gian, bất kể dữ liệu được nhập thế nào. */
export const eventsQueryOptions = queryOptions({
  queryKey: ["timeline_events"],
  queryFn: async (): Promise<TimelineEvent[]> => {
    const { data, error } = await supabase
      .from("timeline_events")
      .select("id, year, month, day, title, description, image_url")
      .order("year", { ascending: true })
      .order("month", { ascending: true, nullsFirst: false })
      .order("day", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return [...(data ?? [])].sort(compareEvents);
  },
});
