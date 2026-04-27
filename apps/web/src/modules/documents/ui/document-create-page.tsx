import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  FileSearch,
  Loader2,
  Scale,
  ScrollText,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useDocumentCreate, useProcessesPicker } from "../api/documents";
import type { DocumentType } from "../model/documents";
import { deriveInitialDocumentName } from "../model/documents";

const documentTypeDefinitions: Array<{
  id: DocumentType;
  title: string;
  fullName: string;
  description: string;
  icon: typeof ClipboardList;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = [
  {
    id: "dfd",
    title: "DFD",
    fullName: "Documento de Formalização de Demanda",
    description:
      "Justifica a necessidade da contratação, com base no planejamento estratégico da instituição.",
    icon: ClipboardList,
    colorClass: "text-chart-1",
    bgClass: "bg-chart-1/10",
    borderClass: "border-chart-1/30",
  },
  {
    id: "etp",
    title: "ETP",
    fullName: "Estudo Técnico Preliminar",
    description:
      "Analisa as soluções disponíveis no mercado e define a melhor estratégia de contratação.",
    icon: FileSearch,
    colorClass: "text-chart-2",
    bgClass: "bg-chart-2/10",
    borderClass: "border-chart-2/30",
  },
  {
    id: "tr",
    title: "TR",
    fullName: "Termo de Referência",
    description: "Especifica as condições técnicas, requisitos e critérios para a contratação.",
    icon: ScrollText,
    colorClass: "text-chart-3",
    bgClass: "bg-chart-3/10",
    borderClass: "border-chart-3/30",
  },
  {
    id: "minuta",
    title: "Minuta",
    fullName: "Minuta do Contrato",
    description: "Define as cláusulas contratuais, obrigações das partes e penalidades.",
    icon: Scale,
    colorClass: "text-chart-5",
    bgClass: "bg-chart-5/10",
    borderClass: "border-chart-5/30",
  },
];

export function DocumentCreatePageUI() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tipoParam = searchParams.get("tipo") as DocumentType | null;
  const processoParam = searchParams.get("processo") ?? "";

  const [selectedType, setSelectedType] = useState<DocumentType | null>(
    documentTypeDefinitions.some((t) => t.id === tipoParam) ? tipoParam : null,
  );
  const [selectedProcessId, setSelectedProcessId] = useState<string>(processoParam);
  const [documentName, setDocumentName] = useState("");

  const processesPicker = useProcessesPicker();
  const createMutation = useDocumentCreate();

  const processes = processesPicker.data?.items ?? [];
  const isLoadingProcesses = processesPicker.isLoading;

  function handleTypeSelect(typeId: DocumentType) {
    setSelectedType(typeId);
    if (selectedProcessId) {
      const process = processes.find((p) => p.id === selectedProcessId);
      if (process) {
        setDocumentName(deriveInitialDocumentName(typeId, process.processNumber));
      }
    }
  }

  function handleProcessSelect(processId: string) {
    setSelectedProcessId(processId);
    if (selectedType) {
      const process = processes.find((p) => p.id === processId);
      if (process) {
        setDocumentName(deriveInitialDocumentName(selectedType, process.processNumber));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType || !selectedProcessId) return;

    createMutation.mutate(
      {
        data: {
          processId: selectedProcessId,
          documentType: selectedType,
          name: documentName.trim() || null,
          instructions: null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Documento criado com sucesso.");
          navigate("/app/documentos");
        },
        onError: (error) => {
          const message =
            (error as { data?: { message?: string } }).data?.message ??
            "Erro ao criar documento. Tente novamente.";
          toast.error(message);
        },
      },
    );
  }

  const canSubmit = selectedType !== null && selectedProcessId.length > 0;

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-start gap-4">
          <Link
            to="/app/documentos"
            className="mt-0.5 -ml-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Voltar para Documentos"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Novo Documento</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione o tipo de documento que deseja criar
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipo de Documento</CardTitle>
              <CardDescription>
                Escolha o tipo de documento conforme a Lei 14.133/2021
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {documentTypeDefinitions.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      aria-label={`Selecionar ${type.title}`}
                      onClick={() => handleTypeSelect(type.id)}
                      className={cn(
                        "flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all hover:shadow-md",
                        isSelected
                          ? `${type.borderClass} ${type.bgClass}`
                          : "border-border hover:border-primary/30",
                      )}
                    >
                      <div
                        className={cn("rounded-lg p-2.5", isSelected ? type.bgClass : "bg-muted")}
                      >
                        <type.icon
                          className={cn(
                            "h-5 w-5",
                            isSelected ? type.colorClass : "text-muted-foreground",
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-semibold">{type.title}</span>
                          {isSelected && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs",
                                type.bgClass,
                                type.colorClass,
                              )}
                            >
                              Selecionado
                            </span>
                          )}
                        </div>
                        <p className="mb-1 text-sm text-muted-foreground">{type.fullName}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processo de Contratação</CardTitle>
              <CardDescription>Vincule este documento a um processo existente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="processo">Processo *</Label>
                <Select
                  value={selectedProcessId}
                  onValueChange={handleProcessSelect}
                  disabled={isLoadingProcesses}
                >
                  <SelectTrigger id="processo">
                    {isLoadingProcesses ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando processos…
                      </span>
                    ) : (
                      <SelectValue placeholder="Selecione o processo" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {processes.length === 0 && !isLoadingProcesses ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        Nenhum processo disponível.
                      </div>
                    ) : (
                      processes.map((process) => (
                        <SelectItem key={process.id} value={process.id}>
                          <span className="mr-2 font-mono text-xs">{process.processNumber}</span>
                          <span>{process.object}</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Documento</Label>
                <Input
                  id="nome"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Nome será gerado automaticamente"
                />
                <p className="text-xs text-muted-foreground">
                  O nome é gerado automaticamente, mas pode ser personalizado.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link to="/app/documentos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={!canSubmit || createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando…
                </>
              ) : (
                <>
                  Criar e Editar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
