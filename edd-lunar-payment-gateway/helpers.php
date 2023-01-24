<?php


/**
 * Checks if the response from api call is valid.
 *
 * @param $response
 *
 * @access      public
 * @since       1.0.0
 * @return      bool
 */
function edd_lunar_is_successful_response( $response ) {
	return $response && isset( $response['successful'] ) && $response['successful'] == 1;
}

/**
 * Checks if the response from api call is valid.
 * @access      public
 * @since       1.0.0
 *
 * @param $response
 * @param $currency
 * @param $amount
 *
 * @return bool
 */
function edd_lunar_check_response_data( $response, $currency, $amount ) {
	return $response['currency'] == $currency &&
	       $response['amount'] == $amount;
}

/**
 * Determines if the shop is using a zero-decimal currency
 * @access      public
 * @since       1.0.0
 *
 * @param int $payment_id
 *
 * @return bool
 */
function edd_lunar_is_zero_decimal_currency( $payment_id = 0 ) {
	$ret      = false;
	$currency = edd_get_currency();
	if ( $payment_id ) {
		$currency = edd_get_payment_meta( $payment_id, 'currency' );
	}
	switch ( $currency ) {
		case 'BIF' :
		case 'CLP' :
		case 'DJF' :
		case 'GNF' :
		case 'JPY' :
		case 'KMF' :
		case 'KRW' :
		case 'MGA' :
		case 'PYG' :
		case 'RWF' :
		case 'VND' :
		case 'VUV' :
		case 'XAF' :
		case 'XOF' :
		case 'XPF' :
			$ret = true;
			break;

	}

	return $ret;
}

/**
 * Retrieve client ip.
 * @access      public
 * @since       1.0.0
 * @return      string
 */
function edd_lunar_get_client_ip() {
	if ( getenv( 'HTTP_CLIENT_IP' ) ) {
		$ip_address = getenv( 'HTTP_CLIENT_IP' );
	} elseif ( getenv( 'HTTP_X_FORWARDED_FOR' ) ) {
		$ip_address = getenv( 'HTTP_X_FORWARDED_FOR' );
	} elseif ( getenv( 'HTTP_X_FORWARDED' ) ) {
		$ip_address = getenv( 'HTTP_X_FORWARDED' );
	} elseif ( getenv( 'HTTP_FORWARDED_FOR' ) ) {
		$ip_address = getenv( 'HTTP_FORWARDED_FOR' );
	} elseif ( getenv( 'HTTP_FORWARDED' ) ) {
		$ip_address = getenv( 'HTTP_FORWARDED' );
	} elseif ( getenv( 'REMOTE_ADDR' ) ) {
		$ip_address = getenv( 'REMOTE_ADDR' );
	} else {
		$ip_address = '0.0.0.0';
	}

	return $ip_address;
}

/**
 * Returns a titles array for the products.
 * @access      public
 * @since       1.0.0
 */
function edd_lunar_get_cart_products() {
	$downloads_to_send = array();
	$downloads         = edd_get_cart_contents();
	if ( ! empty( $downloads ) ) {
		foreach ( $downloads as $download ) {
			$downloads_to_send[] = array(
				'id'       => $download['id'],
				'name'     => the_title_attribute( array(
					'echo' => false,
					'post' => $download['id']
				) ),
				'quantity' => $download['quantity']
			);
		}
	}

	return $downloads_to_send;
	//return edd_lunar_get_cart_description();
}

/**
 * Returns a description for the cart.
 * @access      public
 * @since       1.0.0
 * @return      string
 */
function edd_lunar_get_cart_description() {
	$summary   = '';
	$downloads = edd_get_cart_contents();
	if ( ! empty( $downloads ) ) {
		foreach ( $downloads as $download ) {
			$summary .= the_title_attribute( array(
					'echo' => false,
					'post' => $download['id']
				) ) . ', ';
		}
		$summary = substr( $summary, 0, - 2 );
	}

	return $summary;
}

/**
 * Sets the lunar-checkout parameter if the direct parameter is present in the [purchase_link] short code
 * @since  1.0.0
 * @return array
 */
function edd_lunar_purchase_link_shortcode_atts( $out, $pairs, $atts ) {
	if ( ! empty( $out['direct'] ) ) {
		$out['lunar-checkout'] = true;
		$out['direct']           = true;

	} else {
		foreach ( $atts as $key => $value ) {
			if ( false !== strpos( $value, 'lunar-checkout' ) ) {
				$out['lunar-checkout'] = true;
				$out['direct']           = true;
			}
		}

	}

	return $out;
}

add_filter( 'shortcode_atts_purchase_link', 'edd_lunar_purchase_link_shortcode_atts', 10, 3 );
/**
 * Sets the lunar-checkout parameter if the direct parameter is present in edd_get_purchase_link()
 * @since  1.0.0
 * @return array
 */
function edd_lunar_purchase_link_atts( $args ) {
	if ( ! empty( $args['direct'] ) && edd_is_gateway_active( 'lunar' ) ) {
		$args['lunar-checkout'] = true;
		$args['direct']           = true;
	}

	return $args;
}

add_filter( 'edd_purchase_link_args', 'edd_lunar_purchase_link_atts', 10 );
/**
 * Outputs javascript for the Lunar Checkout modal
 * @since  1.0.0
 * @return void
 */
function edd_lunar_purchase_link_output( $download_id = 0, $args = array() ) {
	global $printed_lunar_purchase_link;
	// Stop our output from being triggered if someone is looking at the content for meta tags, like Jetpack
	if ( doing_action( 'wp_head' ) ) {
		return;
	}
	if ( ! empty( $printed_lunar_purchase_link[ $download_id ] ) ) {
		return;
	}
	if ( ! isset( $args['lunar-checkout'] ) ) {
		return;
	}
	if ( ! edd_is_gateway_active( 'lunar' ) ) {
		return;
	}
	edd_lunar_js( true );
	$email = '';
	if ( is_user_logged_in() ) {
		$current_user = wp_get_current_user();
		$email        = $current_user->user_email;
	}
	wp_add_inline_script( 'edd-lunar-js',
		edd_lunar_get_link_form_script( $download_id, $email )
	);
	$printed_lunar_purchase_link[ $download_id ] = true;
}

add_action( 'edd_purchase_link_end', 'edd_lunar_purchase_link_output', 99999, 2 );
/**
 * Injects the Lunar transaction token and customer email into the pre-gateway data
 * @since  1.0.0
 * @return array
 */
function edd_lunar_straight_to_gateway_data( $purchase_data ) {
	if ( isset( $_REQUEST['edd_lunar_token'] ) ) {
		global $edd_lunar_is_buy_now;
		$edd_lunar_is_buy_now   = true;
		$purchase_data['gateway'] = 'lunar';
		$_REQUEST['edd-gateway']  = 'lunar';
		if ( isset( $_REQUEST['edd_email'] ) ) {
			$purchase_data['user_info']['email'] = sanitize_email( $_REQUEST['edd_email'] );
			$purchase_data['user_email']         = sanitize_email( $_REQUEST['edd_email'] );
		}

	}

	return $purchase_data;
}

add_filter( 'edd_straight_to_gateway_purchase_data', 'edd_lunar_straight_to_gateway_data' );

/**
 * Returns the minor amount based on the currency and the source
 *
 * @param $payment_id
 *
 * @return float
 */
function edd_lunar_get_minor_amount_from_payment( $payment_id ) {
	$currency = edd_get_currency();
	if ( $payment_id ) {
		$currency = edd_get_payment_currency_code($payment_id);
	}

	$amount  = edd_get_payment_amount( $payment_id );
	$manager = new \Paylike\Data\Currencies();
	$amount  = $manager->ceil( $amount, $currency );


	return $amount;
}

/**
 * @param        $amount
 * @param string $currency
 *
 * @return float
 */
function edd_lunar_get_minor_amount( $amount, $currency = '' ) {
	if ( $currency == '' ) {
		$currency = edd_get_currency();
	}
	$multiplier = get_lunar_currency_multiplier( $currency );
	$amount     = ceil( $amount * $multiplier ); // round to make sure we are always minor units

	return $amount;
}


/**
 * @param \Paylike\Exception\ApiException $exception
 * @param                                 $payment_id
 * @param string                          $context
 *
 * @return bool|string|void
 */
function edd_lunar_handle_exceptions( $exception, $payment_id = 0, $context = '' ) {
	if ( ! $exception ) {
		return false;
	}
	$exception_type = get_class( $exception );
	$message        = '';
	switch ( $exception_type ) {
		case 'Paylike\\Exception\\NotFound':
			$message = __( 'Transaction not found! Check the transaction key used for the operation.', 'edd-lunar' );
			break;
		case 'Paylike\\Exception\\InvalidRequest':
			$message = __( 'The request is not valid! Check if there is any validation bellow this message and adjust if possible, if not, and the problem persists, contact the developer.', 'edd-lunar' );
			break;
		case 'Paylike\\Exception\\Forbidden':
			$message = __( 'The operation is not allowed! You do not have the rights to perform the operation, make sure you have all the grants required on your Paylike account.', 'edd-lunar' );
			break;
		case 'Paylike\\Exception\\Unauthorized':
			$message = __( 'The operation is not properly authorized! Check the credentials set in settings for Paylike.', 'edd-lunar' );
			break;
		case 'Paylike\\Exception\\Conflict':
			$message = __( 'The operation leads to a conflict! The same transaction is being requested for modification at the same time. Try again later.', 'edd-lunar' );
			break;
		case 'Paylike\\Exception\\ApiConnection':
			$message = __( 'Network issues ! Check your connection and try again.', 'edd-lunar' );
			break;
		case 'Paylike\\Exception\\ApiException':
			$message = __( 'There has been a server issue! If this problem persists contact the developer.', 'edd-lunar' );
			break;
	}
	$message       = __( 'Error: ', 'edd-lunar' ) . $message;
	$error_message = edd_lunar_get_response_error( $exception->getJsonBody() );
	if ( $context ) {
		$message = $context . PHP_EOL . $message;
	}
	if ( $error_message ) {
		$message = $message . PHP_EOL . 'Validation:' . PHP_EOL . $error_message;
	}

	if ( $payment_id ) {
		edd_insert_payment_note( $payment_id, $message );
	}
	edd_debug_log( $message . PHP_EOL . json_encode( $exception->getJsonBody(), true ) );

	return $message;
}


/**
 * @return string
 */
function edd_lunar_get_secret_key() {
	global $edd_options;
	if ( edd_is_test_mode() ) {
		$secret_key = trim( $edd_options['lunar_test_secret_key'] );
	} else {
		$secret_key = trim( $edd_options['lunar_live_secret_key'] );
	}

	return $secret_key;
}