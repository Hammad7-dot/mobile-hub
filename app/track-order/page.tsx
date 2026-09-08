"use client";

import { FormEvent, useState } from "react";
import { Check, Package, Truck } from "@phosphor-icons/react";

const statuses = ["pending","confirmed","packed","shipped","delivered"];
type Tracking = { order_number: string; status: string; total: number; created_at: string };

export default function TrackOrderPage() {
  const [result,setResult]=useState<Tracking|null>(null); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");setResult(null);const form=new FormData(event.currentTarget);try{const response=await fetch("/api/orders/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(form.entries()))});const data=await response.json();if(!response.ok)throw new Error(data.error);setResult(data)}catch(reason){setError(reason instanceof Error?reason.message:"Could not track order")}finally{setBusy(false)}}
  const current=result?statuses.indexOf(result.status):-1;
  return <main className="form-page shell"><div className="track-hero"><Package/><span className="kicker dark">KNOW WHERE IT IS</span><h1>Track your order</h1><p>Enter the order number and the same phone number used at checkout.</p><form onSubmit={submit}><input name="order_number" required placeholder="Order number"/><input name="phone" required pattern="(?:\+?92|0)?3[0-9]{9}" placeholder="Phone number"/><button disabled={busy} className="primary-btn">{busy?"Checking…":"Track order"}</button></form>{error&&<p className="form-error">{error}</p>}</div>{result&&<div className="tracking-card"><div className="tracking-head"><span><Truck/></span><div><small>ORDER {result.order_number}</small><h2>{result.status.replace(/^./,letter=>letter.toUpperCase())}</h2><p>Total: Rs. {Number(result.total).toLocaleString("en-PK")}</p></div></div><div className="timeline">{statuses.map((status,index)=><div className={index<=current?"done":""} key={status}><i>{index<=current?<Check/>:index+1}</i><strong>{status.replace(/^./,letter=>letter.toUpperCase())}</strong></div>)}</div></div>}</main>;
}
