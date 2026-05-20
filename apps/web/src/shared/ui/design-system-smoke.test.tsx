import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Input } from "./input";
import { Skeleton } from "./skeleton";

describe("design-system primitives", () => {
  it("renders representative shared UI primitives in the Vite test environment", () => {
    renderWithProviders(
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Design system</CardTitle>
            <CardDescription>Shared primitives are available.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Save</Button>
            <Badge>Ready</Badge>
            <Input aria-label="Process number" defaultValue="DFD-001" />
            <Skeleton data-testid="shared-skeleton" className="h-4 w-24" />
          </CardContent>
        </Card>
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog content renders.</DialogDescription>
          </DialogContent>
        </Dialog>
      </div>,
    );

    expect(screen.getByText("Design system")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByLabelText("Process number")).toHaveValue("DFD-001");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const skeleton = screen.getByTestId("shared-skeleton");

    expect(skeleton).toHaveClass("bg-muted");
    expect(skeleton).not.toHaveClass("bg-accent");
    expect(skeleton).not.toHaveClass("bg-primary");
  });
});
