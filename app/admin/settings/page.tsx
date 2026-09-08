import { requireAdmin } from "@/lib/admin";
import { defaultStoreSettings, type StoreSettings } from "@/lib/settings";
import { saveStoreSettings } from "../actions";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "store").maybeSingle();
  const settings = { ...defaultStoreSettings, ...(data?.value as Partial<StoreSettings> | undefined) };
  return <main className="admin-page"><div className="admin-head"><div><span>STORE CONFIGURATION</span><h1>Business settings</h1></div></div><form action={saveStoreSettings} className="admin-product-form admin-settings-form">
    <label>Store name<input name="name" required minLength={2} defaultValue={settings.name}/></label>
    <label>Telephone<input name="phone" required defaultValue={settings.phone}/></label>
    <label>WhatsApp number<input name="whatsapp" inputMode="numeric" defaultValue={settings.whatsapp}/></label>
    <label>Support email<input name="support_email" type="email" defaultValue={settings.support_email}/></label>
    <label className="full">Physical address<textarea name="address" required minLength={3} defaultValue={settings.address}/></label>
    <label>Delivery charge (PKR)<input name="delivery_fee" type="number" min="0" defaultValue={settings.delivery_fee}/></label>
    <label>Free-delivery threshold (PKR)<input name="free_delivery_threshold" type="number" min="0" defaultValue={settings.free_delivery_threshold}/></label>
    <div className="full"><button className="primary-btn">Save store settings</button></div>
  </form><p className="admin-note">Replace every sample value before launch. Changes appear in the public header and footer.</p></main>;
}
