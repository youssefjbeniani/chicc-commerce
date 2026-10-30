"use client";

import type { Locale } from "@chicc/types";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { provisionTeamMember, updateTeamMember, type ProvisionTeamState } from "./actions";

export type TeamAccount = {
  account_id: string;
  account_email: string;
  account_display_name: string | null;
  account_role: "staff" | "delivery_worker";
  account_is_active: boolean;
  account_created_at: string;
};

type Copy = {
  brand: string; title: string; back: string; language: string; addTitle: string; addHint: string;
  email: string; name: string; role: string; staff: string; worker: string; provision: string; saving: string;
  created: string; invalid: string; notReady: string; denied: string; failed: string; active: string;
  inactive: string; update: string; updated: string; notFound: string; loadFailed: string; empty: string;
  account: string; joined: string; status: string;
};
const copy: Record<Locale, Copy> = {
  fr: { brand: "CHICC · ÉQUIPE", title: "Gestion de l’équipe", back: "Espace équipe", language: "Langue", addTitle: "Ajouter un membre", addHint: "Créez ou invitez d’abord son compte dans Supabase Auth. Après confirmation de son adresse e-mail, attribuez-lui un rôle ici.", email: "Adresse e-mail confirmée", name: "Nom affiché (facultatif)", role: "Rôle", staff: "Équipe", worker: "Livreur", provision: "Activer le compte", saving: "Enregistrement…", created: "Compte d’équipe activé.", invalid: "Vérifiez l’adresse e-mail, le nom et le rôle.", notReady: "Aucun compte confirmé ne correspond à cette adresse e-mail.", denied: "Seuls les responsables peuvent gérer l’équipe.", failed: "Impossible d’enregistrer ce compte.", active: "Actif", inactive: "Désactivé", update: "Mettre à jour", updated: "Compte mis à jour.", notFound: "Ce compte n’est plus disponible.", loadFailed: "Impossible de charger l’équipe. Vérifiez la migration du jalon 6.", empty: "Aucun membre n’a encore été activé.", account: "Compte", joined: "Créé le", status: "Accès" },
  ar: { brand: "CHICC · الفريق", title: "إدارة الفريق", back: "مساحة الفريق", language: "اللغة", addTitle: "إضافة عضو", addHint: "أنشئ الحساب أو أرسل دعوة أولاً من Supabase Auth. بعد تأكيد البريد الإلكتروني، عيّن الدور هنا.", email: "بريد إلكتروني مؤكد", name: "الاسم الظاهر (اختياري)", role: "الدور", staff: "موظف", worker: "عامل توصيل", provision: "تفعيل الحساب", saving: "جارٍ الحفظ…", created: "تم تفعيل حساب الفريق.", invalid: "تحقق من البريد والاسم والدور.", notReady: "لا يوجد حساب مؤكد بهذا البريد الإلكتروني.", denied: "يمكن للمديرين فقط إدارة الفريق.", failed: "تعذر حفظ الحساب.", active: "نشط", inactive: "معطل", update: "تحديث", updated: "تم تحديث الحساب.", notFound: "هذا الحساب لم يعد متاحاً.", loadFailed: "تعذر تحميل الفريق. تحقق من ترحيل المرحلة السادسة.", empty: "لم يتم تفعيل أي أعضاء بعد.", account: "الحساب", joined: "تاريخ الإنشاء", status: "الوصول" },
  en: { brand: "CHICC · TEAM", title: "Team management", back: "Workspace", language: "Language", addTitle: "Add a team member", addHint: "Create or invite their account in Supabase Auth first. After they confirm their email, assign their role here.", email: "Confirmed email address", name: "Display name (optional)", role: "Role", staff: "Staff", worker: "Delivery worker", provision: "Activate account", saving: "Saving…", created: "Team account activated.", invalid: "Check the email, name, and role.", notReady: "No confirmed account matches that email address.", denied: "Only managers can manage the team.", failed: "Could not save this account.", active: "Active", inactive: "Disabled", update: "Update", updated: "Account updated.", notFound: "This account is no longer available.", loadFailed: "Could not load the team. Check that the Milestone 6 migration is applied.", empty: "No team members have been activated yet.", account: "Account", joined: "Created", status: "Access" },
};

function formMessage(state: ProvisionTeamState, text: Copy) {
  if (typeof state === "object" && state?.status === "created") return text.created;
  if (state === "invalid") return text.invalid;
  if (state === "not_ready") return text.notReady;
  if (state === "not_authorized") return text.denied;
  if (state === "save_failed") return text.failed;
  return "";
}

export function TeamManager({ members, loadError, notice }: { members: TeamAccount[]; loadError: boolean; notice: string | null }) {
  const [locale, setLocale] = useState<Locale>("fr");
  const [state, action, pending] = useActionState<ProvisionTeamState, FormData>(provisionTeamMember, null);
  const formRef = useRef<HTMLFormElement>(null);
  const text = copy[locale];
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  useEffect(() => {
    if (typeof state === "object" && state?.status === "created") formRef.current?.reset();
  }, [state]);

  const noticeText = notice === "updated" ? text.updated : notice === "not_authorized" ? text.denied : notice === "not_found" ? text.notFound : notice === "failed" ? text.failed : "";

  return (
    <main className="team-shell" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="dashboard-topbar">
        <Link className="eyebrow catalog-brand" href="/">{text.brand}</Link>
        <div className="orders-header-tools">
          <Link className="secondary-button action-link" href="/">{text.back}</Link>
          <label className="language-picker"><span>{text.language}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              <option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option>
            </select>
          </label>
        </div>
      </header>
      <h1>{text.title}</h1>
      {noticeText && <p className={notice === "updated" ? "success-message" : "form-message"} role="status">{noticeText}</p>}
      {loadError && <p className="form-message" role="alert">{text.loadFailed}</p>}
      {!loadError && members.length === 0 && <p className="empty-note">{text.empty}</p>}
      {!loadError && members.length > 0 && (
        <section className="team-list" aria-label={text.title}>
          {members.map((member) => (
            <article className="team-card" key={member.account_id}>
              <div className="team-account-heading">
                <strong>{member.account_display_name || member.account_email}</strong>
                {member.account_display_name && <a href={`mailto:${encodeURIComponent(member.account_email)}`}>{member.account_email}</a>}
                <small>{text.joined}: {new Date(member.account_created_at).toLocaleDateString(locale)}</small>
              </div>
              <form action={updateTeamMember} className="team-update-form">
                <input type="hidden" name="user_id" value={member.account_id} />
                <label><span>{text.role}</span><select name="role" defaultValue={member.account_role}>
                  <option value="staff">{text.staff}</option><option value="delivery_worker">{text.worker}</option>
                </select></label>
                <label><span>{text.status}</span><select name="active" defaultValue={member.account_is_active ? "active" : "inactive"}>
                  <option value="active">{text.active}</option><option value="inactive">{text.inactive}</option>
                </select></label>
                <button className="secondary-button" type="submit">{text.update}</button>
              </form>
            </article>
          ))}
        </section>
      )}
      <section className="team-provision-card">
        <h2>{text.addTitle}</h2>
        <p className="intro">{text.addHint}</p>
        <form ref={formRef} action={action} className="team-provision-form">
          <label><span>{text.email}</span><input name="email" required type="email" maxLength={254} autoComplete="email" /></label>
          <label><span>{text.name}</span><input name="display_name" maxLength={120} autoComplete="name" /></label>
          <label><span>{text.role}</span><select name="role" defaultValue="delivery_worker"><option value="delivery_worker">{text.worker}</option><option value="staff">{text.staff}</option></select></label>
          {state && <p className={typeof state === "object" ? "success-message" : "form-message"} role={typeof state === "object" ? "status" : "alert"}>{formMessage(state, text)}</p>}
          <button className="primary-button" type="submit" disabled={pending}>{pending ? text.saving : text.provision}</button>
        </form>
      </section>
    </main>
  );
}
