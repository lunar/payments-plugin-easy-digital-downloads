<?php

/**
 * Load our javascript
 * @access      public
 * @since       1.0.0
 *
 * @param bool $override Allows registering lunar.js on pages other than is_checkout()
 *
 * @return      void
 */
function edd_lunar_js( $override = false ) {
	if ( function_exists( 'edd_is_checkout' ) ) {
		$publishable_key = null;
		if ( edd_is_test_mode() ) {
			$publishable_key = edd_get_option( 'lunar_test_publishable_key', '' );
		} else {
			$publishable_key = edd_get_option( 'lunar_live_publishable_key', '' );
		}
		if ( ( edd_is_checkout() || $override ) ) {
			wp_enqueue_style( 'edd-lunar-css', EDD_LUNAR_PLUGIN_URL . 'edd-lunar.css' );
            /**
             * When the Paylike script/link AND Paylike window object will change
             * we can safely replace "paylike-js" with "lunar-js"
             *
             * Now, we keep the name/code "paylike-js" to prevent script conflict
             * if both Paylike & Lunar module installed
             */
            wp_enqueue_script( 'paylike-js', 'https://sdk.paylike.io/a.js', '', null, true );
            wp_enqueue_script( 'edd-lunar-js', EDD_LUNAR_PLUGIN_URL . 'edd-lunar.js', array(
                'jquery',
                'paylike-js'
            ), EDD_LUNAR_VERSION );

            wp_enqueue_script( 'edd-pay-embedded', EDD_LUNAR_PLUGIN_URL . 'edd-pay-embedded.js', '', null, true );

			/* retrieving data about current format */
			$currency   = edd_get_currency();
			$manager    = new \Paylike\Data\Currencies();
			$multiplier = $manager->getPaylikeMultiplier( $currency );

			$lunar_vars = apply_filters( 'edd_lunar_js_vars', array(
				'test_mode'           => (edd_is_test_mode()) ? ('test') : ('live'),
				'publishable_key'     => trim( $publishable_key ),
				'is_ajaxed'           => edd_is_ajax_enabled() ? 'true' : 'false',
				'is_zero_decimal'     => edd_lunar_is_zero_decimal_currency() ? 'true' : 'false',
				'checkout'            => edd_get_option( 'lunar_disable_checkout' ) ? 'false' : 'true',
				'store_name'          => edd_get_option( 'lunar_popup_title', get_bloginfo( 'name' ) ),
				'submit_text'         => __( 'Next', 'edd-lunar' ),
				'no_key_error'        => __( 'The Lunar Public Key is missing. Insert it in Settings -> Payment Gateways -> Lunar', 'edd-lunar' ),
				'error_prefix'        => __( 'The following error occurred: ', 'edd-lunar' ),
				'payment_description' => edd_lunar_get_cart_description(),
				'currency'            => $currency,
				'exponent'            => $manager->all()[$currency]['exponent'],
				'multiplier'          => $multiplier,
				'locale'              => get_locale(),
				//'orderId'             => '',
				'products'            => edd_lunar_get_cart_products(),
				//'name'                => '',
				//'email'               => '',
				//'telephone'           => '',
				//'address'           => '',
				'customer_ip'         => edd_lunar_get_client_ip(),
				'platform'            => 'WordPress',
				'platform_version'    => get_bloginfo( 'version' ),
				'ecommerce'           => 'easy-digital-downloads',
				'version'             => EDD_LUNAR_VERSION
			) );
			wp_localize_script( 'edd-lunar-js', 'edd_lunar_vars', $lunar_vars );

		}
	}
}

add_action( 'wp_enqueue_scripts', 'edd_lunar_js', 100 );
/**
 * Load our admin javascript
 * @access      public
 * @since       1.0.0
 * @return      void
 */
function edd_lunar_admin_js( $payment_id = 0 ) {
	if ( 'lunar' !== edd_get_payment_gateway( $payment_id ) ) {
		return;
	}
	?>
	<script type="text/javascript">
        jQuery(document).ready(function ($) {
            $('select[name=edd-payment-status]').change(function () {

                if ('refunded' == $(this).val()) {

                    // Localize refund label
                    var edd_lunar_refund_charge_label = "<?php echo esc_js( __( 'Refund Transaction in Lunar', 'edd-lunar' ) ); ?>";

                    $(this).parent().parent().append('<input type="checkbox" id="edd_refund_in_lunar" name="edd_refund_in_lunar" value="1" style="margin-top: 0;" />');
                    $(this).parent().parent().append('<label for="edd_refund_in_lunar">' + edd_lunar_refund_charge_label + '</label>');

                } else {

                    $('#edd_refund_in_lunar').remove();
                    $('label[for="edd_refund_in_lunar"]').remove();

                }

            });
        });
	</script>
	<?php

}

add_action( 'edd_view_order_details_before', 'edd_lunar_admin_js', 100 );

/**
 * Returns script for buy now button
 */
function edd_lunar_get_link_form_script( $download_id, $email ) {
	// such that we get rid of additional markup
	$product_title = the_title_attribute( array(
		'echo' => false,
		'post' => $download_id
	) );
	?>
	<script>
		<?php ob_start(); ?>
        jQuery(document).ready(function ($) {

            var edd_global_vars;
            var edd_scripts;
            var form;

            $('#edd_purchase_<?php echo $download_id; ?> .edd-add-to-cart,.edd_purchase_<?php echo $download_id; ?> .edd-add-to-cart').click(function (e) {

                form = $(this).parents('.edd_download_purchase_form');

                e.preventDefault();

                var label = form.find('.edd-add-to-cart-label').text();

                if (form.find('.edd_price_options').length || form.find('.edd_price_option_<?php echo $download_id; ?>').length) {

                    var custom_price = false;
                    var price_id;
                    var prices = [];
                    var amount = 0;

					<?php foreach( edd_get_variable_prices( $download_id ) as $price_id => $price ) : ?>
                    prices[<?php echo $price_id; ?>] = <?php echo edd_lunar_get_minor_amount( $price['amount'] ); ?>;
					<?php endforeach; ?>

                    if (form.find('.edd_price_option_<?php echo $download_id; ?>').length > 1) {

                        if (form.find('.edd_price_options input:checked').hasClass('edd_cp_radio')) {

                            custom_price = true;
                            amount = Math.ceil(form.find('.edd_cp_price').val() * edd_lunar_vars.multiplier);

                        } else {
                            price_id = form.find('.edd_price_options input:checked').val();
                        }

                    } else {

                        price_id = form.find('.edd_price_option_<?php echo $download_id; ?>').val();

                    }

                    if (!custom_price) {

                        amount = prices[price_id];

                    }

                } else if (form.find('.edd_cp_price').length && form.find('.edd_cp_price').val()) {
                    amount = Math.ceil(form.find('.edd_cp_price').val() * edd_lunar_vars.multiplier);

                } else {
                    amount = <?php echo edd_lunar_get_minor_amount( edd_get_download_price( $download_id ) );  ?>;
                }

                var lunar = Paylike({key: edd_lunar_vars.publishable_key});

                var args = {
                    test: ('test' == edd_lunar_vars.test_mode) ? (true) : (false),
                    title: edd_lunar_vars.store_name,
                    amount: {
                        currency: edd_lunar_vars.currency,
                        exponent: Number(edd_lunar_vars.exponent),
                        value: amount
                    },
                    locale: edd_lunar_vars.locale,
                    description: edd_lunar_vars.payment_description,
                    custom: {
                        //orderId: '',
                        products: '<?php echo esc_js( $product_title ); ?>',
                        //name: name,
                        email: '<?php echo esc_js( $email ); ?>',
                        //telephone: '',
                        //address: '',
                        customerIP: edd_lunar_vars.customer_ip,
                        locale: edd_lunar_vars.locale,
                        platform: edd_lunar_vars.platform,
                        platform_version: edd_lunar_vars.platform_version,
                        ecommerce: edd_lunar_vars.ecommerce,
                        lunar_plugin: {
                            version: edd_lunar_vars.version
                        }
                    }
                };

                lunar.pay(args,
                    function (err, res) {
                        form.find('.edd-add-to-cart').removeAttr('data-edd-loading');
                        form.find('.edd-add-to-cart-label').text(label).show();

                        // if we have an error we bail out
                        if (err && err == 'closed') {
                            return false;
                        } else if (err) {
                            alert(edd_lunar_vars.error_prefix + err.text);
                            return false;
                        }

                        // insert the transaction id into the form so it gets submitted to the server
                        var trxid = res.transaction.id;
                        form.append("<input type='hidden' name='edd_lunar_token' value='" + trxid + "' />");
                        form.append("<input type='hidden' name='edd_email' value='" + '<?php echo esc_js( $email ); ?>' + "' />");
                        // submit
                        form.get(0).submit();
                    }
                );

                return false;
            });
        });
		<?php $script = ob_get_clean(); ?>
	</script>
	<?php
	return $script;
}