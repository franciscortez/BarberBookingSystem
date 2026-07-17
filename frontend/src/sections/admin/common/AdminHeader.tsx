import React from "react";
import { titleCase } from "../adminPortalUtils";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle = "Manage shop operations from one place.",
}) => (
  <div className="mb-6">
    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
      Administration
    </p>
    <h1 className="mt-1 text-2xl font-bold text-slate-950">
      {titleCase(title)}
    </h1>
    <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
  </div>
);

export default AdminHeader;
