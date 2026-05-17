import { describe, expect, it } from "vitest";
import {
  appendSupportReply,
  assignSupportTicketToAgent,
  DEFAULT_SUPPORT_AGENT,
  defaultSupportTicketFilters,
  filterSupportTickets,
  formatSupportChatTime,
  formatSupportDayLabel,
  formatSupportExactTimestamp,
  formatSupportQueueFreshness,
  getInitialSupportTicketId,
  getLatestTicketPreview,
  getSelectedSupportTicket,
  getSupportMessageTimeline,
  getSupportTicketStats,
  getTicketSlaState,
  SUPPORT_NOW,
  seededSupportTickets,
  updateSupportTicketPriority,
  updateSupportTicketStatus,
} from "./support-tickets";

describe("support ticket model", () => {
  it("calculates stats and SLA state from deterministic tickets", () => {
    expect(getSupportTicketStats(seededSupportTickets)).toEqual({
      open: 2,
      waiting: 1,
      resolved: 1,
      attention: 3,
    });

    expect(getTicketSlaState(seededSupportTickets[0])).toBe("breached");
    expect(getTicketSlaState(seededSupportTickets[1])).toBe("breached");
    expect(getTicketSlaState(seededSupportTickets[3])).toBe("done");
  });

  it("formats queue freshness and exact chat timestamps deterministically", () => {
    expect(formatSupportQueueFreshness(SUPPORT_NOW, SUPPORT_NOW)).toMatchObject({
      label: "agora",
      title: "16/05/2026 às 12:30",
    });
    expect(formatSupportQueueFreshness("2026-05-16T12:22:00-03:00", SUPPORT_NOW).label).toBe(
      "há 8 min",
    );
    expect(formatSupportQueueFreshness("2026-05-16T10:30:00-03:00", SUPPORT_NOW).label).toBe(
      "há 2 h",
    );
    expect(formatSupportQueueFreshness("2026-05-15T16:22:00-03:00", SUPPORT_NOW).label).toBe(
      "ontem",
    );
    expect(formatSupportQueueFreshness("2026-05-10T09:00:00-03:00", SUPPORT_NOW).label).toBe(
      "10/05",
    );
    expect(formatSupportQueueFreshness(null, SUPPORT_NOW)).toEqual({
      label: "sem data",
      title: "Sem data registrada",
      ariaLabel: "Ultima atividade sem data registrada",
    });
    expect(formatSupportChatTime("2026-05-16T12:08:00-03:00")).toBe("12:08");
    expect(formatSupportChatTime("not-a-date")).toBe("sem hora");
    expect(formatSupportExactTimestamp("2026-05-16T12:08:00-03:00")).toBe(
      "16/05/2026 às 12:08",
    );
  });

  it("builds support message timeline day labels for conversations crossing days", () => {
    const timeline = getSupportMessageTimeline(
      [
        {
          id: "message-yesterday",
          role: "user",
          authorName: "Ana Martins",
          content: "Mensagem anterior.",
          timestamp: "2026-05-15T23:56:00-03:00",
        },
        {
          id: "message-today",
          role: "support",
          authorName: "Admin LicitaDoc",
          content: "Resposta de hoje.",
          timestamp: "2026-05-16T00:03:00-03:00",
        },
      ],
      SUPPORT_NOW,
    );

    expect(formatSupportDayLabel("2026-05-16T12:08:00-03:00", SUPPORT_NOW)).toBe("Hoje");
    expect(formatSupportDayLabel("2026-05-15T23:56:00-03:00", SUPPORT_NOW)).toBe("Ontem");
    expect(timeline.map((item) => (item.type === "day" ? item.label : item.timeLabel))).toEqual([
      "Ontem",
      "23:56",
      "Hoje",
      "00:03",
    ]);
  });

  it("filters tickets by status, assignee, source, priority, and search", () => {
    expect(
      filterSupportTickets(seededSupportTickets, {
        ...defaultSupportTicketFilters,
        status: "open",
      }),
    ).toHaveLength(2);
    expect(
      filterSupportTickets(seededSupportTickets, {
        ...defaultSupportTicketFilters,
        assignee: "unassigned",
      }).map((ticket) => ticket.protocol),
    ).toEqual(["LD-SUP-1918"]);
    expect(
      filterSupportTickets(seededSupportTickets, {
        ...defaultSupportTicketFilters,
        source: "document",
      }).map((ticket) => ticket.protocol),
    ).toEqual(["LD-SUP-1907"]);
    expect(
      filterSupportTickets(seededSupportTickets, {
        ...defaultSupportTicketFilters,
        priority: "urgent",
        search: "ana",
      }).map((ticket) => ticket.protocol),
    ).toEqual(["LD-SUP-1918"]);
  });

  it("selects a valid ticket or falls back to the first visible one", () => {
    expect(getInitialSupportTicketId(seededSupportTickets)).toBe("ticket-process-generation");
    expect(
      getSelectedSupportTicket(seededSupportTickets, "ticket-workspace-members")?.protocol,
    ).toBe("LD-SUP-1884");
    expect(getSelectedSupportTicket(seededSupportTickets, "missing")?.protocol).toBe("LD-SUP-1918");
  });

  it("updates assignee, priority, status, and support replies locally", () => {
    const assigned = assignSupportTicketToAgent(
      seededSupportTickets,
      "ticket-process-generation",
      DEFAULT_SUPPORT_AGENT,
    );
    expect(assigned[0].assignee?.name).toBe("Admin LicitaDoc");

    const priorityChanged = updateSupportTicketPriority(
      assigned,
      "ticket-process-generation",
      "low",
    );
    expect(priorityChanged[0].priority).toBe("low");

    const replied = appendSupportReply(
      priorityChanged,
      "ticket-process-generation",
      "Vou revisar a geração agora.",
      DEFAULT_SUPPORT_AGENT,
    );
    expect(replied[0].status).toBe("waiting");
    expect(replied[0].messages.at(-1)?.content).toBe("Vou revisar a geração agora.");
    expect(getLatestTicketPreview(replied[0])).toBe("Vou revisar a geração agora.");

    const unchanged = appendSupportReply(
      replied,
      "ticket-process-generation",
      "   ",
      DEFAULT_SUPPORT_AGENT,
    );
    expect(unchanged[0].messages).toHaveLength(replied[0].messages.length);

    const resolved = updateSupportTicketStatus(replied, "ticket-process-generation", "resolved");
    expect(resolved[0].status).toBe("resolved");
    expect(resolved[0].unreadCount).toBe(0);

    const reopened = updateSupportTicketStatus(resolved, "ticket-process-generation", "open");
    expect(reopened[0].status).toBe("open");
  });
});
