describe 'CheckoutSDK', ->
	sdk = new window.vtex.checkout.SDK()

	it 'should have defined dependencies', ->
		expect(window.vtex.checkout.SDK).toBeDefined()
		expect(window.jQuery).toBeDefined()
		expect(window.jQuery.url).toBeDefined()
		expect(window.jQuery.url()).toBeDefined()
		expect(window.jQuery.url().attr('base')).toBeDefined()
#		expect(window.jQuery.url().segment(-2)).toBeDefined()
#		expect(window.jQuery.url().param('orderFormId')).toBeDefined()
		expect(window.jQuery.ajaxQueue).toBeDefined()
		expect(window.JSON).toBeDefined()

	it 'should create a new orderform', ->