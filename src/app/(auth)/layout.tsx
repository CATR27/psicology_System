import "./auth.css";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <div className="vera-auth">{children}</div>;
}
