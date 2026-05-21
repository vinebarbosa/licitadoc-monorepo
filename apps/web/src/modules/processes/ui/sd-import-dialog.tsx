import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FileUploadField } from "@/shared/ui/file-upload-field";
import { Separator } from "@/shared/ui/separator";
import { Spinner } from "@/shared/ui/spinner";
import { ExpenseRequestPdfError, extractExpenseRequestFromPdf } from "../model/expense-request-pdf";
import type { ExpenseRequestExtractionResult } from "../model/processes";

type SdImportDialogProps = {
  onApply: (extraction: ExpenseRequestExtractionResult) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function getPdfErrorMessage(error: unknown) {
  if (error instanceof ExpenseRequestPdfError) {
    if (
      error.reason === "invalid_file" ||
      error.reason === "read_failed" ||
      error.reason === "empty_text"
    ) {
      return "Não foi possível ler o PDF selecionado. Verifique se o arquivo é um PDF com texto selecionável.";
    }

    if (error.reason === "unrecognized_sd") {
      return "O arquivo não foi reconhecido como uma Solicitação de Despesa TopDown.";
    }

    if (error.reason === "missing_required_fields") {
      return "A Solicitação de despesa foi lida, mas campos obrigatórios não foram encontrados.";
    }
  }

  return "Não foi possível importar a Solicitação de despesa. Selecione outro PDF ou continue preenchendo manualmente.";
}

function getPreviewValue(value: string | null | undefined) {
  return value?.trim() ? value : "Não encontrado";
}

function formatUploadFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function SdImportDialog({ onApply, onOpenChange, open }: SdImportDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [extraction, setExtraction] = useState<ExpenseRequestExtractionResult>();
  const [isReading, setIsReading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>();
  const [selectedFileSize, setSelectedFileSize] = useState<number>();
  const requestIdRef = useRef(0);

  function resetDialogState() {
    setErrorMessage(undefined);
    setExtraction(undefined);
    setIsReading(false);
    setSelectedFileName(undefined);
    setSelectedFileSize(undefined);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      requestIdRef.current += 1;
      resetDialogState();
    }

    onOpenChange(nextOpen);
  }

  async function handleFileChange(files: FileList | null) {
    const file = files?.[0];
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setErrorMessage(undefined);
    setExtraction(undefined);
    setSelectedFileName(file?.name);
    setSelectedFileSize(file?.size);

    if (!file) {
      setIsReading(false);
      return;
    }

    setIsReading(true);

    try {
      const nextExtraction = await extractExpenseRequestFromPdf(file);

      if (requestIdRef.current === requestId) {
        setExtraction(nextExtraction);
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setErrorMessage(getPdfErrorMessage(error));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsReading(false);
      }
    }
  }

  function handleRemoveFile() {
    requestIdRef.current += 1;
    resetDialogState();
  }

  function handleApply() {
    if (!extraction) {
      return;
    }

    onApply(extraction);
    handleOpenChange(false);
  }

  const sourceReference = extraction?.suggestions.sourceReference;
  const extractedFields = extraction?.extractedFields;
  const detectedItemCount = extraction?.suggestions.expenseRequestItems?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Solicitação de Despesa</DialogTitle>
          <DialogDescription>
            Selecione o PDF da Solicitação de Despesa para revisar os dados antes de aplicar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <FileUploadField
            id="sdImportFile"
            accept="application/pdf,.pdf"
            actionLabel="Selecionar PDF"
            description="Você poderá revisar os dados antes de aplicar."
            disabled={isReading}
            fileName={selectedFileName}
            fileSizeLabel={selectedFileSize ? formatUploadFileSize(selectedFileSize) : null}
            idleDescription="Somente PDF da Solicitação de Despesa."
            idleTitle="Arraste o PDF aqui ou selecione o arquivo"
            draggingTitle="Solte o PDF para importar"
            label="Arquivo PDF"
            onFilesChange={(files) => void handleFileChange(files)}
            onRemove={handleRemoveFile}
          />

          {isReading ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Lendo {selectedFileName ?? "PDF"}...
            </div>
          ) : null}

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Importação não concluída</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          {extraction ? (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-sm font-medium">Prévia extraída</p>
                    <p className="text-xs text-muted-foreground">{extraction.fileName}</p>
                  </div>
                </div>
                {sourceReference ? <Badge variant="secondary">{sourceReference}</Badge> : null}
              </div>

              <Separator />

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Número da Solicitação de despesa</p>
                  <p className="font-medium">{getPreviewValue(extractedFields?.requestNumber)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data de emissão</p>
                  <p className="font-medium">{getPreviewValue(extractedFields?.issueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CNPJ</p>
                  <p className="font-medium">
                    {getPreviewValue(extractedFields?.organizationCnpj)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unidade orçamentária</p>
                  <p className="font-medium">
                    {getPreviewValue(extractedFields?.budgetUnitCode)}
                    {extractedFields?.budgetUnitName ? ` - ${extractedFields.budgetUnitName}` : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <p className="text-xs text-muted-foreground">Objeto</p>
                <p className="line-clamp-3 leading-relaxed">
                  {getPreviewValue(extractedFields?.object)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline">
                  {detectedItemCount} item{detectedItemCount === 1 ? "" : "s"} detectado
                  {detectedItemCount === 1 ? "" : "s"}
                </Badge>
                {extraction.warnings.length > 0 ? (
                  <Badge variant="outline">{extraction.warnings.length} aviso(s)</Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Os itens detectados na Solicitação de despesa não serão importados; informe-os
                manualmente na etapa de itens.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleApply} disabled={!extraction || isReading}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
