import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { FileUploadField } from "./file-upload-field";

describe("FileUploadField", () => {
  it("handles files dropped on the upload area", () => {
    const onFilesChange = vi.fn();
    const file = new File(["conteudo"], "solicitacao.pdf", { type: "application/pdf" });

    renderWithProviders(
      <FileUploadField
        id="arquivo"
        actionLabel="Selecionar arquivo"
        idleTitle="Arraste o arquivo aqui ou selecione"
        draggingTitle="Solte o arquivo para anexar"
        label="Arquivo"
        onFilesChange={onFilesChange}
      />,
    );

    const idleCopy = screen.getByText("Arraste o arquivo aqui ou selecione");

    fireEvent.dragEnter(idleCopy, {
      dataTransfer: { files: [file] },
    });

    expect(screen.getByText("Solte o arquivo para anexar")).toBeInTheDocument();

    fireEvent.drop(screen.getByText("Solte o arquivo para anexar"), {
      dataTransfer: { files: [file] },
    });

    expect(onFilesChange).toHaveBeenCalledTimes(1);
    expect(onFilesChange.mock.calls[0]?.[0]?.[0]).toBe(file);
  });

  it("renders selected file details and exposes the remove action", () => {
    const onRemove = vi.fn();

    renderWithProviders(
      <FileUploadField
        id="imagem"
        actionLabel="Selecionar imagem"
        fileName="papel-timbrado.png"
        fileSizeLabel="344 KB"
        idleTitle="Arraste a imagem aqui ou selecione"
        label="Papel timbrado"
        onFilesChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText("papel-timbrado.png")).toBeInTheDocument();
    expect(screen.getByText("344 KB")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remover arquivo" }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
