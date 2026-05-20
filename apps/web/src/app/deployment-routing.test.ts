import vercelConfig from "../../vercel.json";

describe("web deployment routing", () => {
  it("keeps filesystem assets and reserved paths ahead of the SPA fallback", () => {
    expect(vercelConfig.routes).toEqual([
      { handle: "filesystem" },
      { src: "/api/(.*)", status: 404 },
      { src: "/.*\\..*", status: 404 },
      { src: "/(.*)", dest: "/index.html" },
    ]);
  });
});
