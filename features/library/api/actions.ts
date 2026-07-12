"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PhysicalResource, ResourceCheckout } from "@/lib/types";

type PhysicalResourceRow = PhysicalResource;

export async function getLibraryCatalog(): Promise<PhysicalResource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("physical_resources")
    .select("*")
    .order("title");

  if (error) {
    console.error("Error fetching library catalog:", error);
    return [];
  }

  return (data ?? []) as PhysicalResourceRow[];
}

export async function getResourceByIsbn(
  isbn: string,
): Promise<PhysicalResource | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("physical_resources")
    .select("*")
    .eq("isbn", isbn)
    .single();

  if (error) return null;
  return data as PhysicalResourceRow;
}

export async function addPhysicalResource(data: {
  title: string;
  author?: string;
  isbn?: string;
  resource_type: string;
  total_quantity: number;
}) {
  const supabase = await createClient();

  // optionally fetch cover image from open library
  let cover_image_url = null;
  if (data.isbn) {
    cover_image_url = `https://covers.openlibrary.org/b/isbn/${data.isbn}-M.jpg`;
  }

  const { error } = await supabase.from("physical_resources").insert({
    title: data.title,
    author: data.author || null,
    isbn: data.isbn || null,
    resource_type: data.resource_type,
    cover_image_url,
    total_quantity: data.total_quantity,
    available_quantity: data.total_quantity,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/resources/library");
  return { success: true };
}

export async function checkoutResource(
  resourceId: string,
  learnerId: string,
  daysToKeep: number = 7,
) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Unauthorized");

  // Get resource
  const { data: resource, error: resError } = await supabase
    .from("physical_resources")
    .select("available_quantity")
    .eq("id", resourceId)
    .single();

  if (resError || !resource || resource.available_quantity < 1) {
    throw new Error("Resource is not available.");
  }

  // Create checkout
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysToKeep);

  const { error: checkoutError } = await supabase
    .from("resource_checkouts")
    .insert({
      resource_id: resourceId,
      profile_id: learnerId,
      due_date: dueDate.toISOString(),
      checked_out_by: user.user.id,
    });

  if (checkoutError) throw new Error(checkoutError.message);

  // Decrement quantity
  await supabase.rpc("decrement_resource_quantity", { r_id: resourceId });
  // wait we don't have decrement_resource_quantity. Let's just update.
  await supabase
    .from("physical_resources")
    .update({ available_quantity: resource.available_quantity - 1 })
    .eq("id", resourceId);

  revalidatePath("/dashboard/resources/library");
  return { success: true };
}

export async function returnResource(checkoutId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Unauthorized");

  const { data: checkout, error: getError } = await supabase
    .from("resource_checkouts")
    .select("resource_id")
    .eq("id", checkoutId)
    .single();

  if (getError || !checkout) throw new Error("Checkout not found.");

  // Update checkout
  const { error: returnError } = await supabase
    .from("resource_checkouts")
    .update({
      status: "returned",
      return_date: new Date().toISOString(),
      checked_in_by: user.user.id,
    })
    .eq("id", checkoutId);

  if (returnError) throw new Error(returnError.message);

  // Increment available
  const { data: resource } = await supabase
    .from("physical_resources")
    .select("available_quantity")
    .eq("id", checkout.resource_id)
    .single();
  if (resource) {
    await supabase
      .from("physical_resources")
      .update({ available_quantity: resource.available_quantity + 1 })
      .eq("id", checkout.resource_id);
  }

  revalidatePath("/dashboard/resources/library");
  return { success: true };
}

export async function getActiveCheckouts(): Promise<ResourceCheckout[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_checkouts")
    .select(
      `
      *,
      resource:resource_id(*),
      profile:profile_id(*)
    `,
    )
    .eq("status", "active")
    .order("due_date", { ascending: true });

  if (error) return [];
  return data as ResourceCheckout[];
}
