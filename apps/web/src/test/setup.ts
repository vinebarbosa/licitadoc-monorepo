import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { resetOrganizationWorkspaceMockData } from "./msw/handlers";
import { server } from "./msw/server";

vi.mock("pagedjs", () => {
  class Previewer {
    polisher = {
      destroy: vi.fn(),
    };

    preview(content?: Node | string, _stylesheets?: unknown[], renderTo?: Element) {
      const pages = document.createElement("div");
      pages.className = "pagedjs_pages";
      const page = document.createElement("div");
      page.className = "pagedjs_page";
      const source =
        content instanceof Element ? (content.querySelector(".page-content") ?? content) : content;
      const clonedContent =
        source instanceof Node
          ? source.cloneNode(true)
          : document.createTextNode(String(source ?? ""));

      if (clonedContent instanceof Element) {
        clonedContent.removeAttribute("aria-hidden");
      }

      page.append(clonedContent);
      pages.append(page);
      renderTo?.append(pages);

      return Promise.resolve({
        pages: [page],
        performance: 1,
      });
    }
  }

  return { Previewer };
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  resetOrganizationWorkspaceMockData();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
