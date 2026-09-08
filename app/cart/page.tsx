import CartClient from "@/components/CartClient";
import { getStoreSettings } from "@/lib/settings";

export default async function CartPage() {
  const settings = await getStoreSettings();
  return <CartClient deliveryFee={Number(settings.delivery_fee)} freeDeliveryThreshold={Number(settings.free_delivery_threshold)}/>;
}