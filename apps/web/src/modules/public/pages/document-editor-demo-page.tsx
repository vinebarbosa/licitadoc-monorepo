import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowUp,
  Bold,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  Clock,
  Cloud,
  FileText,
  Heading,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Plus,
  Redo2,
  Sparkles,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  X,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { DocumentPaginationSurface } from "@/modules/documents/ui/document-pagination-surface";
import {
  applyAISelectionHighlight,
  clearAISelectionHighlight,
  getDocumentTiptapExtensions,
  handleEditorTab,
  type SelectionRange,
} from "@/modules/documents/ui/document-tiptap-extensions";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Separator } from "@/shared/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

function heading(level: number, text: string) {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

function paragraph(text: string) {
  return {
    type: "paragraph",
    content: [{ type: "text", text }],
  };
}

function pageBreak() {
  return { type: "horizontalRule" };
}

function bulletList(items: string[]) {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content: [paragraph(item)],
    })),
  };
}

const initialDocumentContent = {
  type: "doc",
  content: [
    heading(1, "DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA"),
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Processo: " },
        { type: "text", text: "PE-2024/0142" },
      ],
    },
    heading(2, "1. Objeto"),
    paragraph(
      "Contratação de empresa especializada para fornecimento de equipamentos de informática destinados à modernização da infraestrutura tecnológica das unidades administrativas municipais, incluindo monitores de alta resolução, estações de trabalho completas e equipamentos para videoconferência institucional.",
    ),
    paragraph(
      "O objeto compreende o fornecimento, a entrega, a garantia e o suporte inicial dos equipamentos, observadas as especificações mínimas definidas pela Administração e a necessidade de compatibilidade com os ambientes de trabalho existentes.",
    ),
    heading(2, "2. Justificativa"),
    paragraph(
      "A contratação se justifica pela necessidade de substituição de equipamentos obsoletos, cuja defasagem tecnológica compromete a produtividade dos servidores, a segurança operacional e a continuidade dos serviços prestados à população. Os equipamentos atuais, com mais de oito anos de uso, apresentam falhas frequentes e não suportam os sistemas modernos necessários para a prestação adequada dos serviços públicos.",
    ),
    paragraph(
      "A manutenção de parque tecnológico defasado aumenta o risco de indisponibilidade, eleva custos indiretos com manutenção corretiva e dificulta a adoção de rotinas digitais já incorporadas aos processos administrativos. A atualização proposta busca reduzir essas fragilidades e criar condições para melhor desempenho das unidades atendidas.",
    ),
    heading(2, "3. Itens previstos"),
    bulletList([
      "50 monitores LED de 27 polegadas, resolução mínima Full HD 1920x1080, conexões HDMI e DisplayPort.",
      "30 kits de estação de trabalho completa, incluindo desktop com processador mínimo Intel Core i5 12ª geração, 16GB RAM DDR4, SSD 512GB NVMe.",
      "25 webcams Full HD para videoconferência institucional, com microfone integrado e cancelamento de ruído.",
      "Cabos, adaptadores e acessórios necessários à instalação e ao uso regular dos equipamentos nas unidades administrativas.",
    ]),
    pageBreak(),
    heading(2, "4. Alinhamento estratégico"),
    paragraph(
      "A presente demanda está alinhada com o Plano de Modernização Administrativa 2024-2027, especificamente com a meta de atualização tecnológica das unidades municipais. A aquisição contribuirá diretamente para os indicadores de eficiência operacional estabelecidos no planejamento estratégico.",
    ),
    paragraph(
      "Também há aderência às diretrizes de transformação digital, racionalização de procedimentos internos e ampliação do atendimento remoto, especialmente em atividades que dependem de reuniões virtuais, tramitação eletrônica e acesso contínuo a sistemas administrativos.",
    ),
    heading(2, "5. Resultados esperados"),
    paragraph(
      "Espera-se com esta contratação a melhoria significativa da infraestrutura de trabalho, resultando em aumento da produtividade dos servidores, redução do tempo de resposta nos atendimentos ao cidadão e maior segurança no tratamento de dados institucionais.",
    ),
    paragraph(
      "A modernização também tende a reduzir interrupções causadas por falhas de hardware, melhorar a qualidade das videoconferências institucionais e ampliar a previsibilidade das atividades administrativas, com reflexo direto na continuidade dos serviços públicos.",
    ),
    heading(2, "6. Público beneficiado"),
    paragraph(
      "Serão beneficiadas as unidades administrativas vinculadas à Secretaria de Administração, especialmente setores responsáveis por protocolo, compras, gestão documental, atendimento interno e suporte às demais secretarias municipais. Indiretamente, a população atendida pelo Município será beneficiada pela melhoria da capacidade operacional dos serviços.",
    ),
    heading(2, "7. Requisitos mínimos"),
    paragraph(
      "Os equipamentos deverão observar requisitos de desempenho compatíveis com o uso administrativo contínuo, incluindo processamento adequado, memória suficiente para execução simultânea de sistemas corporativos, armazenamento em tecnologia SSD e conectividade apropriada aos periféricos necessários.",
    ),
    bulletList([
      "Garantia mínima compatível com a prática de mercado e com a criticidade do uso institucional.",
      "Compatibilidade com sistemas operacionais e aplicativos utilizados pela Administração.",
      "Disponibilidade de assistência técnica e suporte para tratamento de falhas no período de garantia.",
      "Entrega acompanhada de documentação técnica, notas fiscais e identificação dos itens fornecidos.",
    ]),
    pageBreak(),
    heading(2, "8. Condições de entrega"),
    paragraph(
      "A entrega deverá ocorrer em local indicado pela Administração, mediante agendamento prévio com a unidade responsável. Os itens deverão estar devidamente embalados, identificados e acompanhados da documentação necessária para conferência, registro patrimonial e recebimento provisório.",
    ),
    paragraph(
      "A Administração poderá rejeitar equipamentos que apresentem divergência em relação às especificações, avarias aparentes, ausência de documentação ou incompatibilidade com os requisitos mínimos definidos no processo. A substituição deverá ocorrer sem ônus adicional, nos termos previstos no instrumento contratual.",
    ),
    heading(2, "9. Fiscalização e recebimento"),
    paragraph(
      "A fiscalização será exercida por servidor ou equipe designada, responsável por acompanhar a entrega, verificar a conformidade dos itens e registrar eventuais inconsistências. O recebimento definitivo dependerá da conferência quantitativa e qualitativa, sem prejuízo das verificações posteriores durante o período de garantia.",
    ),
    paragraph(
      "Os registros de recebimento deverão indicar data, local, responsáveis pela conferência, eventuais ressalvas e providências adotadas. Quando houver necessidade de testes básicos de funcionamento, estes deverão ser realizados em prazo razoável, considerando a quantidade de equipamentos recebidos.",
    ),
    heading(2, "10. Estimativa de valor"),
    paragraph(
      "A estimativa de valor deverá ser consolidada em etapa própria, com base em pesquisa de preços compatível com as características do objeto, considerando contratações similares, propostas de fornecedores, bases públicas e demais parâmetros admitidos pela legislação aplicável.",
    ),
    paragraph(
      "A definição do valor estimado deve observar a composição dos itens, eventuais custos acessórios, garantia, suporte inicial, condições de entrega e demais elementos que possam influenciar a formação do preço. Não deverão ser adotados valores sem memória de cálculo ou sem referência adequada.",
    ),
    pageBreak(),
    heading(2, "11. Riscos identificados"),
    paragraph(
      "Foram identificados riscos relacionados ao atraso na entrega, fornecimento de equipamentos incompatíveis, indisponibilidade de suporte, divergência entre especificações e itens entregues, além de eventual necessidade de adequação interna para instalação e distribuição dos equipamentos.",
    ),
    bulletList([
      "Atraso na entrega: mitigar por meio de cronograma contratual claro e acompanhamento periódico.",
      "Incompatibilidade técnica: mitigar com especificações mínimas objetivas e conferência no recebimento.",
      "Falhas durante a garantia: mitigar com exigência de suporte e canais formais de atendimento.",
      "Distribuição interna inadequada: mitigar com planejamento prévio das unidades contempladas.",
    ]),
    heading(2, "12. Sustentabilidade e descarte"),
    paragraph(
      "A Administração deverá observar boas práticas de sustentabilidade na aquisição, utilização e eventual descarte de equipamentos substituídos. Sempre que aplicável, os bens antigos deverão ser avaliados para reaproveitamento, baixa patrimonial, doação ou destinação ambientalmente adequada.",
    ),
    paragraph(
      "A contratação poderá considerar requisitos de eficiência energética, redução de consumo e adequação a normas técnicas pertinentes, desde que tais exigências sejam proporcionais ao objeto e não comprometam indevidamente a competitividade.",
    ),
    heading(2, "13. Providências prévias"),
    paragraph(
      "Antes da contratação, recomenda-se confirmar a lista de unidades contempladas, a disponibilidade de infraestrutura elétrica e lógica, a necessidade de softwares complementares e o procedimento de registro patrimonial. Essas providências reduzem riscos de ociosidade ou atraso na utilização dos equipamentos.",
    ),
    heading(2, "14. Conclusão"),
    paragraph(
      "Diante do exposto, a demanda revela-se pertinente para a modernização administrativa e para a continuidade dos serviços públicos, desde que observadas as etapas de planejamento, pesquisa de preços, definição precisa das especificações e acompanhamento adequado da execução contratual.",
    ),
    paragraph(
      "A continuidade do processo deverá considerar a disponibilidade orçamentária, a escolha do instrumento adequado, a consolidação dos documentos técnicos subsequentes e a observância das regras aplicáveis às contratações públicas.",
    ),
    pageBreak(),
    heading(2, "15. Impacto nas rotinas administrativas"),
    paragraph(
      "A renovação dos equipamentos deverá impactar diretamente as rotinas de elaboração de documentos, análise de processos, atendimento interno, conferência de informações e comunicação entre setores. A melhoria da infraestrutura tecnológica reduz gargalos operacionais e favorece maior previsibilidade na execução das atividades diárias.",
    ),
    paragraph(
      "Com equipamentos mais adequados, espera-se menor tempo de inicialização de sistemas, maior estabilidade durante reuniões remotas, redução de interrupções provocadas por travamentos e maior capacidade de execução simultânea de ferramentas corporativas. Esses ganhos são especialmente relevantes em unidades com grande volume de processos administrativos.",
    ),
    heading(2, "16. Critérios de priorização das unidades"),
    paragraph(
      "A distribuição dos equipamentos deverá observar critérios objetivos, considerando a criticidade do serviço prestado, a idade média dos equipamentos atualmente em uso, a frequência de falhas reportadas e o volume de servidores alocados em cada unidade. A priorização deverá ser registrada para garantir transparência e rastreabilidade das decisões.",
    ),
    bulletList([
      "Unidades com atendimento direto ao cidadão e alta demanda operacional.",
      "Setores que dependem de tramitação eletrônica intensiva e prazos administrativos recorrentes.",
      "Ambientes com equipamentos em fim de vida útil ou sem suporte técnico adequado.",
      "Equipes que executam atividades de compras, contratos, gestão documental e protocolo.",
    ]),
    heading(2, "17. Integração com sistemas existentes"),
    paragraph(
      "Os equipamentos deverão permitir o uso regular dos sistemas institucionais já adotados pela Administração, incluindo plataformas de protocolo eletrônico, gestão de documentos, planejamento, compras públicas, almoxarifado, patrimônio e comunicação interna. A compatibilidade deverá ser considerada durante a definição das especificações técnicas.",
    ),
    paragraph(
      "Eventuais necessidades de configuração, instalação de aplicativos, atualização de drivers ou ajustes de rede deverão ser planejadas previamente, de modo a reduzir o intervalo entre o recebimento dos equipamentos e sua efetiva utilização pelas unidades contempladas.",
    ),
    pageBreak(),
    heading(2, "18. Governança e registro patrimonial"),
    paragraph(
      "Após o recebimento, os bens deverão ser registrados conforme as normas patrimoniais aplicáveis, com identificação individual, vinculação à unidade de destino, indicação de responsável e registro das informações necessárias para controle posterior. O procedimento de tombamento deverá ocorrer antes da distribuição definitiva, sempre que exigido pelas rotinas internas.",
    ),
    paragraph(
      "A governança da utilização dos equipamentos deve considerar controles de movimentação, transferência, manutenção e eventual substituição. Esses registros auxiliam a Administração na tomada de decisão sobre futuras aquisições, remanejamentos e descarte de bens que deixem de atender às necessidades institucionais.",
    ),
    heading(2, "19. Plano de implantação"),
    paragraph(
      "A implantação deverá ocorrer em etapas, começando pela conferência dos itens entregues, seguida da preparação dos equipamentos, instalação de softwares básicos, identificação patrimonial e distribuição às unidades priorizadas. O cronograma deverá considerar a disponibilidade das equipes técnicas e a necessidade de evitar interrupções relevantes nos serviços.",
    ),
    bulletList([
      "Conferência quantitativa e qualitativa dos equipamentos entregues.",
      "Configuração inicial, atualização e instalação dos aplicativos institucionais.",
      "Registro patrimonial e emissão dos termos internos necessários.",
      "Distribuição por unidade, com confirmação de recebimento pelos responsáveis.",
      "Acompanhamento inicial de funcionamento e consolidação de eventuais chamados técnicos.",
    ]),
    heading(2, "20. Indicadores de acompanhamento"),
    paragraph(
      "Para avaliar os resultados da contratação, poderão ser acompanhados indicadores como redução de chamados relacionados a falhas de hardware, tempo médio de atendimento interno, quantidade de equipamentos substituídos, disponibilidade dos postos de trabalho e satisfação das unidades beneficiadas.",
    ),
    paragraph(
      "A análise desses indicadores deverá ocorrer após período mínimo de utilização, permitindo comparar a situação anterior com os efeitos observados após a implantação. Os resultados poderão subsidiar novas decisões de planejamento tecnológico e aperfeiçoamento das futuras contratações da Administração.",
    ),
    pageBreak(),
    heading(2, "21. Encaminhamentos finais"),
    paragraph(
      "Encaminha-se a presente formalização para continuidade da instrução processual, com recomendação de elaboração dos estudos técnicos complementares, confirmação da disponibilidade orçamentária, consolidação da pesquisa de preços e definição do modelo de contratação mais adequado ao atendimento da necessidade pública identificada.",
    ),
    paragraph(
      "A unidade demandante deverá permanecer disponível para prestar esclarecimentos adicionais, validar especificações e acompanhar as etapas subsequentes do processo. A adequada articulação entre demandante, área técnica e setor de compras será essencial para reduzir riscos e assegurar coerência entre a necessidade apresentada e a solução contratada.",
    ),
  ],
};

const processContext = {
  number: "PE-2024/0142",
  organization: "Prefeitura Municipal de São Paulo",
  department: "Secretaria de Administração",
  responsible: "Maria Costa",
  modality: "Pregão Eletrônico",
  documentType: "DFD",
  documentName: "Documento de Formalização da Demanda",
  status: "Em edição",
};

type AIStatus = "idle" | "processing" | "suggestion" | "applying";
type SaveStatus = "saved" | "saving" | "unsaved";

type AISuggestion = {
  original: string;
  previewRange: SelectionRange;
  suggested: string;
  instruction: string;
};

const activeToolButtonClass = "bg-primary/10 text-primary hover:bg-primary/15";
const activeToolMenuItemClass = "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary";
const editorToolButtonClass =
  "text-muted-foreground hover:bg-primary/5 hover:text-foreground data-[state=open]:bg-primary/5";
const rulerNumbers = Array.from({ length: 17 }, (_, index) => index);

export type DocumentAgentEditorContext = typeof processContext;

type DocumentAgentEditorExperienceProps = {
  contentKey?: string;
  headerActions?: ReactNode;
  initialContent?: JSONContent;
  onContentChange?: (content: JSONContent) => void;
  onSaveShortcut?: () => void;
  processContext?: DocumentAgentEditorContext;
  saveStatus?: SaveStatus;
  workspaceTestId?: string;
};

function DocumentPageRuler() {
  return (
    <div className="public-document-demo-ruler" aria-hidden="true">
      <div className="public-document-demo-ruler-track">
        {rulerNumbers.map((number) => (
          <span
            className="public-document-demo-ruler-number"
            key={number}
            style={{ left: `${(number / (rulerNumbers.length - 1)) * 100}%` }}
          >
            {number}
          </span>
        ))}
        <span
          aria-hidden="true"
          className="public-document-demo-ruler-marker public-document-demo-ruler-marker-first-line"
        />
        <span
          aria-hidden="true"
          className="public-document-demo-ruler-marker public-document-demo-ruler-marker-paragraph"
        />
        <span
          aria-hidden="true"
          className="public-document-demo-ruler-marker public-document-demo-ruler-marker-tab"
        />
      </div>
    </div>
  );
}

function getImprovedText(selectedText: string, instruction: string) {
  const normalizedInstruction = instruction.toLocaleLowerCase("pt-BR");

  if (normalizedInstruction.includes("objetivo") || normalizedInstruction.includes("conciso")) {
    return selectedText
      .replace("especificamente com a meta de", "visando à")
      .replace("contribuirá diretamente para os", "fortalecerá os")
      .replace("estabelecidos no planejamento estratégico", "previstos no planejamento");
  }

  if (normalizedInstruction.includes("formal")) {
    return selectedText.replace("se justifica", "justifica-se").replace("Espera-se", "Objetiva-se");
  }

  if (normalizedInstruction.includes("detalh")) {
    return `${selectedText} Adicionalmente, a Administração deverá observar a compatibilidade entre as especificações técnicas, a disponibilidade orçamentária e as condições de execução definidas nos instrumentos subsequentes.`;
  }

  return selectedText.replace(
    "melhoria significativa da infraestrutura de trabalho",
    "melhoria mensurável das condições de trabalho",
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        <span className="hidden sm:inline">Salvando...</span>
      </span>
    );
  }

  if (status === "unsaved") {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Clock className="h-3.5 w-3.5 text-warning" />
        <span className="hidden sm:inline">Alterações locais</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
      <Cloud className="h-3.5 w-3.5 text-success" />
      <span className="hidden sm:inline">Salvo</span>
    </span>
  );
}

export function DocumentAgentEditorExperience({
  contentKey,
  headerActions,
  initialContent = initialDocumentContent,
  onContentChange,
  onSaveShortcut,
  processContext: context = processContext,
  saveStatus: controlledSaveStatus,
  workspaceTestId = "document-agent-editor",
}: DocumentAgentEditorExperienceProps) {
  const [localSaveStatus, setLocalSaveStatus] = useState<SaveStatus>("saved");
  const [aiStatus, setAIStatus] = useState<AIStatus>("idle");
  const [zoomPercent, setZoomPercent] = useState(100);
  const [selectedText, setSelectedText] = useState("");
  const [selectedRange, setSelectedRange] = useState<SelectionRange | null>(null);
  const [aiInstruction, setAIInstruction] = useState("");
  const [aiSuggestion, setAISuggestion] = useState<AISuggestion | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isAIPromptFocused, setIsAIPromptFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastContentKeyRef = useRef<string | undefined>(undefined);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayedSaveStatus = controlledSaveStatus ?? localSaveStatus;
  const isControlled = Boolean(onContentChange);

  const editor = useEditor({
    extensions: getDocumentTiptapExtensions({
      includeBubbleMenu: true,
      includeKeyboardShortcuts: true,
      includePlaceholder: true,
    }),
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": "Editor demo de documento",
        class: "document-editor-prosemirror public-document-demo-prosemirror",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onContentChange?.(currentEditor.getJSON());

      if (isControlled) {
        return;
      }

      setLocalSaveStatus("unsaved");

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        setLocalSaveStatus("saving");
        savingTimerRef.current = setTimeout(() => setLocalSaveStatus("saved"), 800);
      }, 1200);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const { from, to } = currentEditor.state.selection;
      const text = currentEditor.state.doc.textBetween(from, to, " ").trim();

      if (text.length > 3) {
        setSelectedText(text);
        setSelectedRange({ from, to });
        return;
      }

      setSelectedText("");
      setSelectedRange(null);

      if (aiStatus === "idle") {
        setShowAIPanel(false);
        setIsAIPromptFocused(false);
      }
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (lastContentKeyRef.current === contentKey) {
      return;
    }

    lastContentKeyRef.current = contentKey;
    editor.commands.setContent(initialContent, { emitUpdate: false });
    clearAISelectionHighlight(editor);
    setSelectedText("");
    setSelectedRange(null);
    setAIStatus("idle");
    setAISuggestion(null);
    setShowAIPanel(false);
    setAIInstruction("");
    setIsAIPromptFocused(false);
  }, [contentKey, editor, initialContent]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
      }
    };
  }, []);

  const discardSuggestion = useCallback(() => {
    if (editor) {
      clearAISelectionHighlight(editor);
    }

    setAIStatus("idle");
    setAISuggestion(null);
    setShowAIPanel(false);
    setAIInstruction("");
    setIsAIPromptFocused(false);
  }, [editor]);

  const openAIPanel = useCallback(() => {
    if (!selectedRange || !selectedText) {
      return;
    }

    setShowAIPanel(true);
    setAIStatus("idle");
    setAIInstruction("");
    setAISuggestion(null);
    window.setTimeout(() => {
      inputRef.current?.focus();
      setIsAIPromptFocused(true);
    }, 80);
  }, [selectedRange, selectedText]);

  const requestAIImprovement = useCallback(async () => {
    if (!editor || !selectedText || !selectedRange || !aiInstruction.trim()) {
      return;
    }

    const instruction = aiInstruction.trim();

    setAIStatus("processing");
    setShowAIPanel(true);

    clearAISelectionHighlight(editor);

    await new Promise((resolve) => window.setTimeout(resolve, 1200));

    const suggested = getImprovedText(selectedText, instruction);
    const previewContent = [
      {
        type: "text",
        text: selectedText,
        marks: [{ type: "strike" }, { type: "aiSuggestion", attrs: { kind: "deleted" } }],
      },
      { type: "text", text: " " },
      {
        type: "text",
        text: suggested,
        marks: [{ type: "aiSuggestion", attrs: { kind: "inserted" } }],
      },
    ];
    const previewRange = {
      from: selectedRange.from,
      to: selectedRange.from + selectedText.length + 1 + suggested.length,
    };

    editor.chain().focus().insertContentAt(selectedRange, previewContent).run();
    setAISuggestion({
      original: selectedText,
      previewRange,
      suggested,
      instruction,
    });
    setAIStatus("suggestion");
    setShowAIPanel(false);
    setIsAIPromptFocused(false);
  }, [aiInstruction, editor, selectedRange, selectedText]);

  useEffect(() => {
    if (!editor || !selectedRange || !selectedText || aiStatus !== "idle" || aiSuggestion) {
      return;
    }

    applyAISelectionHighlight(editor, selectedRange);
  }, [aiStatus, aiSuggestion, editor, selectedRange, selectedText]);

  const applySuggestion = useCallback(() => {
    if (!editor || !aiSuggestion) {
      return;
    }

    setAIStatus("applying");

    editor.chain().focus().insertContentAt(aiSuggestion.previewRange, aiSuggestion.suggested).run();

    window.setTimeout(() => {
      setAIStatus("idle");
      setAISuggestion(null);
      setShowAIPanel(false);
      setAIInstruction("");
      setSelectedText("");
      setSelectedRange(null);
      if (!isControlled) {
        setLocalSaveStatus("unsaved");
      }
    }, 400);
  }, [aiSuggestion, editor, isControlled]);

  const rejectSuggestion = useCallback(() => {
    if (!editor || !aiSuggestion) {
      return;
    }

    editor.chain().focus().insertContentAt(aiSuggestion.previewRange, aiSuggestion.original).run();
    setAIStatus("idle");
    setAISuggestion(null);
    setShowAIPanel(false);
    setAIInstruction("");
    setSelectedText("");
    setSelectedRange(null);
  }, [aiSuggestion, editor]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const eventTarget = event.target;
      const isEditorEventTarget =
        eventTarget instanceof HTMLElement && Boolean(editor?.view.dom.contains(eventTarget));
      const isTypingInField =
        eventTarget instanceof HTMLInputElement ||
        eventTarget instanceof HTMLTextAreaElement ||
        (eventTarget instanceof HTMLElement &&
          eventTarget.isContentEditable &&
          !isEditorEventTarget);

      const shouldHandleEditorTab =
        event.key === "Tab" &&
        Boolean(editor) &&
        !isTypingInField &&
        (isEditorEventTarget || selectedText);

      if (shouldHandleEditorTab) {
        event.preventDefault();
        event.stopPropagation();

        if (editor) {
          handleEditorTab(editor, event.shiftKey ? -1 : 1);
        }
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === "s" &&
        onSaveShortcut
      ) {
        event.preventDefault();
        onSaveShortcut();
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === "j" &&
        selectedText
      ) {
        event.preventDefault();
        openAIPanel();
        return;
      }

      if (event.key === "Escape") {
        if (aiSuggestion) {
          rejectSuggestion();
          return;
        }

        discardSuggestion();
        return;
      }

      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        showAIPanel &&
        aiStatus === "idle" &&
        aiInstruction.trim()
      ) {
        event.preventDefault();
        void requestAIImprovement();
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    aiInstruction,
    aiStatus,
    aiSuggestion,
    discardSuggestion,
    editor,
    openAIPanel,
    onSaveShortcut,
    rejectSuggestion,
    requestAIImprovement,
    selectedText,
    showAIPanel,
  ]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="public-document-demo-page min-h-screen bg-[#f6f7f9] text-foreground"
        data-testid={workspaceTestId}
      >
        <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex h-14 items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate font-semibold text-sm">
                      {context.documentType} - {context.number}
                    </h1>
                    <Badge
                      variant="outline"
                      className="border-pending/30 bg-pending/10 text-pending"
                    >
                      {context.status}
                    </Badge>
                  </div>
                  <p className="truncate text-muted-foreground text-xs">{context.documentName}</p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3 text-muted-foreground text-xs">
                <SaveIndicator status={displayedSaveStatus} />
                {headerActions}
              </div>
            </div>
          </div>
        </header>

        <div className="sticky top-14 z-30 border-b bg-white/85 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex h-10 items-center gap-1 overflow-x-auto">
              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Desfazer"
                      disabled={!editor?.can().undo()}
                      onClick={() => editor?.chain().focus().undo().run()}
                      className={editorToolButtonClass}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desfazer</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Refazer"
                      disabled={!editor?.can().redo()}
                      onClick={() => editor?.chain().focus().redo().run()}
                      className={editorToolButtonClass}
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refazer</TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />

              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Diminuir zoom"
                  disabled={zoomPercent <= 80}
                  onClick={() => setZoomPercent((value) => Math.max(80, value - 10))}
                  className={editorToolButtonClass}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center tabular-nums">{zoomPercent}%</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Aumentar zoom"
                  disabled={zoomPercent >= 130}
                  onClick={() => setZoomPercent((value) => Math.min(130, value + 10))}
                  className={editorToolButtonClass}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 gap-1 px-2",
                          editorToolButtonClass,
                          (editor?.isActive("heading", { level: 1 }) ||
                            editor?.isActive("heading", { level: 2 }) ||
                            editor?.isActive("heading", { level: 3 })) &&
                            activeToolButtonClass,
                        )}
                      >
                        <Heading className="h-4 w-4" />
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Estilo do bloco</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    className={cn(editor?.isActive("paragraph") && activeToolMenuItemClass)}
                    onClick={() => editor?.chain().focus().setParagraph().run()}
                  >
                    Parágrafo
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      editor?.isActive("heading", { level: 1 }) && activeToolMenuItemClass,
                    )}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  >
                    Título 1
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      editor?.isActive("heading", { level: 2 }) && activeToolMenuItemClass,
                    )}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    Título 2
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      editor?.isActive("heading", { level: 3 }) && activeToolMenuItemClass,
                    )}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  >
                    Título 3
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 gap-1 px-2",
                          editorToolButtonClass,
                          (editor?.isActive("bulletList") || editor?.isActive("orderedList")) &&
                            activeToolButtonClass,
                        )}
                      >
                        <List className="h-4 w-4" />
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Listas</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    className={cn(editor?.isActive("bulletList") && activeToolMenuItemClass)}
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  >
                    <List className="h-4 w-4" />
                    Lista com marcadores
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(editor?.isActive("orderedList") && activeToolMenuItemClass)}
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  >
                    <ListOrdered className="h-4 w-4" />
                    Lista numerada
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />

              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Negrito"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={cn(
                        editorToolButtonClass,
                        editor?.isActive("bold") && activeToolButtonClass,
                      )}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Negrito</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Itálico"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={cn(
                        editorToolButtonClass,
                        editor?.isActive("italic") && activeToolButtonClass,
                      )}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Itálico</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Tachado"
                      onClick={() => editor?.chain().focus().toggleStrike().run()}
                      className={cn(
                        editorToolButtonClass,
                        editor?.isActive("strike") && activeToolButtonClass,
                      )}
                    >
                      <Strikethrough className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Tachado</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Sublinhado"
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      className={cn(
                        editorToolButtonClass,
                        editor?.isActive("underline") && activeToolButtonClass,
                      )}
                    >
                      <UnderlineIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sublinhado</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Destacar texto"
                      onClick={() => editor?.chain().focus().toggleHighlight().run()}
                      className={cn(
                        editorToolButtonClass,
                        editor?.isActive("highlight") && activeToolButtonClass,
                      )}
                    >
                      <Highlighter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Destacar</TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />

              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Alinhar à esquerda"
                      onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                      className={cn(
                        editorToolButtonClass,
                        editor?.isActive({ textAlign: "left" }) && activeToolButtonClass,
                      )}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Alinhar à esquerda</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Centralizar"
                      onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                      className={cn(
                        editorToolButtonClass,
                        editor?.isActive({ textAlign: "center" }) && activeToolButtonClass,
                      )}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Centralizar</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Alinhar à direita"
                      onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                      className={cn(
                        editorToolButtonClass,
                        editor?.isActive({ textAlign: "right" }) && activeToolButtonClass,
                      )}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Alinhar à direita</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Justificar"
                      onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
                      className={cn(
                        editorToolButtonClass,
                        editor?.isActive({ textAlign: "justify" }) && activeToolButtonClass,
                      )}
                    >
                      <AlignJustify className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Justificar</TooltipContent>
                </Tooltip>
              </div>

              <div className="min-w-0 flex-1" />

              {aiStatus !== "idle" ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-2",
                    aiStatus === "processing" &&
                      "border-processing/30 bg-processing/10 text-processing",
                    aiStatus === "suggestion" && "border-success/30 bg-success/10 text-success",
                    aiStatus === "applying" && "border-primary/30 bg-primary/10 text-primary",
                  )}
                >
                  {aiStatus === "processing" ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {aiStatus === "processing"
                    ? "IA revisando"
                    : aiStatus === "suggestion"
                      ? "Sugestão pronta"
                      : "Aplicando"}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden">
          <div className="mx-auto max-w-6xl px-3 sm:px-6">
            <div
              className="mx-auto w-fit origin-top transition-transform"
              style={{ transform: `scale(${zoomPercent / 100})` }}
            >
              <DocumentPageRuler />
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 lg:py-7">
          <div className="relative">
            <div
              className="mx-auto w-fit origin-top transition-transform"
              style={{ transform: `scale(${zoomPercent / 100})` }}
            >
              <DocumentPaginationSurface
                className="public-document-demo-sheet document-pagination-surface mx-auto"
                editor={editor}
              >
                <EditorContent editor={editor} />
              </DocumentPaginationSurface>
            </div>
          </div>
        </main>

        {(showAIPanel || selectedText) && aiStatus === "idle" ? (
          <div className="fixed bottom-6 left-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl bg-white/95 px-3 shadow-[0_14px_38px_rgb(15_23_42_/_0.10)] backdrop-blur-xl transition-all duration-150",
                isAIPromptFocused
                  ? "h-20 items-start border border-primary pt-3 shadow-[0_18px_52px_rgb(15_23_42_/_0.12),0_0_0_3px_hsl(var(--primary)_/_0.10)]"
                  : selectedText
                    ? "h-12 border border-primary/45 shadow-[0_18px_56px_rgb(15_23_42_/_0.14),0_0_0_1px_hsl(var(--primary)_/_0.18),0_0_34px_hsl(var(--primary)_/_0.22)]"
                    : "h-12 border border-border/70",
              )}
            >
              <Sparkles
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground/70",
                  isAIPromptFocused && "mt-0.5",
                )}
              />
              <input
                ref={inputRef}
                type="text"
                value={aiInstruction}
                tabIndex={-1}
                onBlur={() => setIsAIPromptFocused(false)}
                onChange={(event) => setAIInstruction(event.target.value)}
                onFocus={() => setIsAIPromptFocused(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void requestAIImprovement();
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    discardSuggestion();
                  }
                }}
                placeholder="Diga à IA o que precisa mudar neste trecho..."
                className="min-w-0 flex-1 bg-transparent text-sm leading-5 outline-none placeholder:text-muted-foreground/55"
              />
              <Button
                type="button"
                size="icon-sm"
                disabled={!aiInstruction.trim()}
                onClick={() => void requestAIImprovement()}
                className={cn(
                  "rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-80",
                  isAIPromptFocused && "-mt-0.5",
                )}
                aria-label="Enviar instrução para IA"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {aiStatus === "processing" ? (
          <div className="fixed bottom-6 left-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2">
            <div className="flex h-12 items-center justify-between rounded-md border border-border/70 bg-white/95 px-5 shadow-[0_14px_38px_rgb(15_23_42_/_0.10)] backdrop-blur-xl">
              <div className="flex items-center gap-3 font-semibold text-primary text-sm">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary/45 [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary/20 [animation-delay:240ms]" />
                </span>
                IA revisando documento
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-slate-500"
                onClick={discardSuggestion}
                aria-label="Cancelar geração de IA"
              >
                <CircleStop className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {aiStatus === "suggestion" && aiSuggestion ? (
          <div className="fixed bottom-6 left-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2">
            <div className="flex h-12 items-center justify-between rounded-xl border border-border/70 bg-white/95 px-3 shadow-[0_14px_38px_rgb(15_23_42_/_0.10)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={rejectSuggestion}>
                  Rejeitar tudo
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={applySuggestion}>
                  Aceitar tudo
                </Button>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Sugestão anterior">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-10 text-center">
                  <span className="font-medium text-primary">1</span> / 1
                </span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Próxima sugestão">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={rejectSuggestion}>
                  <X className="h-4 w-4" />
                  Rejeitar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={applySuggestion}
                  className="rounded-lg px-4"
                >
                  <Check className="h-4 w-4" />
                  Aceitar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={rejectSuggestion}
                  aria-label="Fechar sugestão"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

export function DocumentEditorDemoPage() {
  return <DocumentAgentEditorExperience workspaceTestId="document-editor-demo" />;
}
