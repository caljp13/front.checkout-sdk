(function() {
  var CheckoutAPI, _base,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.vtex || (window.vtex = {});

  (_base = window.vtex).checkout || (_base.checkout = {});

  CheckoutAPI = (function() {
    function CheckoutAPI() {
      this._getProfileURL = __bind(this._getProfileURL, this);
      this._getPostalCodeURL = __bind(this._getPostalCodeURL, this);
      this._getUpdateItemURL = __bind(this._getUpdateItemURL, this);
      this._startTransactionURL = __bind(this._startTransactionURL, this);
      this._getOrdersURL = __bind(this._getOrdersURL, this);
      this._getAddCouponURL = __bind(this._getAddCouponURL, this);
      this._getRemoveOfferingsURL = __bind(this._getRemoveOfferingsURL, this);
      this._getAddOfferingsURL = __bind(this._getAddOfferingsURL, this);
      this._getSaveAttachmentURL = __bind(this._getSaveAttachmentURL, this);
      this._getOrderFormURL = __bind(this._getOrderFormURL, this);
      this._getOrderFormIdFromURL = __bind(this._getOrderFormIdFromURL, this);
      this._getOrderFormIdFromCookie = __bind(this._getOrderFormIdFromCookie, this);
      this._getOrderFormId = __bind(this._getOrderFormId, this);
      this.getOrders = __bind(this.getOrders, this);
      this.startTransaction = __bind(this.startTransaction, this);
      this.getProfileByEmail = __bind(this.getProfileByEmail, this);
      this.getAddressInformation = __bind(this.getAddressInformation, this);
      this.calculateShipping = __bind(this.calculateShipping, this);
      this.removeDiscountCoupon = __bind(this.removeDiscountCoupon, this);
      this.addDiscountCoupon = __bind(this.addDiscountCoupon, this);
      this.removeItems = __bind(this.removeItems, this);
      this.updateItems = __bind(this.updateItems, this);
      this.removeOffering = __bind(this.removeOffering, this);
      this.addOffering = __bind(this.addOffering, this);
      this.sendLocale = __bind(this.sendLocale, this);
      this.sendAttachment = __bind(this.sendAttachment, this);
      this.getOrderForm = __bind(this.getOrderForm, this);
      this.CHECKOUT_ID = 'checkout';
      this.HOST_URL = $.url().attr('base');
      this.HOST_ORDER_FORM_URL = this.HOST_URL + '/api/checkout/pub/orderForm/';
      this.HOST_CART_URL = this.HOST_URL + '/' + $.url().segment(-2) + '/cart/';
      this.COOKIE_NAME = 'checkout.vtex.com';
      this.COOKIE_ORDER_FORM_ID_KEY = '__ofid';
      this.POSTALCODE_URL = this.HOST_URL + '/api/checkout/pub/postal-code/';
      this.GATEWAY_CALLBACK_URL = this.HOST_URL + '/checkout/gatewayCallback/{0}/{1}/{2}';
      this.requestingItem = void 0;
      this.stateRequestHashToResponseMap = {};
      this.subjectToJqXHRMap = {};
    }

    CheckoutAPI.prototype.expectedFormSections = function() {
      return ['items', 'gifts', 'totalizers', 'clientProfileData', 'shippingData', 'paymentData', 'sellers', 'messages', 'marketingData', 'clientPreferencesData', 'storePreferencesData'];
    };

    CheckoutAPI.prototype.getOrderForm = function(expectedFormSections) {
      var checkoutRequest;
      if (expectedFormSections == null) {
        expectedFormSections = this.expectedFormSections();
      }
      checkoutRequest = {
        expectedOrderFormSections: expectedFormSections
      };
      return $.ajaxQueue({
        url: this._getOrderFormURL(),
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(checkoutRequest)
      });
    };

    CheckoutAPI.prototype.sendAttachment = function(attachmentId, serializedAttachment, expectedOrderFormSections, options) {
      var d, deferred, orderAttachmentRequest, requestHash, stateRequestHash, xhr, _ref,
        _this = this;
      if (expectedOrderFormSections == null) {
        expectedOrderFormSections = this.expectedFormSections();
      }
      if (options == null) {
        options = {};
      }
      orderAttachmentRequest = {
        expectedOrderFormSections: expectedOrderFormSections
      };
      if (attachmentId === void 0 || serializedAttachment === void 0) {
        vtex.logger.error("SendAttachment with undefined properties! attachmentId: " + attachmentId + "; serializedAttachment: " + serializedAttachment);
        d = $.Deferred();
        d.reject("Invalid arguments");
        return d.promise();
      }
      _.extend(orderAttachmentRequest, JSON.parse(serializedAttachment));
      if (options.cache && options.currentStateHash) {
        requestHash = _.hash(attachmentId + JSON.stringify(orderAttachmentRequest));
        stateRequestHash = options.currentStateHash.toString() + ':' + requestHash.toString();
        if (this.stateRequestHashToResponseMap[stateRequestHash]) {
          vtex.logger.localdebug(['CACHE HIT:', attachmentId, stateRequestHash, this.stateRequestHashToResponseMap[stateRequestHash]].join(' '));
          deferred = $.Deferred();
          deferred.resolve(this.stateRequestHashToResponseMap[stateRequestHash]);
          return deferred.promise();
        } else {
          vtex.logger.localdebug(['CACHE MISS:', attachmentId, stateRequestHash].join(' '));
        }
      }
      xhr = $.ajaxQueue({
        url: this._getSaveAttachmentURL(attachmentId),
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(orderAttachmentRequest)
      });
      if (options.abort && options.subject) {
        if ((_ref = this.subjectToJqXHRMap[options.subject]) != null) {
          _ref.abort();
        }
        this.subjectToJqXHRMap[options.subject] = xhr;
      }
      if (options.cache && options.currentStateHash) {
        xhr.done(function(data) {
          return _this.stateRequestHashToResponseMap[stateRequestHash] = data;
        });
      }
      return xhr;
    };

    CheckoutAPI.prototype.sendLocale = function(locale) {
      var attachmentId, serializedAttachment;
      if (locale == null) {
        locale = 'pt-BR';
      }
      attachmentId = 'clientPreferencesData';
      serializedAttachment = JSON.stringify({
        locale: locale
      });
      return this.sendAttachment(attachmentId, serializedAttachment, []);
    };

    CheckoutAPI.prototype.addOffering = function(offeringId, itemIndex, expectedOrderFormSections) {
      var updateItemsRequest;
      updateItemsRequest = {
        Id: offeringId,
        expectedOrderFormSections: expectedOrderFormSections != null ? expectedOrderFormSections : this.expectedFormSections()
      };
      return $.ajaxQueue({
        url: this._getAddOfferingsURL(itemIndex),
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(updateItemsRequest)
      });
    };

    CheckoutAPI.prototype.removeOffering = function(offeringId, itemIndex, expectedOrderFormSections) {
      var updateItemsRequest;
      updateItemsRequest = {
        Id: offeringId,
        expectedOrderFormSections: expectedOrderFormSections != null ? expectedOrderFormSections : this.expectedFormSections()
      };
      return $.ajaxQueue({
        url: this._getRemoveOfferingsURL(itemIndex, offeringId),
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(updateItemsRequest)
      });
    };

    CheckoutAPI.prototype.updateItems = function(itemsJS, expectedOrderFormSections) {
      var updateItemsRequest,
        _this = this;
      if (expectedOrderFormSections == null) {
        expectedOrderFormSections = this.expectedFormSections();
      }
      updateItemsRequest = {
        orderItems: itemsJS,
        expectedOrderFormSections: expectedOrderFormSections
      };
      if (this.requestingItem !== void 0) {
        this.requestingItem.abort();
        console.log('Abortando', this.requestingItem);
      }
      return this.requestingItem = $.ajaxQueue({
        url: this._getUpdateItemURL(),
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(updateItemsRequest)
      }).done(function() {
        return _this.requestingItem = void 0;
      });
    };

    CheckoutAPI.prototype.removeItems = function(items) {
      var deferred, promiseForItems,
        _this = this;
      deferred = $.Deferred();
      promiseForItems = items ? $.when(items) : this.getOrderForm(['items']).then(function(orderForm) {
        return orderForm.items;
      });
      promiseForItems.then(function(array) {
        return _this.updateItems(_(array).map(function(item, i) {
          return {
            index: item.index,
            quantity: 0
          };
        }).reverse()).done(function(data) {
          return deferred.resolve(data);
        }).fail(deferred.reject);
      });
      return deferred.promise();
    };

    CheckoutAPI.prototype.addDiscountCoupon = function(couponCode, expectedOrderFormSections) {
      var couponCodeRequest;
      couponCodeRequest = {
        text: couponCode,
        expectedOrderFormSections: expectedOrderFormSections != null ? expectedOrderFormSections : this.expectedFormSections()
      };
      return $.ajaxQueue({
        url: this._getAddCouponURL(),
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(couponCodeRequest)
      });
    };

    CheckoutAPI.prototype.removeDiscountCoupon = function(expectedOrderFormSections) {
      return this.addDiscountCoupon('', expectedOrderFormSections);
    };

    CheckoutAPI.prototype.calculateShipping = function(address) {
      var shippingRequest;
      shippingRequest = {
        address: address
      };
      return this.sendAttachment('shippingData', JSON.stringify(shippingRequest));
    };

    CheckoutAPI.prototype.getAddressInformation = function(address) {
      return $.ajax({
        url: this._getPostalCodeURL(address.postalCode, address.country),
        type: 'GET',
        timeout: 20000
      });
    };

    CheckoutAPI.prototype.getProfileByEmail = function(email, salesChannel) {
      return $.ajax({
        url: this._getProfileURL(),
        type: 'GET',
        data: {
          email: email,
          sc: salesChannel
        }
      });
    };

    CheckoutAPI.prototype.startTransaction = function(value, referenceValue, interestValue, savePersonalData, optinNewsLetter, expectedOrderFormSections) {
      var transactionRequest;
      if (savePersonalData == null) {
        savePersonalData = false;
      }
      if (optinNewsLetter == null) {
        optinNewsLetter = false;
      }
      if (expectedOrderFormSections == null) {
        expectedOrderFormSections = this.expectedFormSections();
      }
      transactionRequest = {
        referenceId: this._getOrderFormId(),
        savePersonalData: savePersonalData,
        optinNewsLetter: optinNewsLetter,
        value: value,
        referenceValue: referenceValue,
        interestValue: interestValue,
        expectedOrderFormSections: expectedOrderFormSections
      };
      return $.ajaxQueue({
        url: this._startTransactionURL(),
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(transactionRequest)
      });
    };

    CheckoutAPI.prototype.getOrders = function(orderGroupId) {
      return $.ajaxQueue({
        url: this._getOrdersURL(orderGroupId),
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json'
      });
    };

    CheckoutAPI.prototype.clearMessages = function() {
      var clearMessagesRequest;
      clearMessagesRequest = {
        expectedOrderFormSections: []
      };
      return $.ajaxQueue({
        url: this._getOrderFormURL() + '/messages/clear',
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(clearMessagesRequest)
      });
    };

    CheckoutAPI.prototype.removeAccountId = function(accountId) {
      var removeAccountIdRequest;
      removeAccountIdRequest = {
        expectedOrderFormSections: []
      };
      return $.ajaxQueue({
        url: this._getOrderFormURL() + '/paymentAccount/' + accountId + '/remove',
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(removeAccountIdRequest)
      });
    };

    CheckoutAPI.prototype.getChangeToAnonymousUserURL = function() {
      return this.HOST_URL + '/checkout/changeToAnonymousUser/' + this._getOrderFormId();
    };

    CheckoutAPI.prototype._getOrderFormId = function() {
      return this._getOrderFormIdFromCookie() || this._getOrderFormIdFromURL() || '';
    };

    CheckoutAPI.prototype._getOrderFormIdFromCookie = function() {
      var cookie;
      cookie = _.readCookie(this.COOKIE_NAME);
      if (!(cookie === void 0 || cookie === '')) {
        return _.getCookieValue(cookie, this.COOKIE_ORDER_FORM_ID_KEY);
      }
      return void 0;
    };

    CheckoutAPI.prototype._getOrderFormIdFromURL = function() {
      return $.url().param('orderFormId');
    };

    CheckoutAPI.prototype._getOrderFormURL = function() {
      return this.HOST_ORDER_FORM_URL + this._getOrderFormId();
    };

    CheckoutAPI.prototype._getSaveAttachmentURL = function(attachmentId) {
      return this._getOrderFormURL() + '/attachments/' + attachmentId;
    };

    CheckoutAPI.prototype._getAddOfferingsURL = function(itemIndex) {
      return this._getOrderFormURL() + '/items/' + itemIndex + '/offerings';
    };

    CheckoutAPI.prototype._getRemoveOfferingsURL = function(itemIndex, offeringId) {
      return this._getOrderFormURL() + '/items/' + itemIndex + '/offerings/' + offeringId + '/remove';
    };

    CheckoutAPI.prototype._getAddCouponURL = function() {
      return this._getOrderFormURL() + '/coupons';
    };

    CheckoutAPI.prototype._getOrdersURL = function(orderGroupId) {
      return this.HOST_URL + '/api/checkout/pub/orders/order-group/' + orderGroupId;
    };

    CheckoutAPI.prototype._startTransactionURL = function() {
      return this._getOrderFormURL() + '/transaction';
    };

    CheckoutAPI.prototype._getUpdateItemURL = function() {
      return this._getOrderFormURL() + '/items/update/';
    };

    CheckoutAPI.prototype._getPostalCodeURL = function(postalCode, countryCode) {
      if (postalCode == null) {
        postalCode = '';
      }
      if (countryCode == null) {
        countryCode = 'BRA';
      }
      return this.POSTALCODE_URL + countryCode + '/' + postalCode;
    };

    CheckoutAPI.prototype._getProfileURL = function() {
      return this.HOST_URL + '/api/checkout/pub/profiles/';
    };

    return CheckoutAPI;

  })();

  window.vtex.checkout.API = CheckoutAPI;

  window.vtex.checkout.API.version = '0.1.0';

  window.vtex.checkout.SDK = CheckoutAPI;

  window.vtex.checkout.SDK.version = '0.1.0';

}).call(this);
