import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Roles & permissions | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const roles = [
  {
    name: "Customer",
    icon: ShoppingBag,
    description: "Browse published products and manage the account's own orders.",
  },
  {
    name: "Seller",
    icon: Store,
    description: "Manage owned product listings and view order items for the seller's shop.",
  },
  {
    name: "Admin",
    icon: Shield,
    description: "Use supported product moderation and order status administration tools.",
  },
  {
    name: "Super admin",
    icon: ShieldCheck,
    description: "Access this workspace, manage ordinary user roles, and review role-change audits.",
  },
];

export default function SuperAdminRolesPermissionsPage() {
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / User Management / Roles &amp; Permissions</div>
          <h1>Roles &amp; permissions</h1>
          <p>Review the access levels supported by the current marketplace.</p>
        </div>
        <Users aria-hidden="true" className="super-admin-role-page-icon" size={25} />
      </div>

      <section aria-label="Supported user roles" className="super-admin-role-grid">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <article className="super-admin-panel super-admin-role-card" key={role.name}>
              <span className="super-admin-role-card-icon">
                <Icon aria-hidden="true" size={20} />
              </span>
              <h2>{role.name}</h2>
              <p>{role.description}</p>
            </article>
          );
        })}
      </section>

      <section className="super-admin-panel super-admin-role-policy">
        <div className="super-admin-role-policy-icon">
          <ClipboardList aria-hidden="true" size={20} />
        </div>
        <div>
          <h2>Role changes are controlled and audited</h2>
          <p>
            Only a signed-in super admin can change a customer&apos;s, seller&apos;s, or admin&apos;s
            role. Each change requires confirmation and is recorded with its actor,
            affected account, previous role, new role, and timestamp. Super-admin
            roles cannot be changed in the dashboard; provisioning and recovery stay
            local.
          </p>
          <div className="super-admin-role-policy-actions">
            <Link className="super-admin-primary-action" href="/super-admin/users">
              Manage user roles <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link className="super-admin-back-action" href="/super-admin/security">
              View role audit log <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
