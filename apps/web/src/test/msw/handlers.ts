import { HttpResponse, http } from "msw";
import {
  anonymousSessionResponse,
  departmentCreateResponse,
  departmentsListResponse,
  documentCreateResponse,
  documentDetailResponse,
  documentsListResponse,
  emptyDocumentDetailResponse,
  failedDocumentDetailResponse,
  generatingDocumentDetailResponse,
  healthOkResponse,
  organizationsListResponse,
  processCreateResponse,
  processDetailResponse,
  processesListResponse,
  usersListResponse,
} from "./fixtures";

export const handlers = [
  http.get("http://localhost:3333/health", () => {
    return HttpResponse.json(healthOkResponse);
  }),
  http.get("http://localhost:3333/api/auth/get-session", () => {
    return HttpResponse.json(anonymousSessionResponse);
  }),
  http.post("http://localhost:3333/api/auth/sign-out", () => {
    return HttpResponse.json({ success: true });
  }),
  http.get("http://localhost:3333/api/users/", () => {
    return HttpResponse.json(usersListResponse);
  }),
  http.get("http://localhost:3333/api/invites/", () => {
    return HttpResponse.json({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    });
  }),
  http.get("http://localhost:3333/api/organizations/", () => {
    return HttpResponse.json(organizationsListResponse);
  }),
  http.get("http://localhost:3333/api/departments/", () => {
    return HttpResponse.json(departmentsListResponse);
  }),
  http.post("http://localhost:3333/api/departments/", () => {
    return HttpResponse.json(departmentCreateResponse, { status: 201 });
  }),
  http.get("http://localhost:3333/api/processes/", () => {
    return HttpResponse.json(processesListResponse);
  }),
  http.get("http://localhost:3333/api/processes/:processId", ({ params }) => {
    return HttpResponse.json({
      ...processDetailResponse,
      id: String(params.processId ?? processDetailResponse.id),
    });
  }),
  http.post("http://localhost:3333/api/processes/", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { processNumber?: string } | null;

    if (body?.processNumber === "PROC-CONFLICT") {
      return HttpResponse.json(
        {
          error: "conflict",
          message: "Process number already exists.",
          details: null,
        },
        { status: 409 },
      );
    }

    return HttpResponse.json(processCreateResponse, { status: 201 });
  }),
  http.get("http://localhost:3333/api/documents/", () => {
    return HttpResponse.json(documentsListResponse);
  }),
  http.get("http://localhost:3333/api/documents/:documentId", ({ params }) => {
    const documentId = String(params.documentId ?? "");

    if (documentId === generatingDocumentDetailResponse.id) {
      return HttpResponse.json(generatingDocumentDetailResponse);
    }

    if (documentId === failedDocumentDetailResponse.id) {
      return HttpResponse.json(failedDocumentDetailResponse);
    }

    if (documentId === emptyDocumentDetailResponse.id) {
      return HttpResponse.json(emptyDocumentDetailResponse);
    }

    return HttpResponse.json({
      ...documentDetailResponse,
      id: documentId || documentDetailResponse.id,
    });
  }),
  http.post("http://localhost:3333/api/documents/", () => {
    return HttpResponse.json(documentCreateResponse, { status: 201 });
  }),
];
