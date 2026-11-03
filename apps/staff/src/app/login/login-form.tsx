"use client";

import type { Locale } from "@chicc/types";
import { useActionState, useEffect, useState } from "react";
import { ChiccLogo } from "@chicc/ui";
import { signIn, type LoginError } from "../actions";

const copy: Record<Locale, {
  label: string; title: string; subtitle: string; email: string; password: string;
  submit: string; working: string; invalid: string; unauthorized: string; setup: string;
  language: string; brand: string;
}> = {
  fr: {
    label: "ESPACE ÉQUIPE", title: "Connexion", subtitle: "Connectez-vous avec votre compte professionnel.",
    email: "Adresse e-mail", password: "Mot de passe", submit: "Se connecter", working: "Connexion…",
    invalid: "E-mail ou mot de passe incorrect.", unauthorized: "Ce compte n'a pas accès à l'espace équipe.",
    setup: "La connexion Supabase n'est pas configurée ou la migration n'a pas encore été appliquée.",
    language: "Langue", brand: "CHICC · ÉQUIPE",
  },
  ar: {
    label: "مساحة الفريق", title: "تسجيل الدخول", subtitle: "سجّل الدخول باستخدام حساب العمل الخاص بك.",
    email: "البريد الإلكتروني", password: "كلمة المرور", submit: "تسجيل الدخول", working: "جارٍ تسجيل الدخول…",
    invalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة.", unauthorized: "هذا الحساب غير مخوّل لدخول مساحة الفريق.",
    setup: "لم يتم إعداد اتصال Supabase أو لم يتم تطبيق ترحيل قاعدة البيانات بعد.",
    language: "اللغة", brand: "CHICC · الفريق",
  },
  en: {
    label: "TEAM WORKSPACE", title: "Sign in", subtitle: "Use your individual work account to continue.",
    email: "Email address", password: "Password", submit: "Sign in", working: "Signing in…",
    invalid: "The email or password is incorrect.", unauthorized: "This account does not have staff access.",
    setup: "Supabase is not configured or the database migration has not been applied yet.",
    language: "Language", brand: "CHICC · TEAM",
  },
};

export function LoginForm({ initialError }: { initialError: string | null }) {
  const [locale, setLocale] = useState<Locale>("fr");
  const [state, action, pending] = useActionState<LoginError, FormData>(signIn, null);
  const text = copy[locale];
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  const error = state === "invalid_credentials" ? text.invalid
    : state === "not_authorized" ? text.unauthorized
    : state === "setup_required" ? text.setup
    : initialError === "not_authorized" ? text.unauthorized
    : initialError === "database" || initialError === "supabase" ? text.setup
    : null;

  return (
    <main className="login-shell" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="login-topbar">
        <div className="brand-lockup"><ChiccLogo className="brand-logo" /><span className="eyebrow">{text.brand}</span></div>
        <label className="language-picker">
          <span>{text.language}</span>
          <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </label>
      </header>
      <section className="login-card">
        <span className="eyebrow">{text.label}</span>
        <h1>{text.title}</h1>
        <p className="intro">{text.subtitle}</p>
        <form action={action} className="login-form">
          <label>
            <span>{text.email}</span>
            <input name="email" type="email" autoComplete="username" required maxLength={254} />
          </label>
          <label>
            <span>{text.password}</span>
            <input name="password" type="password" autoComplete="current-password" required maxLength={256} />
          </label>
          {error && <p className="form-message" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? text.working : text.submit}
          </button>
        </form>
      </section>
      <p className="login-footnote">CHICC · {locale === "ar" ? "دخول مخصص لأعضاء الفريق" : locale === "fr" ? "Accès réservé aux membres de l'équipe" : "Individual team access"}</p>
    </main>
  );
}
