import '@testing-library/jest-dom';

// jsdom doesn't implement elementFromPoint — provide a minimal stub
if (!document.elementFromPoint) {
  document.elementFromPoint = () => null;
}
