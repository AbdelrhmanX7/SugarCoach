"use server";

import type { FamilyMember, Profile } from "@/types/database";

import { createClient } from "@/lib/supabase/server";

export async function getProfile(): Promise<{
  data: Profile | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: profile as Profile, error: null };
}

export async function updateProfile(
  data: Partial<Pick<Profile, "display_name" | "avatar_url" | "date_of_birth">>,
): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: profile as Profile, error: null };
}

export async function updateDiabetesSettings(
  data: Partial<
    Pick<
      Profile,
      | "diabetes_type"
      | "insulin_to_carb_ratio"
      | "correction_factor"
      | "target_bg_min"
      | "target_bg_max"
      | "target_a1c"
      | "current_a1c"
      | "insulin_method"
      | "bg_unit"
    >
  >,
): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: profile as Profile, error: null };
}

export type FamilyMemberWithProfile = FamilyMember & {
  member_profile: Pick<Profile, "display_name" | "avatar_url"> | null;
};

export async function getFamilyMembers(): Promise<{
  data: FamilyMemberWithProfile[];
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: [], error: "Unauthorized" };
  }

  const { data: members, error } = await supabase
    .from("family_members")
    .select(
      `
      *,
      member_profile:profiles!family_members_member_user_id_fkey(
        display_name,
        avatar_url
      )
    `,
    )
    .eq("owner_user_id", user.id);

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: (members ?? []) as FamilyMemberWithProfile[],
    error: null,
  };
}

export async function addFamilyMember(
  email: string,
  relationship: string,
  permission: "view" | "edit",
): Promise<{ data: FamilyMember | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  // Look up the target user by email in profiles
  // We need to find a user with this email via auth
  const { data: targetProfiles, error: lookupError } = await supabase
    .from("profiles")
    .select("user_id")
    .ilike("display_name", email);

  // If lookup by display_name doesn't work, try using the admin lookup
  // Since we can't query auth.users from client, we look up by user_id in profiles
  // The approach: query profiles table. We need email lookup via a different route.
  // Let's use supabase rpc or a direct approach — query auth users by email is not available
  // from anon key. Instead, we'll look up the user via a workaround:
  // We attempt to find the user by checking the auth.users email through profiles join.

  // Reset: we use the Supabase auth admin if available, or look up profiles that
  // have been linked by email. Since profiles might not store email,
  // we look up the user directly via Supabase auth.
  if (lookupError) {
    // fallback
  }

  // Best approach: use the Supabase admin API to find user by email
  // Since server actions run on the server, we can use service role if available
  // But with anon key, we check profiles table — let's try a different query.

  // We actually need to find user by email. Let's use supabase.auth.admin if available,
  // otherwise we need to search profiles. Since profiles may not have email,
  // the safest approach is to store email or use a lookup table.
  // For now, let's do a workaround: use supabase rpc or direct query.

  // Simplified approach: Look up user by email using the Supabase admin API
  // which is available on the server with the service role key.
  // However, with the anon key we can still try:

  const {
    data: { users },
  } = await supabase.auth.admin.listUsers();

  let targetUserId: string | null = null;

  if (users) {
    const targetUser = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (targetUser) {
      targetUserId = targetUser.id;
    }
  }

  // Fallback: if admin API is not available, try to find by matching profiles
  if (!targetUserId && targetProfiles && targetProfiles.length > 0) {
    targetUserId = targetProfiles[0].user_id;
  }

  if (!targetUserId) {
    return { data: null, error: "User not registered" };
  }

  if (targetUserId === user.id) {
    return { data: null, error: "You cannot add yourself as a family member" };
  }

  // Check if already exists
  const { data: existing } = await supabase
    .from("family_members")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("member_user_id", targetUserId)
    .single();

  if (existing) {
    return { data: null, error: "This user is already a family member" };
  }

  const { data: member, error: insertError } = await supabase
    .from("family_members")
    .insert({
      owner_user_id: user.id,
      member_user_id: targetUserId,
      relationship,
      permission,
    })
    .select()
    .single();

  if (insertError) {
    return { data: null, error: insertError.message };
  }

  return { data: member as FamilyMember, error: null };
}

export async function removeFamilyMember(
  memberId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("id", memberId)
    .eq("owner_user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
