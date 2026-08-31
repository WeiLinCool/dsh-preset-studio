/** CSS Modules typings: every *.module.css import yields a hashed class map. */
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
