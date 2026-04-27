import type { RouteObject } from "react-router-dom";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppHomePage, AppShellLayout } from "@/modules/app-shell";
import {
  hasRequiredRole,
  PasswordRecoveryPage,
  RequestAccessPage,
  SignInPage,
  useAuthSession,
} from "@/modules/auth";
import { DocumentCreatePage, DocumentPreviewPage, DocumentsPage } from "@/modules/documents";
import { ProcessCreatePage, ProcessDetailPage, ProcessesPage } from "@/modules/processes";
import { LandingPage } from "@/modules/public";
import { NotFoundPage, UnauthorizedPage } from "@/modules/system";
import { AdminUsersPage } from "@/modules/users";
import { AppLayout } from "@/shared/layouts/app-layout";
import { RequireSession } from "./route-guards";

function ProtectedAppRoute() {
  const { isAuthenticated, isLoading } = useAuthSession();

  return (
    <RequireSession isAuthenticated={isAuthenticated} isLoading={isLoading}>
      <AppShellLayout />
    </RequireSession>
  );
}

function AdminOnlyRoute() {
  const { isAuthenticated, isLoading, role } = useAuthSession();

  return (
    <RequireSession
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      isAuthorized={hasRequiredRole(role, ["admin"])}
    >
      <AdminUsersPage />
    </RequireSession>
  );
}

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "entrar",
        element: <SignInPage />,
      },
      {
        path: "cadastro",
        element: <RequestAccessPage />,
      },
      {
        path: "recuperar-senha",
        element: <PasswordRecoveryPage />,
      },
      {
        path: "nao-autorizado",
        element: <UnauthorizedPage />,
      },
      {
        path: "app/admin/usuarios",
        element: <Navigate to="/admin/usuarios" replace />,
      },
      {
        path: "app",
        element: <ProtectedAppRoute />,
        children: [
          {
            index: true,
            element: <AppHomePage />,
          },
          {
            path: "processos",
            element: <ProcessesPage />,
            handle: {
              breadcrumbs: [{ label: "Central de Trabalho", href: "/app" }, { label: "Processos" }],
            },
          },
          {
            path: "processo/novo",
            element: <ProcessCreatePage />,
            handle: {
              breadcrumbs: [
                { label: "Central de Trabalho", href: "/app" },
                { label: "Processos", href: "/app/processos" },
                { label: "Novo Processo" },
              ],
            },
          },
          {
            path: "processo/:processId",
            element: <ProcessDetailPage />,
            handle: {
              breadcrumbs: [
                { label: "Central de Trabalho", href: "/app" },
                { label: "Processos", href: "/app/processos" },
                { label: "Detalhe do Processo" },
              ],
              showSearch: false,
            },
          },
          {
            path: "documentos",
            element: <DocumentsPage />,
            handle: {
              breadcrumbs: [
                { label: "Central de Trabalho", href: "/app" },
                { label: "Documentos" },
              ],
            },
          },
          {
            path: "documento/novo",
            element: <DocumentCreatePage />,
            handle: {
              breadcrumbs: [
                { label: "Central de Trabalho", href: "/app" },
                { label: "Documentos", href: "/app/documentos" },
                { label: "Novo Documento" },
              ],
            },
          },
          {
            path: "documento/:documentId/preview",
            element: <DocumentPreviewPage />,
            handle: {
              breadcrumbs: [
                { label: "Central de Trabalho", href: "/app" },
                { label: "Documentos", href: "/app/documentos" },
                { label: "Preview do Documento" },
              ],
              showSearch: false,
            },
          },
        ],
      },
      {
        path: "admin",
        element: <ProtectedAppRoute />,
        children: [
          {
            path: "usuarios",
            element: <AdminOnlyRoute />,
            handle: {
              breadcrumbs: [{ label: "Admin", href: "/app" }, { label: "Usuários" }],
              showSearch: false,
            },
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
