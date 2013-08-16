preprocessors = {
  "**/*.coffee": "coffee"
};
files = [
	JASMINE,
	JASMINE_ADAPTER,
	'build/lib/*.js',
	'build/lib-bower/purl.js',
	'build/lib-bower/vtex-utils.js',
	'build/checkout-sdk.js',
	'spec/*.coffee'
];
browsers = [
	'PhantomJS'
];