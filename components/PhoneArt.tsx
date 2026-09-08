export default function PhoneArt({ color, small = false }: { color: string; small?: boolean }) {
  return <div className={`phone-art ${small ? "small" : ""}`} style={{ "--phone": color } as React.CSSProperties}>
    <div className="phone back"><i/><i/><i/><b/></div><div className="phone front"><div className="speaker"/><div className="screen-glow"/></div>
  </div>;
}
