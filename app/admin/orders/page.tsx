import { requireAdmin } from "@/lib/admin";
import { updateOrderStatus } from "../actions";

const statuses = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];
export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const { updated } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: orders, error } = await supabase.from("orders").select("id,order_number,customer_name,phone,city,total,status,inventory_reserved,reservation_expires_at,created_at,order_items(quantity,product_name,variant_label)").order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return <main className="admin-page"><div className="admin-head"><div><span>FULFILMENT</span><h1>Orders</h1></div></div>{updated && <p className="admin-success">Order status updated to <strong>{updated}</strong>.</p>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders?.map(order => <tr key={order.id}><td><strong>{order.order_number}</strong><small>{new Date(order.created_at).toLocaleDateString("en-PK")}</small></td><td>{order.customer_name}<small>{order.phone} · {order.city}</small></td><td>{order.order_items.map(item => <small key={item.product_name}>{item.quantity}× {item.product_name}{item.variant_label?" — "+item.variant_label:""}</small>)}</td><td>Rs. {Number(order.total).toLocaleString("en-PK")}</td><td><form action={updateOrderStatus} className="status-form"><input type="hidden" name="id" value={order.id}/>{order.inventory_reserved&&order.reservation_expires_at&&<small>Reserved until {new Date(order.reservation_expires_at).toLocaleString("en-PK")}</small>}<select name="status" defaultValue={order.status} key={`${order.id}-${order.status}`}>{statuses.map(status => <option value={status} key={status}>{status}</option>)}</select><button type="submit">Update</button></form></td></tr>)}</tbody></table></div></main>;
}
