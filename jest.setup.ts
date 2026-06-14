import "@testing-library/jest-dom";

import { configure } from "@testing-library/dom";

configure({
  testIdAttribute: "data-slot",
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;
