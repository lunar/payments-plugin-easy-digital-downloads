# Easy Digital Downloads plugin for Lunar

The software is provided “as is”, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement.


## Supported Easy Digital Downloads versions

 VERSION 3.0 of EDD has removed Payment history, so this plugin is not compatible fully compatible yet, but it works to receive payments and manually capture. An update is in progress.

 *The plugin has been tested with most versions of EDD at every iteration. We recommend using the latest version of Easy digital downloads, but if that is not possible for some reason, test the plugin with your EDD version and it would probably function properly.*

## Installation

  Once you have installed Easy Digital Downloads on your Wordpress setup, follow these simple steps:
  1. Signup at [lunar.app](https://lunar.app) (it’s free)
  1. Create an account
  1. Create an app key for your Easy Digital Downloads website
  1. Upload the plugin files to the `/wp-content/plugins/edd-lunar` directory.
  1. Activate the plugin through the 'Plugins' screen in WordPress.
  1. Insert the app key and your public key in the Payment Gateways settings for the Lunar payment plugin


## Updating settings

Under the Easy Digital Downloads Lunar settings, you can:
 * Update the payment method text in the payment gateways list
 * Update the title that shows up in the payment popup
 * Add public & app keys
 * Change the capture type (Captured/Preapproved)


 ## Transactions

 There are three transaction operations which you can do:
1. Capture
    - in order to capture a preapproved payment, you can click **"Process Preapproved"** on the payment history page for that specific order in the WordPress admin.
2. Void
    - the only way we void a transaction is when this is preapproved, but not "captured". the button for **"Cancel Preapproval"** is on **`Payment history`** page.
3. Refund
    - in order to refund, you need to have a order with the status "Completed", move it to "Refunded", check the option that appears below "Refund in Lunar", and click update.

  ## Available features

1. Capture
   * Easy Digital Downloads admin panel: full capture
   * Lunar admin panel: full/partial capture
2. Refund
   * Easy Digital Downloads admin panel: full refund
   * Lunar admin panel: full/partial refund
3. Void
   * Easy Digital Downloads admin panel: full void
   * Lunar admin panel: full/partial void
