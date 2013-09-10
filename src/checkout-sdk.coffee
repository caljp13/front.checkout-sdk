window.vtex or= {}
window.vtex.checkout or= {}

# VTEX Checkout API v0.1.0
# Depends on vtex.utils.coffee, jquery.url.js, jquery.ajaxQueue.js.
#
# Offers convenient methods for using the API in js.
# For more information head to: docs.vtex.com.br/js/CheckoutAPI
class CheckoutAPI
	constructor: ->
		@CHECKOUT_ID = 'checkout'
		@HOST_URL = $.url().attr('base')
		@HOST_ORDER_FORM_URL = @HOST_URL + '/api/checkout/pub/orderForm/'
		@HOST_CART_URL = @HOST_URL + '/' + $.url().segment(-2) + '/cart/'
		@COOKIE_NAME = 'checkout.vtex.com'
		@COOKIE_ORDER_FORM_ID_KEY = '__ofid'
		@POSTALCODE_URL = @HOST_URL + '/api/checkout/pub/postal-code/'
		@GATEWAY_CALLBACK_URL = @HOST_URL + '/checkout/gatewayCallback/{0}/{1}/{2}'
		@requestingItem = undefined
		@stateRequestHashToResponseMap = {}
		@subjectToJqXHRMap = {}

	expectedFormSections: ->
		['items', 'gifts', 'totalizers', 'clientProfileData', 'shippingData', 'paymentData', 'sellers', 'messages', 'marketingData', 'clientPreferencesData', 'storePreferencesData']

	getOrderForm: (expectedFormSections = @expectedFormSections()) =>
		checkoutRequest = { expectedOrderFormSections: expectedFormSections }
		$.ajaxQueue
			url: @_getOrderFormURL()
			type: 'POST'
			contentType: 'application/json; charset=utf-8'
			dataType: 'json'
			data: JSON.stringify(checkoutRequest)

	# Sends an orderForm attachment to the current OrderForm.
	# @param attachmentId
	# @param serializedAttachment stringified serializedAttachment
	# @param expectedOrderFormSections
	sendAttachment: (attachmentId, serializedAttachment, expectedOrderFormSections = @expectedFormSections(), options = {}) =>
		orderAttachmentRequest =
			expectedOrderFormSections: expectedOrderFormSections

		if attachmentId is undefined or serializedAttachment is undefined
			vtex.logger.error("SendAttachment with undefined properties! attachmentId: #{attachmentId}; serializedAttachment: #{serializedAttachment}")
			d = $.Deferred()
			d.reject("Invalid arguments")
			return d.promise()

		## TODO alterar chamadas para não mandar stringified
		_.extend(orderAttachmentRequest, JSON.parse(serializedAttachment))

		if options.cache and options.currentStateHash
			requestHash = _.hash(attachmentId + JSON.stringify(orderAttachmentRequest))
			stateRequestHash = options.currentStateHash.toString() + ':' +  requestHash.toString()

			if @stateRequestHashToResponseMap[stateRequestHash]
				vtex.logger.localdebug ['CACHE HIT:', attachmentId, stateRequestHash, @stateRequestHashToResponseMap[stateRequestHash]].join(' ')
				deferred = $.Deferred()
				deferred.resolve(@stateRequestHashToResponseMap[stateRequestHash])
				return deferred.promise()
			else
				vtex.logger.localdebug ['CACHE MISS:', attachmentId, stateRequestHash].join(' ')

		xhr = $.ajaxQueue
			url: @_getSaveAttachmentURL(attachmentId)
			type: 'POST'
			contentType: 'application/json; charset=utf-8'
			dataType: 'json'
			data: JSON.stringify(orderAttachmentRequest)

		if options.abort and options.subject
			@subjectToJqXHRMap[options.subject]?.abort()
			@subjectToJqXHRMap[options.subject] = xhr

		if options.cache and options.currentStateHash
			xhr.done (data) => @stateRequestHashToResponseMap[stateRequestHash] = data

		return xhr

	sendLocale: (locale='pt-BR') =>
		attachmentId = 'clientPreferencesData';
		serializedAttachment = JSON.stringify(locale: locale)
		@sendAttachment(attachmentId, serializedAttachment, [])

	addOfferingWithInfo: (offeringId, offeringInfo, itemIndex, expectedOrderFormSections) =>
		updateItemsRequest =
			id: offeringId
			info: offeringInfo
			expectedOrderFormSections: expectedOrderFormSections ? @expectedFormSections()

		$.ajaxQueue
			url: @_getAddOfferingsURL(itemIndex)
			type: 'POST'
			contentType: 'application/json; charset=utf-8'
			dataType: 'json'
			data: JSON.stringify(updateItemsRequest)

	addOffering: (offeringId, itemIndex, expectedOrderFormSections) =>
		@addOfferingWithInfo(offeringId, null, itemIndex, expectedOrderFormSections)

	removeOffering: (offeringId, itemIndex, expectedOrderFormSections) =>
		updateItemsRequest =
			Id: offeringId
			expectedOrderFormSections: expectedOrderFormSections ? @expectedFormSections()

		$.ajaxQueue
			url: @_getRemoveOfferingsURL(itemIndex, offeringId)
			type: 'POST'
			contentType: 'application/json; charset=utf-8'
			dataType: 'json'
			data: JSON.stringify(updateItemsRequest)

	updateItems: (itemsJS, expectedOrderFormSections = @expectedFormSections()) =>
		updateItemsRequest =
			orderItems: itemsJS
			expectedOrderFormSections: expectedOrderFormSections

		if @requestingItem isnt undefined
			@requestingItem.abort()
			console.log 'Abortando', @requestingItem

		return @requestingItem = $.ajaxQueue(
			url: @_getUpdateItemURL()
			type: 'POST'
			contentType: 'application/json; charset=utf-8'
			dataType: 'json'
			data: JSON.stringify(updateItemsRequest)
		).done =>
			@requestingItem = undefined

	removeItems: (items) =>
		deferred = $.Deferred()
		promiseForItems = if items then $.when(items) else @getOrderForm(['items']).then (orderForm) -> orderForm.items
		promiseForItems.then (array) =>
			@updateItems(_(array).map((item, i) => {index: item.index, quantity: 0}).reverse())
				.done((data) -> deferred.resolve(data)).fail(deferred.reject)
		deferred.promise()

	addDiscountCoupon: (couponCode, expectedOrderFormSections) =>
		couponCodeRequest =
			text: couponCode
			expectedOrderFormSections: expectedOrderFormSections ? @expectedFormSections()

		$.ajaxQueue
			url: @_getAddCouponURL()
			type: 'POST'
			contentType: 'application/json; charset=utf-8'
			dataType: 'json'
			data: JSON.stringify couponCodeRequest

	removeDiscountCoupon: (expectedOrderFormSections) =>
		return @addDiscountCoupon('', expectedOrderFormSections)

	calculateShipping: (address) =>
		shippingRequest = address: address
		return @sendAttachment('shippingData', JSON.stringify(shippingRequest))

	# Aceita um address com propriedades postalCode e country
	getAddressInformation: (address) =>
		$.ajax
			url: @_getPostalCodeURL(address.postalCode, address.country)
			type: 'GET'
			timeout : 20000

	# Aceita um address com propriedades postalCode e country
	getProfileByEmail: (email, salesChannel) =>
		$.ajax
			url: @_getProfileURL()
			type: 'GET'
			data: {email: email, sc: salesChannel}

	startTransaction: (value, referenceValue, interestValue, savePersonalData = false, optinNewsLetter = false, expectedOrderFormSections = @expectedFormSections()) =>
		transactionRequest = {
			referenceId: @_getOrderFormId()
			savePersonalData: savePersonalData
			optinNewsLetter: optinNewsLetter
			value: value
			referenceValue: referenceValue
			interestValue: interestValue
			expectedOrderFormSections : expectedOrderFormSections
		}
		# TODO 'falhar' a promise caso a propriedade 'receiverUri' esteja null
		$.ajaxQueue
			url: @_startTransactionURL(),
			type: 'POST',
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
			data: JSON.stringify(transactionRequest)

	getOrders: (orderGroupId) =>
		$.ajaxQueue
			url: @_getOrdersURL(orderGroupId)
			type: 'GET'
			contentType: 'application/json; charset=utf-8'
			dataType: 'json'

	clearMessages: () ->
		clearMessagesRequest = { expectedOrderFormSections: [] }
		$.ajaxQueue
			url: @_getOrderFormURL() + '/messages/clear'
			type: 'POST'
			contentType: 'application/json; charset=utf-8'
			dataType: 'json'
			data: JSON.stringify clearMessagesRequest

	removeAccountId: (accountId) ->
		removeAccountIdRequest = { expectedOrderFormSections: [] }
		$.ajaxQueue
			url: @_getOrderFormURL() + '/paymentAccount/' + accountId + '/remove'
			type: 'POST'
			contentType: 'application/json; charset=utf-8'
			dataType: 'json'
			data: JSON.stringify removeAccountIdRequest

	getChangeToAnonymousUserURL: () ->
		@HOST_URL + '/checkout/changeToAnonymousUser/' + @_getOrderFormId()

	#
	# PRIVATE
	#

	_getOrderFormId: =>
		@_getOrderFormIdFromCookie() or @_getOrderFormIdFromURL() or ''

	_getOrderFormIdFromCookie: =>
		cookie = _.readCookie(@COOKIE_NAME)
		unless cookie is undefined or cookie is ''
			return _.getCookieValue(cookie, @COOKIE_ORDER_FORM_ID_KEY)
		return undefined

	_getOrderFormIdFromURL: =>
		$.url().param('orderFormId')

	_getOrderFormURL: =>
		@HOST_ORDER_FORM_URL + @_getOrderFormId()

	_getSaveAttachmentURL: (attachmentId) =>
		@_getOrderFormURL() + '/attachments/' + attachmentId

	_getAddOfferingsURL: (itemIndex) =>
		@_getOrderFormURL() + '/items/' + itemIndex + '/offerings'

	_getRemoveOfferingsURL: (itemIndex, offeringId) =>
		@_getOrderFormURL() + '/items/' + itemIndex + '/offerings/' + offeringId + '/remove'

	_getAddCouponURL: =>
		@_getOrderFormURL() + '/coupons'

	_getOrdersURL: (orderGroupId) =>
		@HOST_URL + '/api/checkout/pub/orders/order-group/' + orderGroupId

	_startTransactionURL: =>
		@_getOrderFormURL() + '/transaction'

	_getUpdateItemURL: =>
		@_getOrderFormURL() + '/items/update/'

	_getPostalCodeURL: (postalCode = '', countryCode = 'BRA') =>
		@POSTALCODE_URL + countryCode + '/' + postalCode

	_getProfileURL: =>
		@HOST_URL + '/api/checkout/pub/profiles/'

# Compatibility with old clients - DEPRECATED!
window.vtex.checkout.API = CheckoutAPI
window.vtex.checkout.API.version = 'VERSION'

window.vtex.checkout.SDK = CheckoutAPI
window.vtex.checkout.SDK.version = 'VERSION'