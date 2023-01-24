<?php
/*
Plugin Name: Easy Digital Downloads - Lunar Payment Gateway
Plugin URL: https://wordpress.org/plugins/edd-lunar-payment-gateway/
Description: Allow customers to pay with credit cards via the Lunar gateway in your Easy Digital Downloads store.
Author: Lunar
Author URI: https://lunar.app
Version: 1.0.0
Text Domain: edd-lunar
Domain Path: languages
*/
if ( version_compare( PHP_VERSION, '5.3.3', '<' ) ) {
	add_action( 'admin_notices', 'edd_lunar_below_php_version_notice' );
	function edd_lunar_below_php_version_notice() {
		echo '<div class="error"><p>' . __( 'Your version of PHP is below the minimum version of PHP required by Easy Digital Downloads - Lunar Payment Gateway. Please contact your host and request that your version be upgraded to 5.3.3 or later.', 'edd-lunar' ) . '</p></div>';
	}

	return;
}
if ( ! defined( 'EDD_LUNAR_PLUGIN_DIR' ) ) {
	define( 'EDD_LUNAR_PLUGIN_DIR', dirname( __FILE__ ) );
}
if ( ! defined( 'EDD_LUNAR_PLUGIN_URL' ) ) {
	define( 'EDD_LUNAR_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
}
define( 'EDD_LUNAR_VERSION', '1.0.0' );
/**
 * Plugin activation
 * @access      public
 * @return      void
 * @since       1.0.0
 */
function edd_lunar_plugin_activation() {
}

register_activation_hook( __FILE__, 'edd_lunar_plugin_activation' );
/**
 * Internationalization
 * @access      public
 * @return      void
 * @since       1.0.0
 */
function edd_lunar_textdomain() {
	// Set filter for language directory
	$lang_dir = EDD_LUNAR_PLUGIN_DIR . '/languages/';
	// Traditional WordPress plugin locale filter
	$locale = apply_filters( 'plugin_locale', get_locale(), 'edd-lunar' );
	$mofile = sprintf( '%1$s-%2$s.mo', 'edd-lunar', $locale );
	// Setup paths to current locale file
	$mofile_local = $lang_dir . $mofile;
	$mofile_global = WP_LANG_DIR . '/edd-lunar/' . $mofile;
	// Look in global /wp-content/languages/edd-lunar/ folder
	if ( file_exists( $mofile_global ) ) {
		load_textdomain( 'edd-lunar', $mofile_global );

		// Look in local /wp-content/plugins/edd-lunar/languages/ folder
	} elseif ( file_exists( $mofile_local ) ) {
		load_textdomain( 'edd-lunar', $mofile_local );

	} else {
		// Load the default language files
		load_plugin_textdomain( 'edd-lunar', false, $lang_dir );
	}
}

add_action( 'init', 'edd_lunar_textdomain', 99999 );
/**
 * Register our payment gateway
 * @access      public
 * @return      array
 * @since       1.0.0
 */
function edd_lunar_register_gateway( $gateways ) {
	// Format: ID => Name
	$method_title = edd_get_option( 'lunar_method_title', __( 'Credit Card', 'edd-lunar' ) );
	$gateways['lunar'] = array(
		'admin_label'    => 'Lunar',
		'checkout_label' => edd_is_test_mode() ? $method_title
			/*.' -- In test mode, you can create a successful transaction with the card number 4100 0000 0000 0000 with any CVC and a valid expiration date.'*/
			: $method_title,
		'supports'       => array(
			'buy_now'
		)
	);

	return $gateways;
}

add_filter( 'edd_payment_gateways', 'edd_lunar_register_gateway' );

/**
 * Add an errors div
 *
 * @access      public
 * @return      void
 * @since       1.0
 */
function edd_add_lunar_errors() {
	echo '<div id="edd-lunar-payment-errors"></div>';
}

add_action( 'edd_lunar_after_cc_fields', 'edd_add_lunar_errors', 999 );


/**
 * Use Lunar embed solution
 * @access      public
 * @return      void
 * @since       1.0.0
 */
function edd_lunar_credit_card_form( $echo = true ) {

	global $edd_options;

	if ( ! edd_get_option( 'lunar_disable_checkout', false ) ) {
		return;
	}

	ob_start(); ?>

	<?php if ( ! wp_script_is( 'paylike-js' ) ) : ?>
		<?php edd_lunar_js( true ); ?>
	<?php endif; ?>

	<?php do_action( 'edd_lunar_before_cc_fields' ); ?>

	<fieldset id="edd_cc_fields">
		<legend><?php _e( 'Credit card', 'edd-lunar' ); ?></legend>
		<?php if ( is_ssl() ) : ?>
			<div id="edd_secure_site_wrapper">
				<span class="padlock">
					<svg class="edd-icon edd-icon-lock" xmlns="http://www.w3.org/2000/svg" width="18" height="28"
							viewBox="0 0 18 28" aria-hidden="true">
						<path d="M5 12h8V9c0-2.203-1.797-4-4-4S5 6.797 5 9v3zm13 1.5v9c0 .828-.672 1.5-1.5 1.5h-15C.672 24 0 23.328 0 22.5v-9c0-.828.672-1.5 1.5-1.5H2V9c0-3.844 3.156-7 7-7s7 3.156 7 7v3h.5c.828 0 1.5.672 1.5 1.5z"/>
					</svg>
				</span>
				<span><?php _e( 'This is a secure SSL encrypted payment.', 'edd-lunar' ); ?></span>
			</div>
		<?php endif; ?>
		<p id="edd-card-number-wrap">
			<label for="card_number" class="edd-label">
				<?php _e( 'Card Number', 'edd-lunar' ); ?>
				<span class="edd-required-indicator">*</span>
				<span class="card-type"></span>
			</label>
			<span class="edd-description"><?php _e( 'The (typically) 16 digits on the front of your credit card.', 'edd-lunar' ); ?></span>
			<input type="text" pattern="[0-9]{4}[0-9]{4}[0-9]{4}.*" id="card_number"
					class="card-number edd-input required" value="" placeholder="0000000000000000"
					required/>
		</p>
		<p id="edd-card-cvc-wrap">
			<label for="card_cvc" class="edd-label">
				<?php _e( 'CVC', 'edd-lunar' ); ?>
				<span class="edd-required-indicator">*</span>
			</label>
			<span class="edd-description"><?php _e( 'The 3 digit (back) or 4 digit (front) value on your card.', 'edd-lunar' ); ?></span>
			<input type="text" pattern="[0-9]{3,4}" value="" size="4" autocomplete="off" id="card_cvc"
					class="card-cvc card-code edd-input required" placeholder="***"/>
		</p>
		<?php do_action( 'edd_lunar_before_cc_expiration' ); ?>
		<p class="card-expiration">
			<label for="card_exp_month" class="edd-label">
				<?php _e( 'Expiration (MM/YY)', 'edd-lunar' ); ?>
				<span class="edd-required-indicator">*</span>
			</label>
			<span class="edd-description"><?php _e( 'The date your credit card expires, typically on the front of the card.', 'edd-lunar' ); ?></span>
			<input type="text" id="card-expiry" value="" class="card-expiry edd-input required"
					placeholder="MM/YY"
					pattern="[0-9]{2}/[0-9]{2}" required/>
		</p>
		<?php do_action( 'edd_lunar_after_cc_expiration' ); ?>


	</fieldset>
	<div class="tds-wrapper" style="display: none">
		<p class="tds-customer-message"><?php _e( 'The transaction requires 3-D Secure', 'edd-lunar' ); ?></p>
		<div class="tds-iframe">
			<iframe name="tds-lunar" frameborder="0"></iframe>
		</div>
	</div>
	<?php

	do_action( 'edd_lunar_after_cc_fields' );

	$form = ob_get_clean();

	if ( false !== $echo ) {
		echo $form;
	}

	return $form;
}

add_action( 'edd_lunar_cc_form', 'edd_lunar_credit_card_form' );


/**
 * Add settings link in the admin
 *
 * @param $links
 *
 * @return mixed
 */
function edd_lunar_add_settings_link( $links ) {
	$settings_link = '<a href="edit.php?post_type=download&page=edd-settings&tab=gateways&section=edd-lunar">' . __( 'Settings' ) . '</a>';
	array_push( $links, $settings_link );

	return $links;
}

$plugin = plugin_basename( __FILE__ );
add_filter( "plugin_action_links_$plugin", 'edd_lunar_add_settings_link' );

if ( ! class_exists( 'Paylike\Client' ) ) {
	require_once EDD_LUNAR_PLUGIN_DIR . '/vendor/autoload.php';
}
require_once EDD_LUNAR_PLUGIN_DIR . '/lunar.php';
require_once EDD_LUNAR_PLUGIN_DIR . '/settings.php';
require_once EDD_LUNAR_PLUGIN_DIR . '/helpers.php';
require_once EDD_LUNAR_PLUGIN_DIR . '/popup.php';
