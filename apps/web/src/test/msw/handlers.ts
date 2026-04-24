import { HttpResponse, http } from "msw";
import { anonymousSessionResponse, healthOkResponse } from "./fixtures";

export const handlers = [
  http.get("http://localhost:3333/health", () => {
    return HttpResponse.json(healthOkResponse);
  }),
  http.get("http://localhost:3333/api/auth/get-session", () => {
    return HttpResponse.json(anonymousSessionResponse);
  }),
];
