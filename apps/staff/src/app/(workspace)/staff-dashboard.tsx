"use client";

import type { InternalAccountRole, Locale } from "@chicc/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "../actions";

const copy: Record<Locale, { brand: string; title: string; welcome: string; role: string; signOut: string; language: string; catalog: string; orders: string; team: string }> = {
  fr: { brand: "CHICC · ÉQUIPE", title: "Espace de travail", welcome: "Bienvenue", role: "Compte", signOut: "Se déconnecter", language: "Langue", catalog: "Gérer le catalogue", orders: "Commandes", team: "Mon équipe" },
  ar: { brand: "CHICC · الفريق", title: "مساحة العمل", welcome: "مرحباً", role: "الحساب", signOut: "تسجيل الخروج", language: "اللغة", catalog: "إدارة الكتالوج", orders: "الطلبات", team: "إدارة الفريق" },
  en: { brand: "CHICC · TEAM", title: "Workspace", welcome: "Welcome", role: "Account", signOut: "Sign out", language: "Language", catalog: "Manage catalog", orders: "Orders", team: "Manage team" },
};

const roleText: Record<Locale, Record<InternalAccountRole, string>> = {
  fr: { staff: "Équipe", delivery_worker: "Livreur", manager: "Responsable" },
  ar: { staff: "فريق العمل", delivery_worker: "عامل التوصيل", manager: "مدير" },
  en: { staff: "Staff", delivery_worker: "Delivery worker", manager: "Manager" },
};

export function StaffDashboard({ name, role }: { name: string; role: InternalAccountRole }) {
  const [locale, setLocale] = useState<Locale>("fr");
  const text = copy[locale];
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  return (
    <main className="shell" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="dashboard-topbar">
        <span className="eyebrow">{text.brand}</span>
        <label className="language-picker">
          <span>{text.language}</span>
          <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
            <option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option>
          </select>
        </label>
      </header>
      <h1>{text.title}</h1>
      <p className="intro">{text.welcome}, {name}.</p>
      <section className="starter-card">
        <h2>{text.role}: {roleText[locale][role]}</h2>
        <p>{locale === "fr" ? "Commandes et livraisons" : locale === "ar" ? "إدارة الطلبات والتوصيل" : "Manage orders and deliveries."}</p>
      </section>
      <nav className="dashboard-actions">
        <Link className="secondary-button action-link" href="/orders">{text.orders}</Link>
        {role === "manager" && <Link className="secondary-button action-link" href="/team">{text.team}</Link>}
        {role !== "delivery_worker" && <Link className="secondary-button action-link" href="/catalog">{text.catalog}</Link>}
        <form action={signOut}>
          <button className="secondary-button" type="submit">{text.signOut}</button>
        </form>
      </nav>
    </main>
  );
}
