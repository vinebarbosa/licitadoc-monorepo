type PageFooterProps = {
  address?: string;
  cnpj?: string;
  showPageNumbers?: boolean;
  website?: string;
};

export function PageFooter({ address, cnpj, showPageNumbers = true, website }: PageFooterProps) {
  return (
    <div className="paged-page-footer">
      <div className="paged-page-footer-lines">
        {website ? <div>{website}</div> : null}
        {address ? <div>{address}</div> : null}
        {cnpj ? <div>CNPJ: {cnpj}</div> : null}
      </div>
      {showPageNumbers ? (
        <div className="paged-page-footer-number">
          Pagina <span className="paged-page-number" /> de <span className="paged-page-total" />
        </div>
      ) : null}
    </div>
  );
}
