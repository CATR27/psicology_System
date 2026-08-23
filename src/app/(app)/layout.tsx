import { AppNav } from "@/components/app-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppNav />
      <main className="flex-1 flex flex-col">{children}</main>
    </>
  );
}
