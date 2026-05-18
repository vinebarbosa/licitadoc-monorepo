declare module "pagedjs" {
  export type PagedPreviewFlow = {
    pages?: unknown[];
    performance?: number;
    size?: unknown;
  };

  export class Previewer {
    constructor(options?: Record<string, unknown>);
    preview(
      content?: Node | string,
      stylesheets?: Array<string | Record<string, string>>,
      renderTo?: Element,
    ): Promise<PagedPreviewFlow>;
    polisher?: {
      destroy?: () => void;
    };
  }
}
