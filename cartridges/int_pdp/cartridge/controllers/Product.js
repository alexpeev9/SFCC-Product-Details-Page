'use strict';

/**
 * @namespace Product
 */

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
  * Product-Show : This endpoint is called to show the details of the selected product
  * @name Base/Product-Show
  * @function
  * @memberof Product
  * @param {middleware} - cache.applyPromotionSensitiveCache
  * @param {middleware} - consentTracking.consent
  * @param {querystringparameter} - pid - Product ID
  * @param {category} - non-sensitive
  * @param {renders} - isml
  * @param {serverfunction} - get
  */
 server.replace('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    const ContentMgr = require('/dw/content/ContentMgr');
    const productHelper = require('*/cartridge/scripts/helpers/productHelpers');

    // Add Specific Content Assets
    const contentOffer = ContentMgr.getContent('special-offers').custom.body.markup;
    const deliveryInfo = ContentMgr.getContent('delivery-product').custom.body.markup;
    
    const showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    const productType = showProductPageHelperResult.product.productType;
    
    if (!showProductPageHelperResult.product.online && productType !== 'set' && productType !== 'bundle') {
        res.setStatusCode(404);
        res.render('error/notFound');
    } else {
        const pageLookupResult = productHelper.getPageDesignerProductPage(showProductPageHelperResult.product);
        
        if ((pageLookupResult.page && pageLookupResult.page.hasVisibilityRules()) || pageLookupResult.invisiblePage) {
            // the result may be different for another user, do not cache on this level
            // the page itself is a remote include and can still be cached
            res.cachePeriod = 0; // eslint-disable-line no-param-reassign
        }
        if (pageLookupResult.page) {
            res.page(pageLookupResult.page.ID, {}, pageLookupResult.aspectAttributes);
        } else {
            res.render(showProductPageHelperResult.template, {
                product: showProductPageHelperResult.product,
                addToCartUrl: showProductPageHelperResult.addToCartUrl,
                resources: showProductPageHelperResult.resources,
                breadcrumbs: showProductPageHelperResult.breadcrumbs,
                canonicalUrl: showProductPageHelperResult.canonicalUrl,
                schemaData: showProductPageHelperResult.schemaData,
                contentOffer: contentOffer,
                deliveryInfo: deliveryInfo
            });
        }
    }
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
