"use server";

import type { A1CRecord } from "@/types/database";

import {
  getEstimatedA1CFromReadings,
  type A1CEstimate,
} from "@/lib/tracking/a1c-estimator";
import { getAuthenticatedUser } from "@/lib/actions/auth";

export async function saveLabA1C(data: {
  value: number;
  testDate: string;
  labName?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await getAuthenticatedUser();

  const { error: insertError } = await supabase.from("a1c_records").insert({
    user_id: user.id,
    value: data.value,
    source: "lab" as const,
    confidence: "high" as const,
    test_date: data.testDate,
    lab_name: data.labName || null,
    notes: data.notes || null,
  });

  if (insertError) {
    // eslint-disable-next-line no-console
    console.error("Error saving lab A1C:", insertError);

    return { success: false, error: insertError.message };
  }

  // Update profile current_a1c
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ current_a1c: data.value })
    .eq("user_id", user.id);

  if (profileError) {
    // eslint-disable-next-line no-console
    console.error("Error updating profile A1C:", profileError);
  }

  return { success: true };
}

export async function getA1CHistory(): Promise<A1CRecord[]> {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("a1c_records")
    .select("*")
    .eq("user_id", user.id)
    .order("test_date", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching A1C history:", error);

    return [];
  }

  return data ?? [];
}

export async function getEstimatedA1C(): Promise<{
  estimate: A1CEstimate | null;
  saved: boolean;
}> {
  const { supabase, user } = await getAuthenticatedUser();

  const estimate = await getEstimatedA1CFromReadings(user.id);

  if (!estimate) {
    return { estimate: null, saved: false };
  }

  // Optionally save as estimated record
  const { error } = await supabase.from("a1c_records").insert({
    user_id: user.id,
    value: estimate.estimatedA1C,
    source: "estimated" as const,
    confidence: estimate.confidence,
    test_date: new Date().toISOString().split("T")[0],
    lab_name: null,
    notes: `Estimated from ${estimate.readingCount} readings over 90 days. Avg glucose: ${estimate.avgGlucose} mg/dL.`,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error saving estimated A1C:", error);

    return { estimate, saved: false };
  }

  // Update profile current_a1c with the new estimate
  await supabase
    .from("profiles")
    .update({ current_a1c: estimate.estimatedA1C })
    .eq("user_id", user.id);

  return { estimate, saved: true };
}

export type A1CTrend = "improving" | "stable" | "worsening";

export async function getA1CTrend(): Promise<A1CTrend | null> {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("a1c_records")
    .select("value, test_date")
    .eq("user_id", user.id)
    .order("test_date", { ascending: false })
    .limit(3);

  if (error || !data || data.length < 2) {
    return null;
  }

  // data is ordered newest first: [newest, middle, oldest]
  // Compare newest to oldest
  const newest = data[0].value;
  const oldest = data[data.length - 1].value;
  const diff = newest - oldest;

  // A decrease in A1C is improving (diff < 0)
  if (diff <= -0.3) {
    return "improving";
  } else if (diff >= 0.3) {
    return "worsening";
  }

  return "stable";
}

export async function getCurrentA1CData(): Promise<{
  currentA1C: number | null;
  targetA1C: number | null;
}> {
  const { supabase, user } = await getAuthenticatedUser();

  const [{ data: profile }, { data: latestRecord }] = await Promise.all([
    supabase
      .from("profiles")
      .select("current_a1c, target_a1c")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("a1c_records")
      .select("value")
      .eq("user_id", user.id)
      .order("test_date", { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    currentA1C: latestRecord?.value ?? profile?.current_a1c ?? null,
    targetA1C: profile?.target_a1c ?? null,
  };
}
