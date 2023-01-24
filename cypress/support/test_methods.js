/// <reference types="cypress" />

'use strict';

import { PluginTestHelper } from './test_helper.js';

export var TestMethods = {

    /** Admin & frontend user credentials. */
    StoreUrl: (Cypress.env('ENV_ADMIN_URL').match(/^(?:http(?:s?):\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im))[0],
    AdminUrl: Cypress.env('ENV_ADMIN_URL'),
    RemoteVersionLogUrl: Cypress.env('REMOTE_LOG_URL'),

    /** Construct some variables to be used bellow. */
    ShopName: 'edd',
    VendorName: 'lunar',
    ShopCurrencyAdminUrl: '/edit.php?post_type=download&page=edd-settings&tab=general&section=currency',
    PaymentMethodAdminUrl: '/edit.php?post_type=download&page=edd-settings&tab=gateways&section=edd-lunar',
    OrdersPageAdminUrl: '/edit.php?post_type=download&page=edd-payment-history',
    ModulesAdminUrl: '/plugins.php',

    /**
     * Login to admin backend account
     */
    loginIntoAdminBackend() {
        cy.loginIntoAccount('input[id=user_login]', 'input[id=user_pass]', 'admin');
    },

    /**
     * Modify plugin settings
     * @param {String} captureMode
     */
    changeCaptureMode(captureMode) {
        /** Go to payments page, and select payment method. */
        cy.goToPage(this.PaymentMethodAdminUrl);

        /** Change capture mode & save. */
        if ('Instant' === captureMode) {
            cy.get('input[id="edd_settings[lunar_preapprove_only]"]').uncheck();
        } else if ('Delayed' === captureMode) {
            cy.get('input[id="edd_settings[lunar_preapprove_only]"]').check();
        }

        cy.get('#submit').click();
    },

    /**
     * Make payment with specified currency and process order
     *
     * @param {String} currency
     * @param {String} paymentAction
     * @param {Boolean} partialAmount
     */
     payWithSelectedCurrency(currency, paymentAction, partialAmount = false) {
        /** Make an instant payment. */
        it(`makes a payment with "${currency}"`, () => {
            this.makePaymentFromFrontend(currency);
        });

        /** Process last order from admin panel. */
        it(`process (${paymentAction}) an order from admin panel`, () => {
            this.processOrderFromAdmin(paymentAction, partialAmount);
        });
    },

    /**
     * Make an instant payment
     * @param {String} currency
     */
    makePaymentFromFrontend(currency) {
        /** Go to store frontend - specific product page. */
        cy.goToPage(this.StoreUrl + '/downloads/a-sample-digital-download/');

        /** Purchase product. */
        cy.get('a[data-action="edd_add_to_cart"]', {timeout: 10000}).click();

        /** Proceed to checkout. */
        cy.get('a.edd_go_to_checkout', {timeout: 10000}).click();

        cy.wait(1000);

        /** Get & Verify amount. */
        cy.get('span.edd_cart_amount').first().then(($totalAmount) => {
            cy.window().then(win => {
                var expectedAmount = PluginTestHelper.filterAndGetAmountInMinor($totalAmount, currency);
                var orderTotalAmount = Number(win.lunarAmount);
                expect(expectedAmount).to.eq(orderTotalAmount);
            });
        });

        /** Show popup. */
        cy.get('#edd-purchase-button').click();

        /**
         * Fill in popup.
         */
         PluginTestHelper.fillAndSubmitPopup();

        cy.get('.entry-content > p', {timeout: 10000}).should('be.visible').contains('Thank you for your purchase!');
    },

    /**
     * Process last order from admin panel
     * @param {String} paymentAction
     * @param {Boolean} partialAmount
     */
    processOrderFromAdmin(paymentAction, partialAmount = false) {
        /** Go to admin orders page. */
        cy.goToPage(this.OrdersPageAdminUrl);

        /**
         * Take specific action on order
         */
        this.paymentActionOnOrderAmount(paymentAction, partialAmount);
    },

    /**
     * Capture an order amount
     * @param {String} paymentAction
     * @param {Boolean} partialAmount
     */
     paymentActionOnOrderAmount(paymentAction, partialAmount = false) {
        switch (paymentAction) {
            case 'capture':
                /** Select capture transaction button. */
                cy.get('a[href*="&edd-action=charge_lunar_preapproval"]').first().click();
                break;
            case 'refund':
                /** Select last order. */
                cy.get('a[href*="&page=edd-payment-history&view=view-order-details"]').first().click();
                cy.get('select[name="edd-payment-status"]').select('refunded');
                cy.get('#edd_refund_in_lunar').check();
                cy.get('input.button.button-primary.right').click();
                break;
            case 'void':
                /** Select void transaction button. */
                cy.get('a[href*="&edd-action=cancel_lunar_preapproval"]').first().click();
                break;
        }

        /** Check if success message. */
        cy.get('div.notice.notice-success strong').should('contain', 'successfully');
    },

    /**
     * Change shop currency from admin
     */
    changeShopCurrencyFromAdmin(currency) {
        it(`Change shop currency from admin to "${currency}"`, () => {
            /** Go to edit shop page. */
            cy.goToPage(this.ShopCurrencyAdminUrl);

            /** Wait to load the dom correctly. */
            cy.wait(1500);

            /** Show select currency dropdown. */
            cy.get('select[id*="edd_settings[currency]"]').invoke('show');

            /** Select currency & save. */
            cy.get('select[id*="edd_settings[currency]"]').select(currency);

            cy.get('#submit').click();
        });
    },

    /**
     * Get Shop & plugin versions and send log data.
     */
    logVersions() {
        /** Get framework version. */
        cy.get('#wp-version').then($footerVersion => {
            var frameworkVersion = ($footerVersion.text()).replace(/[^0-9.]/g, '');
            cy.wrap(frameworkVersion).as('frameworkVersion');
        });

        /** Go to plugins page. */
        cy.goToPage(this.ModulesAdminUrl);

        /** Get shop and payment plugin version. */
        cy.get('tr[data-plugin*="easy-digital-downloads"] .plugin-version-author-uri').then($shopVersion => {
            var shopVersion = $shopVersion.text();
            cy.wrap(shopVersion.replace(/[^0-9.]/g, '')).as('shopVersion');
        });
        cy.get(`tr[data-plugin*='${this.VendorName}']  .plugin-version-author-uri`).then($pluginVersion => {
            var pluginVersion = $pluginVersion.text();
            cy.wrap(pluginVersion.replace(/[^0-9.]/g, '')).as('pluginVersion');
        });

        /** Get global variables and make log data request to remote url. */
        cy.get('@frameworkVersion').then(frameworkVersion => {
            cy.get('@shopVersion').then(shopVersion => {
                cy.get('@pluginVersion').then(pluginVersion => {

                    cy.request('GET', this.RemoteVersionLogUrl, {
                        key: shopVersion,
                        tag: this.ShopName,
                        view: 'html',
                        framework: frameworkVersion,
                        ecommerce: shopVersion,
                        plugin: pluginVersion
                    }).then((resp) => {
                        expect(resp.status).to.eq(200);
                    });
                });
            });
        });
    },
}