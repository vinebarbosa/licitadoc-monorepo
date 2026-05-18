import type { ReactNode } from "react";

type PageHeaderProps = {
  department?: string;
  logo?: ReactNode;
  organization: string;
  subtitle?: string;
};

export function PageHeader({ department, logo, organization, subtitle }: PageHeaderProps) {
  return (
    <div className="paged-page-header">
      {logo ? <div className="paged-page-header-logo">{logo}</div> : null}
      <div className="paged-page-header-copy">
        <div className="paged-page-header-kicker">Prefeitura Municipal</div>
        <div className="paged-page-header-title">{organization}</div>
        {subtitle ? <div className="paged-page-header-subtitle">{subtitle}</div> : null}
        {department ? <div className="paged-page-header-department">{department}</div> : null}
      </div>
    </div>
  );
}
