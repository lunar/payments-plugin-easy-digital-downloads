/// <reference types="cypress" />

'use strict';

import { TestMethods } from '../support/test_methods.js';

describe('plugin version log remotely', () => {
    /**
     * Go to backend site admin
     */
    before(() => {
        cy.goToPage(TestMethods.StoreUrl + '/wp-login.php');
        TestMethods.loginIntoAdminBackend();
    });

    /** Send log after full test finished. */
    it('log shop & plugin versions remotely', () => {
        TestMethods.logVersions();
    });
}); // describe