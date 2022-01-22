import { JSDOM } from 'jsdom';
import { JSX } from 'jsx-dom-cjs';

const WINDOW = global.window;
const DOCUMENT = global.document;
const NAVIGATOR = global.navigator;

const DOM = new JSDOM('<!doctype html><html><body></body></html>');

/**
 * Sets up the global vars required for creating DOM elements
 */
function setDomVars() {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  global.window = DOM.window as unknown as typeof global.window;
  global.document = DOM.window.document;
  global.navigator = DOM.window.navigator;
}

setDomVars();

/**
 * @param element A DOM element to snapshot
 * @returns The HTML string representation of the element
 */
export function serializeElement(element: JSX.Element | (() => JSX.Element)): string {
  setDomVars();

  return typeof element === 'function' ? element().outerHTML : element.outerHTML;
}

/**
 * @param element A DOM element to snapshot
 * @returns The HTML string representation of the element
 */
export function serializeElementSandbox(element: () => JSX.Element): string {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  global.window = DOM.window as unknown as typeof global.window;
  global.document = DOM.window.document;
  global.navigator = DOM.window.navigator;

  const snapshot: string = element().outerHTML;

  global.window = WINDOW;
  global.document = DOCUMENT;
  global.navigator = NAVIGATOR;

  return snapshot;
}
