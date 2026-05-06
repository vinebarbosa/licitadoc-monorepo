import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Input } from "./input";

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
  });
});
