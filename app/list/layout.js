export default function ListLayout({ children }) {
  // List page owns the order of its audit and analytics sections so they are
  // rendered exactly once and remain adjacent to the URL table.
  return <div className="list-layout">{children}</div>;
}
