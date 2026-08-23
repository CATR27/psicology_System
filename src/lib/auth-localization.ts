import { esMX } from "@clerk/localizations";
import type { LocalizationResource } from "@clerk/shared/types";

/**
 * Localización de Clerk basada en es-MX, con los textos del prototipo
 * de login (LOGIN_Web-Prototype/login-vera-lila-neon.html).
 */
export const authLocalization: LocalizationResource = {
  ...esMX,
  dividerText: "o continúa con tu correo",
  formButtonPrimary: "Iniciar sesión",
  signIn: {
    ...esMX.signIn!,
    start: {
      ...esMX.signIn!.start,
      title: "Inicia sesión",
      subtitle: "Accede a tu espacio clínico seguro.",
    },
  },
  signUp: {
    ...esMX.signUp!,
    start: {
      ...esMX.signUp!.start,
      title: "Crea tu cuenta",
      subtitle: "Únete a tu espacio clínico seguro.",
    },
  },
};
