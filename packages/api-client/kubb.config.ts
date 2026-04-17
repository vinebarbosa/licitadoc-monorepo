import { defineConfig } from "@kubb/core";
import { pluginClient } from "@kubb/plugin-client";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginTs } from "@kubb/plugin-ts";

export default defineConfig({
  root: ".",
  input: {
    path: "http://127.0.0.1:3333/openapi.json",
  },
  output: {
    path: "./src/gen",
    clean: true,
  },
  plugins: [
    pluginOas({
      validate: true,
    }),
    pluginTs({
      output: {
        path: "./models",
        barrelType: "named",
      },
    }),
    pluginClient({
      output: {
        path: "./client",
        barrelType: "named",
      },
      importPath: "../../client",
      baseURL: "http://localhost:3333",
      pathParamsType: "object",
    }),
    pluginReactQuery({
      output: {
        path: "./hooks",
        barrelType: "named",
      },
      group: {
        type: "tag",
        name: ({ group }) => `${group}Hooks`,
      },
      client: {
        importPath: "../../../client",
        dataReturnType: "data",
        baseURL: "http://localhost:3333",
      },
      paramsType: "object",
      query: {
        methods: ["get"],
        importPath: "@tanstack/react-query",
      },
      mutation: {
        methods: ["post", "put", "patch", "delete"],
        importPath: "@tanstack/react-query",
      },
    }),
  ],
});
