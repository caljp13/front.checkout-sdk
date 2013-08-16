/*
 * jQuery.ajaxQueue - A queue for ajax requests
 *
 * (c) 2011 Corey Frang
 * Dual licensed under the MIT and GPL licenses.
 *
 * Requires jQuery 1.5+
 */
(function ($) {

// jQuery on an empty object, we are going to use this as our Queue
	var ajaxQueue = $({});

	$.ajaxQueue = function (ajaxOpts) {
		var jqXHR,
				dfd = $.Deferred(),
				promise = dfd.promise(),
				requestFunction = function (next) {
					if (window.vtex && window.vtex.logger && window.vtex.logger.verbose)
						vtex.logger.localdebug('Starting ajax call', ajaxOpts);
					jqXHR = $.ajax(ajaxOpts);
					jqXHR.done(dfd.resolve)
							.fail(dfd.reject)
							.then(next, next);
					if (window.vtex && window.vtex.logger && window.vtex.logger.verbose) {
						jqXHR.done(function () {
							vtex.logger.localdebug('Success on queued ajax call', ajaxOpts);
						});
						jqXHR.fail(function () {
							vtex.logger.localdebug('Fail on queued ajax call', ajaxOpts);
						});
					}
				};
		var abortFunction = function (statusText) {

			// proxy abort to the jqXHR if it is active
			if (jqXHR) {
				return jqXHR.abort(statusText);
			}

			// if there wasn't already a jqXHR we need to remove from queue
			var queue = ajaxQueue.queue(),
					index = $.inArray(requestFunction, queue);

			if (index > -1) {
				queue.splice(index, 1);
			}

			// and then reject the deferred
			dfd.rejectWith(ajaxOpts.context || ajaxOpts, [ promise, statusText, "" ]);
			return promise;
		};

		// queue our ajax request
		if (window.vtex && window.vtex.logger && window.vtex.logger.verbose)
			vtex.logger.localdebug('Queueing ajax call', ajaxOpts);
		ajaxQueue.queue(requestFunction);

		// add the abort method
		promise.abort = abortFunction;

		return promise;
	};

})(jQuery);