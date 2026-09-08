import { createClient } from "@/lib/supabase/server";

export type StoreSettings = {
  name: string;
  phone: string;
  whatsapp: string;
  support_email: string;
  address: string;
  delivery_fee: number;
  free_delivery_threshold: number;
};

export const defaultStoreSettings: StoreSettings = {
  name: "MobileHub",
  phone: "+92 300 1234567",
  whatsapp: "923001234567",
  support_email: "",
  address: "Lahore, Pakistan",
  delivery_fee: 500,
  free_delivery_threshold: 50000,
};

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "store").maybeSingle();
    return { ...defaultStoreSettings, ...(data?.value as Partial<StoreSettings> | undefined) };
  } catch {
    return defaultStoreSettings;
  }
}
