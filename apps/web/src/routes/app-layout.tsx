import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <main className="mx-auto w-[min(1120px,calc(100%-32px))] px-0 py-12 pb-20 max-sm:w-[min(1120px,calc(100%-24px))] max-sm:pt-6">
      <Outlet />
    </main>
  );
}
