import { describe, expect, it } from "vitest";
import {
  appendSupportReply,
  assignSupportTicketToAgent,
  DEFAULT_SUPPORT_AGENT,
  defaultSupportTicketFilters,
  filterSupportTickets,
  getInitialSupportTicketId,
  getLatestTicketPreview,
  getSelectedSupportTicket,
  getSupportTicketStats,
  getTicketSlaState,
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
