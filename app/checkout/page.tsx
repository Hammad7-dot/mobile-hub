import CheckoutClient from "@/components/CheckoutClient";
import { getStoreSettings } from "@/lib/settings";

export default async function CheckoutPage() {
  const settings = await getStoreSettings();
  return <CheckoutClient deliveryFee={Number(settings.delivery_fee)} freeDeliveryThreshold={Number(settings.free_delivery_threshold)}/>;
}