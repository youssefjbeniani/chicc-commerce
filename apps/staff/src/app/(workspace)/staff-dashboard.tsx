"use client";

import type { InternalAccountRole, Locale } from "@chicc/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "../actions";

type Copy = {
  brand: string; title: string; welcome: string; role: string; signOut: string; language: string;
  catalog: string; orders: string; team: string; section: string; ordersHint: string;
  catalogHint: string; teamHint: string;
};

const copy: Record<Locale, Copy> = {
  fr: {
    brand: "CHICC · ÉQUIPE", title: "Espace de travail", welcome: "Bienvenue", role: "Compte",
    signOut: "Se déconnecter", language: "Langue", catalog: "Gérer le catalogue", orders: "Commandes",
    team: "Mon équipe", section: "Votre espace", ordersHint: "Consultez les demandes web et WhatsApp, puis suivez les livraisons.",
    catalogHint: "Mettez à jour les produits, les prix et les stocks.", teamHint: "Activez les comptes et attribuez les rôles de l’équipe.",
  },
  ar: {
    brand: "CHICC · الفريق", title: "مساحة العمل", welcome: "مرحباً", role: "الحساب",
    signOut: "تسجيل الخروج", language: "اللغة", catalog: "إدارة الكتالوج", orders: "الطلبات",
    team: "إدارة الفريق", section: "مساحة العمل", ordersHint: "راجع طلبات الموقع وواتساب وتابع عمليات التوصيل.",
    catalogHint: "حدّث المنتجات والأسعار والمخزون.", teamHint: "فعّل الحسابات وحدد أدوار أعضاء الفريق.",
  },
  en: {
    brand: "CHICC · TEAM", title: "Workspace", welcome: "Welcome", role: "Account",
    signOut: "Sign out", language: "Language", catalog: "Manage catalog", orders: "Orders",
    team: "Manage team", section: "Your workspace", ordersHint: "Review website and WhatsApp requests, then track deliveries.",
    catalogHint: "Update products, prices, and stock levels.", teamHint: "Activate accounts and assign team roles.",
  },
};

const roleText: Record<Locale, Record<InternalAccountRole, string>> = {
  fr: { staff: "Équipe", delivery_worker: "Livreur", manager: "Responsable" },
  ar: { staff: "فريق العمل", delivery_worker: "عامل التوصيل", manager: "مدير" },
  en: { staff: "Staff", delivery_worker: "Delivery worker", manager: "Manager" },
};

export function StaffDashboard({ name, role }: { name: string; role: InternalAccountRole }) {
  const [locale, setLocale] = useState<Locale>("fr");
  const text = copy[locale];
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase() || "C";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return (
    <main className="shell dashboard-shell" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="dashboard-topbar">
        <span className="eyebrow">{text.brand}</span>
        <label className="language-picker">
          <span>{text.language}</span>
          <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
            <option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option>
          </select>
        </label>
      </header>

      <section className="dashboard-heading">
        <div>
          <span className="eyebrow">{text.section}</span>
          <h1>{text.title}</h1>
          <p className="intro">{text.welcome}, {name}.</p>
        </div>
        <div className="dashboard-identity">
          <span className="dashboard-avatar" aria-hidden="true">{initials}</span>
          <span className="dashboard-identity-copy"><strong>{name}</strong><small>{roleText[locale][role]}</small></span>
        </div>
      </section>

      <section className="dashboard-content" aria-label={text.section}>
        <div className="dashboard-section-heading">
          <span className="eyebrow">CHICC / {role === "manager" ? "03" : role === "staff" ? "02" : "01"}</span>
          <h2>{text.section}</h2>
        </div>
        <nav className="dashboard-actions">
          <Link className="workspace-card" href="/orders">
            <span className="workspace-card-top"><span>01</span><span aria-hidden="true">↗</span></span>
            <h3>{text.orders}</h3><p>{text.ordersHint}</p>
          </Link>
          {role !== "delivery_worker" && <Link className="workspace-card" href="/catalog">
            <span className="workspace-card-top"><span>02</span><span aria-hidden="true">↗</span></span>
            <h3>{text.catalog}</h3><p>{text.catalogHint}</p>
          </Link>}
          {role === "manager" && <Link className="workspace-card" href="/team">
            <span className="workspace-card-top"><span>03</span><span aria-hidden="true">↗</span></span>
            <h3>{text.team}</h3><p>{text.teamHint}</p>
          </Link>}
        </nav>
      </section>

      <footer className="dashboard-footer">
        <span className="dashboard-footer-note">CHICC <span aria-hidden="true">·</span> {roleText[locale][role]}</span>
        <form action={signOut}>
          <button className="secondary-button" type="submit">{text.signOut}</button>
        </form>
      </footer>
    </main>
  );
}
