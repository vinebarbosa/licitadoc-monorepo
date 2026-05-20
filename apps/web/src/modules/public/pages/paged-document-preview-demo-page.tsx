import { resolveApiUrl } from "@licitadoc/api-client";
import { DocumentPreview, PaperLayout } from "@/modules/documents/ui/paged-preview";

const purezaLetterheadUrl = resolveApiUrl(
  "/api/organizations/b3f73224-242a-481e-9945-c04b051c83cc/letterhead/image",
);

const sections = [
  {
    title: "1. Dados da solicitacao",
    paragraphs: [
      "Unidade requisitante: Secretaria Municipal de Educacao, Cultura, Esporte e Lazer.",
      "Objeto: contratacao de empresa para fornecimento de materiais destinados a acao institucional com distribuicao gratuita no municipio.",
      "A presente pagina serve como laboratorio isolado para validar paginacao A4, cabecalho, rodape, tabelas, listas, assinatura e exportacao em PDF pelo navegador.",
    ],
  },
  {
    title: "2. Contexto e necessidade",
    paragraphs: [
      "A demanda decorre da necessidade de organizar acao administrativa pontual, com finalidade publica definida e execucao concentrada em periodo especifico. O documento deve preservar leitura institucional natural, com distribuicao regular de conteudo entre paginas.",
      "O preview paginado deve demonstrar comportamento semelhante ao de editores de texto profissionais, exibindo folhas independentes, sem depender da margem do navegador para posicionar o conteudo do documento.",
      "Tambem e necessario avaliar se o cabecalho e o rodape permanecem estaveis quando o corpo do documento avanca para novas paginas.",
    ],
  },
  {
    title: "3. Requisitos essenciais",
    paragraphs: [
      "Os materiais deverao observar especificacoes suficientes para permitir cotacao, recebimento e conferencia pela Administracao.",
      "A execucao devera ser acompanhada por fiscal designado, com registro da entrega e validacao de compatibilidade entre os itens fornecidos e a necessidade administrativa registrada.",
    ],
  },
  {
    title: "4. Gestao e fiscalizacao",
    paragraphs: [
      "A fiscalizacao acompanhara a entrega, verificara quantidades, avaliara conformidade minima e registrara eventuais divergencias. A gestao contratual adotara providencias administrativas em caso de atraso, entrega parcial ou desconformidade.",
      "O recebimento devera observar procedimento simples, mas suficiente para resguardar a regularidade da contratacao e a adequada aplicacao dos recursos publicos.",
    ],
  },
  {
    title: "5. Condicoes de pagamento",
    paragraphs: [
      "O pagamento ocorrera apos o recebimento definitivo, mediante apresentacao da documentacao fiscal pertinente e atesto da unidade responsavel.",
      "Nao havera pagamento por item nao entregue ou entregue em desconformidade com as especificacoes aceitas pela Administracao.",
    ],
  },
  {
    title: "6. Encaminhamento",
    paragraphs: [
      "Diante do exposto, a demanda apresenta pertinencia administrativa e pode seguir para as etapas subsequentes de instrucao, pesquisa de precos, definicao de fornecedor e formalizacao do instrumento adequado.",
      "Este conteudo propositalmente se alonga para forcar multiplas paginas e permitir a avaliacao visual do comportamento de paginacao.",
    ],
  },
];

const tableRows = [
  ["Potes plasticos reutilizaveis", "Unidade", "500", "Distribuicao em acao institucional"],
  ["Kits com duas unidades", "Kit", "300", "Acondicionamento e entrega individual"],
  ["Kits com tres unidades", "Kit", "200", "Acondicionamento e entrega individual"],
  ["Embalagens para presente", "Unidade", "500", "Finalizacao dos kits"],
  ["Fita adesiva transparente", "Unidade", "20", "Fechamento das embalagens"],
  ["Etiquetas de identificacao", "Unidade", "500", "Controle e organizacao da entrega"],
  ["Sacos transparentes", "Pacote", "30", "Protecao dos itens"],
  ["Caixas de transporte", "Unidade", "50", "Organizacao logistica"],
];

const extraSections = Array.from({ length: 8 }, (_, index) => ({
  id: `long-section-${index + 1}`,
  number: 9 + index,
  title: `Secao longa de teste ${index + 1}`,
}));

function DemoDocumentBody() {
  return (
    <>
      <h1>Documento de teste para preview paginado</h1>
      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}

      <h2>7. Quadro demonstrativo de itens</h2>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Unidade</th>
            <th>Quantidade</th>
            <th>Finalidade</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map(([item, unit, quantity, purpose]) => (
            <tr key={item}>
              <td>{item}</td>
              <td>{unit}</td>
              <td>{quantity}</td>
              <td>{purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>8. Pontos para validacao do laboratorio</h2>
      <ul>
        <li>Timbre oficial aplicado como fundo A4 inteiro em todas as paginas.</li>
        <li>Area util do texto controlada pelo Paged.js, sem depender das margens do navegador.</li>
        <li>Quebra automatica sem recortar tabela, lista ou assinatura de forma grosseira.</li>
        <li>Botao Exportar PDF usando o dialogo de impressao do navegador.</li>
        <li>Preview de tela com paginas separadas, sombra e largura A4.</li>
      </ul>

      {extraSections.map((section) => (
        <section key={section.id}>
          <h2>
            {section.number}. {section.title}
          </h2>
          <p>
            Esta secao adicional existe para aumentar o corpo do documento e simular documentos
            longos, como estudos tecnicos preliminares, termos de referencia, contratos e oficios. O
            comportamento esperado e que o Paged.js distribua o conteudo em novas paginas sem exigir
            que o usuario insira quebras manuais.
          </p>
          <p>
            A leitura deve permanecer estavel, com margens institucionais e area util adequada. Ao
            exportar para PDF, o navegador deve imprimir apenas o documento paginado, ocultando a
            barra de acoes e qualquer elemento de interface que nao faca parte do documento.
          </p>
        </section>
      ))}

      <div className="paged-signature-block">
        <p>Pureza/RN, 18 de maio de 2026.</p>
        <div className="paged-signature-line" />
        <strong>MARIA MARILDA SILVA DA ROCHA</strong>
        <br />
        Secretaria Municipal de Educacao, Cultura, Esporte e Lazer
      </div>
    </>
  );
}

export function PagedDocumentPreviewDemoPage() {
  return (
    <DocumentPreview
      letterheadUrl={purezaLetterheadUrl}
      renderKey="pureza-paged-preview-demo-v1"
      title="Preview paginado + exportacao PDF"
    >
      <PaperLayout>
        <DemoDocumentBody />
      </PaperLayout>
    </DocumentPreview>
  );
}
