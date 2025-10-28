import { render, screen } from "@testing-library/react";
import React from "react";

describe("jest-dom matchers", () => {
  test("toBeInTheDocument matcher works", () => {
    render(React.createElement("div", null, "hello"));
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});

export {};
