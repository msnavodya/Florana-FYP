// Provide baseline test coverage for the legacy Florana web app.
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test("renders the login welcome screen", () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
});
