module.exports = {
  // These browser definitions are generated when running `ng new --legacy-browsers`.
  REQUIRED_BROWSERS_LIST: [
    'last 1 Chrome version',
    'last 1 Firefox version',
    'last 2 Edge major versions',
    'last 2 Safari major versions',
    'last 2 iOS major versions',
    'Firefox ESR',
    'IE 11'
  ],

  // The es5 compile target is required to support IE 11.
  REQUIRED_COMPILER_TARGET: 'es5',

  // Output hashing needs to be set to "bundles" (and not "all") to
  // allow our custom assets hash utility to process assets in SCSS files.
  REQUIRED_OUTPUT_HASHING_VALUE: 'bundles'
};
