import type { VeraTheme } from "@/components/auth/use-vera-theme";

const tokens: Record<VeraTheme, Record<string, string>> = {
  light: {
    colorPrimary: "oklch(52% 0.19 302)",
    colorPrimaryForeground: "oklch(99% 0.006 300)",
    colorForeground: "oklch(24% 0.04 300)",
    colorMutedForeground: "oklch(46% 0.03 300)",
    colorBackground: "oklch(99% 0.006 300)",
    colorInput: "oklch(96% 0.012 300)",
    colorInputForeground: "oklch(24% 0.04 300)",
    colorBorder: "oklch(88% 0.02 300)",
    colorDanger: "oklch(50% 0.18 25)",
  },
  dark: {
    colorPrimary: "oklch(74% 0.17 300)",
    colorPrimaryForeground: "oklch(15% 0.03 300)",
    colorForeground: "oklch(95% 0.01 300)",
    colorMutedForeground: "oklch(70% 0.025 300)",
    colorBackground: "oklch(20% 0.035 300)",
    colorInput: "oklch(15% 0.03 300)",
    colorInputForeground: "oklch(95% 0.01 300)",
    colorBorder: "oklch(32% 0.035 300)",
    colorDanger: "oklch(70% 0.16 25)",
  },
};

const elements = {
  card: {
    width: "100%",
    background: "transparent",
    boxShadow: "none",
    border: "none",
    padding: 0,
  },
  logoBox: {
    display: "none",
  },
  header: {
    textAlign: "left",
    padding: 0,
    marginBottom: "var(--auth-gap-md)",
  },
  headerTitle: {
    fontFamily: "var(--auth-font-display)",
    fontSize: "28px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
    color: "var(--auth-fg)",
    textAlign: "left",
    margin: "0 0 6px",
  },
  headerSubtitle: {
    fontSize: "var(--auth-fs-lead)",
    lineHeight: 1.55,
    color: "var(--auth-muted)",
    maxWidth: "40ch",
    textAlign: "left",
    margin: "0 0 var(--auth-gap-md)",
  },
  socialButtons: {
    gap: "10px",
    display: "flex",
    flexDirection: "column",
    marginBottom: "var(--auth-gap-md)",
  },
  socialButtonsBlockButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "13px 22px",
    borderRadius: "var(--auth-radius-pill)",
    border: "1px solid var(--auth-border)",
    background: "transparent",
    color: "var(--auth-fg)",
    fontSize: "15px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    boxShadow: "none",
    transition: "border-color 0.15s ease",
    "&:hover": {
      borderColor: "var(--auth-accent)",
      background: "transparent",
    },
  },
  socialButtonsBlockButtonText: {
    fontWeight: 500,
    fontSize: "15px",
  },
  dividerRow: {
    margin: "2px 0 var(--auth-gap-md)",
  },
  dividerLine: {
    background: "var(--auth-border)",
    height: "1px",
  },
  dividerText: {
    color: "var(--auth-muted)",
    fontSize: "12.5px",
  },
  form: {
    gap: "var(--auth-gap-md)",
    display: "flex",
    flexDirection: "column",
  },
  formField: {
    gap: "6px",
    marginBottom: "var(--auth-gap-md)",
  },
  formFieldLabel: {
    fontSize: "13px",
    color: "var(--auth-muted)",
    fontWeight: 500,
  },
  formFieldInput: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: "var(--auth-radius)",
    border: "1px solid var(--auth-border)",
    background: "var(--auth-bg)",
    color: "var(--auth-fg)",
    fontSize: "15px",
    boxShadow: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    "&:focus-visible": {
      borderColor: "var(--auth-accent)",
      boxShadow: "0 0 0 4px var(--auth-accent-soft)",
    },
    "&::placeholder": {
      color: "var(--auth-muted)",
    },
  },
  formFieldErrorText: {
    color: "var(--auth-danger)",
    fontSize: "12.5px",
  },
  formButtonPrimary: {
    background: "var(--auth-accent)",
    color: "var(--auth-on-accent)",
    border: "1px solid var(--auth-accent)",
    borderRadius: "var(--auth-radius-pill)",
    padding: "13px 22px",
    fontSize: "15px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    width: "100%",
    boxShadow:
      "0 8px 24px -8px color-mix(in oklch, var(--auth-accent) 55%, transparent)",
    "&:hover": {
      background: "var(--auth-accent)",
      boxShadow:
        "0 10px 30px -6px color-mix(in oklch, var(--auth-accent) 70%, transparent)",
    },
    "&:disabled": {
      opacity: 0.7,
      boxShadow: "none",
    },
  },
  formButtonReset: {
    color: "var(--auth-muted)",
    fontSize: "13.5px",
    padding: 0,
    background: "transparent",
    boxShadow: "none",
    "&:hover": {
      color: "var(--auth-accent)",
    },
  },
  alert: {
    borderRadius: "var(--auth-radius)",
    background: "color-mix(in oklch, var(--auth-danger) 10%, transparent)",
    border: "1px solid color-mix(in oklch, var(--auth-danger) 35%, transparent)",
    color: "var(--auth-fg)",
  },
  identityPreview: {
    borderRadius: "var(--auth-radius)",
    border: "1px solid var(--auth-border)",
    background: "var(--auth-bg)",
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "var(--auth-gap-md)",
  },
  footerAction: {
    justifyContent: "center",
  },
  footerActionText: {
    color: "var(--auth-muted)",
    fontSize: "13px",
  },
  footerActionLink: {
    color: "var(--auth-accent)",
    fontSize: "13px",
  },
};

export interface AuthAppearanceOptions {
  showFooter?: boolean;
}

export function authAppearance(
  theme: VeraTheme,
  options: AuthAppearanceOptions = {}
) {
  const { showFooter = true } = options;
  return {
    variables: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      borderRadius: "14px",
      ...tokens[theme],
    },
    elements: {
      ...elements,
      footer: showFooter
        ? elements.footer
        : { display: "none" },
    },
  };
}
