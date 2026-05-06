import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <main className="min-h-screen">
      <Outlet />
    </main>
  );
}
