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
import { OwnerOrganizationOnboardingPage, OwnerProfileOnboardingPage } from "@/modules/onboarding";
import { ProcessCreatePage, ProcessDetailPage, ProcessEditPage, ProcessesPage } from "@/modules/processes";
import { LandingPage, ProcessCreateDemoPage, ProcessDetailDemoPage } from "@/modules/public";
import { NotFoundPage, UnauthorizedPage } from "@/modules/system";
import { AdminUsersPage, OwnerMembersPage } from "@/modules/users";
import { AppLayout } from "@/shared/layouts/app-layout";
import { RequireCompletedOnboarding, RequireOnboardingStep, RequireSession } from "./route-guards";

function ProtectedAppRoute() {
  const { isAuthenticated, isLoading, onboardingStatus, role } = useAuthSession();

  return (
    <RequireSession isAuthenticated={isAuthenticated} isLoading={isLoading}>
      <RequireCompletedOnboarding onboardingStatus={onboardingStatus} role={role}>
        <AppShellLayout />
      </RequireCompletedOnboarding>
    </RequireSession>
  );
}

function AdminOnlyRoute() {
  const { isAuthenticated, isLoading, onboardingStatus, role } = useAuthSession();

  return (
    <RequireSession
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      isAuthorized={hasRequiredRole(role, ["admin"])}
    >
      <RequireCompletedOnboarding onboardingStatus={onboardingStatus} role={role}>
        <AdminUsersPage />
      </RequireCompletedOnboarding>
    </RequireSession>
  );
}

function OwnerOnlyRoute() {
  const { isAuthenticated, isLoading, onboardingStatus, role } = useAuthSession();

  return (
    <RequireSession
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      isAuthorized={hasRequiredRole(role, ["organization_owner"])}
    >
      <RequireCompletedOnboarding onboardingStatus={onboardingStatus} role={role}>
        <OwnerMembersPage />
      </RequireCompletedOnboarding>
    </RequireSession>
  );
}

function OwnerProfileOnboardingRoute() {
  const { isAuthenticated, isLoading, onboardingStatus } = useAuthSession();

  return (
    <RequireSession isAuthenticated={isAuthenticated} isLoading={isLoading}>
      <RequireOnboardingStep onboardingStatus={onboardingStatus} expectedStatus="pending_profile">
        <OwnerProfileOnboardingPage />
      </RequireOnboardingStep>
    </RequireSession>
  );
}

function OwnerOrganizationOnboardingRoute() {
  const { isAuthenticated, isLoading, onboardingStatus } = useAuthSession();

  return (
    <RequireSession isAuthenticated={isAuthenticated} isLoading={isLoading}>
      <RequireOnboardingStep
        onboardingStatus={onboardingStatus}
        expectedStatus="pending_organization"
      >
        <OwnerOrganizationOnboardingPage />
      </RequireOnboardingStep>
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
        path: "demo/processo/novo",
        element: <ProcessCreateDemoPage />,
      },
      {
        path: "demo/processo/:processId",
        element: <ProcessDetailDemoPage />,
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
        path: "onboarding/perfil",
        element: <OwnerProfileOnboardingRoute />,
      },
      {
        path: "onboarding/organizacao",
        element: <OwnerOrganizationOnboardingRoute />,
      },
      {
        path: "onboarding/membro/perfil",
        element: <Navigate to="/app" replace />,
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
            path: "membros",
            element: <OwnerOnlyRoute />,
            handle: {
              breadcrumbs: [{ label: "Central de Trabalho", href: "/app" }, { label: "Membros" }],
            },
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
            },
          },
          {
            path: "processo/:processId/editar",
            element: <ProcessEditPage />,
            handle: {
              breadcrumbs: [
                { label: "Central de Trabalho", href: "/app" },
                { label: "Processos", href: "/app/processos" },
                { label: "Editar Processo" },
              ],
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
