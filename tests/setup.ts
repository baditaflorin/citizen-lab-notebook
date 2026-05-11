import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest doesn't clean up React Testing Library's mounted trees between
// tests by default — without this, each test's render adds another copy
// of the component to the same jsdom, and queries like getByRole start
// returning duplicates from prior tests.
afterEach(() => {
  cleanup();
});
