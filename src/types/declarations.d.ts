declare module 'react' {
  interface ReactNode {}
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
