<?php


/**
 * Process lunar checkout submission
 * @access      public
 * @since       1.0.0
 *
 * @param $purchase_data
 *
 * @return      void
 * @throws \Paylike\Exception\ApiException
 */
function edd_lunar_process_payment( $purchase_data ) {
	global $edd_options, $edd_lunar_is_buy_now;
	$secret_key = edd_lunar_get_secret_key();
	// make sure we don't have any left over errors present
	edd_clear_errors();
	if ( ! isset( $_POST['edd_lunar_token'] ) ) {
		// no lunar token
		edd_set_error( 'no_token', __( 'Missing Lunar token. Please contact support.', 'edd-lunar' ) );
		edd_record_gateway_error( __( 'Missing Lunar Token', 'edd-lunar' ), __( 'A Lunar token failed to be generated. Please check Lunar logs for more information', 'edd-lunar' ) );

		return edd_lunar_complete_checkout( true );

	}
	$client         = new \Paylike\Paylike( $secret_key );
	$payment_data   = array(
		'price'        => $purchase_data['price'],
		'date'         => $purchase_data['date'],
		'user_email'   => $purchase_data['user_email'],
		'purchase_key' => $purchase_data['purchase_key'],
		'currency'     => edd_get_currency(),
		'downloads'    => $purchase_data['downloads'],
		'cart_details' => $purchase_data['cart_details'],
		'user_info'    => $purchase_data['user_info'],
		'status'       => 'pending',
		'gateway'      => 'lunar'
	);
	$transaction_id = sanitize_text_field( $_POST['edd_lunar_token'] );
	// preparing the amount for a check with the api / capture on the api
	$amount = $purchase_data['price'];
	/* retrieving data about current format */
	$currency = edd_get_currency();
	$manager  = new \Paylike\Data\Currencies();
	$amount   = $manager->ceil( $amount, $currency );
	edd_debug_log( '------------- Start payment --------------' . PHP_EOL . "Info: Begin processing payment for email {$purchase_data['user_email']} for the amount of {$amount}" . PHP_EOL . ' -- ' . __FILE__ . ' - Line:' . __LINE__ );

	//fetch the transaction
	try {
		$response = $client->transactions()->fetch( $transaction_id );
		if ( ! edd_lunar_is_successful_response( $response ) ) {
			edd_record_gateway_error( __( 'Fetching Transaction Failed', 'edd-lunar' ), sprintf( __( "Fetching transaction failed while processing a  payment. \nPayment Data: %s \nError: %s", 'edd-lunar' ), json_encode( $payment_data ), edd_lunar_get_response_error( $response ) ) );

			return edd_lunar_complete_checkout( true );
		}
	} catch ( \Paylike\Exception\ApiException $exception ) {

		edd_lunar_handle_exceptions( $exception, 0, 'Issue: Authorization Failed!' );

		return edd_lunar_complete_checkout( true );
	}
	$captured = false;
	// should capture
	if ( ! edd_lunar_is_preaprove_only() ) {
		// check if we have the proper amount

		// we try to capture the amount we have in the order,
		// this will fail if the transaction sent doesn't have at least
		// the sent amount and the same currency
		$data = array(
			'amount'   => $amount,
			'currency' => $payment_data['currency']
		);
		edd_debug_log( "Info: Begin capturing payment for email {$purchase_data['email']} for the amount of {$amount}" . PHP_EOL . ' -- ' . __FILE__ . ' - Line:' . __LINE__ );
		try {
			$response = $client->transactions()->capture( $transaction_id, $data );
			if ( ! edd_lunar_is_successful_response( $response ) ) {
				edd_record_gateway_error( __( 'Capturing Transaction Failed', 'edd-lunar' ), sprintf( __( "Capturing transaction failed while processing a payment.\nPayment Data: %s \nError: %s", 'edd-lunar' ), json_encode( $payment_data ), edd_lunar_get_response_error( $response ) ) );

				return edd_lunar_complete_checkout( true );
			}
			$captured = true;

		} catch ( \Paylike\Exception\ApiException $exception ) {

			edd_lunar_handle_exceptions( $exception, 0, 'Issue: Capturing Failed!' );

			return edd_lunar_complete_checkout( true );
		}
	}
	edd_lunar_insert_payment( $payment_data, $transaction_id, $captured );

	return edd_lunar_complete_checkout( false );

}

add_action( 'edd_gateway_lunar', 'edd_lunar_process_payment' );

/**
 * @param bool $has_error
 */
function edd_lunar_complete_checkout( $has_error = true ) {
	global $edd_lunar_is_buy_now;
	// empty cart, and send to confirmation page if we
	// don't have any errors
	if ( $has_error ) {
		edd_set_error( 'payment_not_recorded', __( 'Your payment could not be recorded, please contact the site administrator.', 'edd-lunar' ) );
		if ( $edd_lunar_is_buy_now ) {
			wp_die( 'Your payment could not be recorded, please contact the site administrator.', __( 'Card Processing Error', 'edd-lunar' ) );
		} else {
			// if errors are present, send the user back to the purchase page so they can be corrected
			edd_send_back_to_checkout( '?payment-mode=lunar' );
		}

	} else {
		edd_empty_cart();
		edd_send_to_success_page();
	}
}

/**
 * @param      $payment_data
 * @param      $transaction_id
 * @param bool $captured
 */
function edd_lunar_insert_payment( $payment_data, $transaction_id, $captured = false ) {
	$status = 'preapproval';
	if ( $captured ) {
		$status = 'publish';
	}
	$payment = edd_insert_payment( $payment_data );
	edd_set_payment_transaction_id( $payment, $transaction_id );
	edd_insert_payment_note( $payment, 'Lunar Transaction ID: ' . $transaction_id );

	edd_update_payment_status( $payment, $status );
	add_post_meta( $payment, '_edd_lunar_captured', $captured );
	if ( $captured ) {
		edd_insert_payment_note( $payment, __( 'Captured Preapproved Transaction Successful', 'edd-lunar' ) );
	}
}


/**
 * @return bool
 */
function edd_lunar_is_preaprove_only() {
	global $edd_options;

	return isset( $edd_options['lunar_preapprove_only'] );
}

/**
 * Trigger preapproved payment charge
 * @since 1.0.0
 * @return void
 * @throws \Paylike\Exception\ApiException
 */
function edd_lunar_process_preapproved_charge() {
	if ( empty( $_GET['nonce'] ) ) {
		return;
	}
	if ( ! wp_verify_nonce( $_GET['nonce'], 'edd-lunar-process-preapproval' ) ) {
		return;
	}
	$payment_id = absint( $_GET['payment_id'] );
	$charge     = edd_lunar_charge_preapproved( $payment_id );
	if ( $charge ) {
		wp_redirect( esc_url_raw( add_query_arg( array( 'edd-message' => 'lunar-preapproval-charged' ), admin_url( 'edit.php?post_type=download&page=edd-payment-history' ) ) ) );
		exit;
	} else {
		wp_redirect( esc_url_raw( add_query_arg( array( 'edd-message' => 'lunar-preapproval-failed' ), admin_url( 'edit.php?post_type=download&page=edd-payment-history' ) ) ) );
		exit;
	}

}

add_action( 'edd_charge_lunar_preapproval', 'edd_lunar_process_preapproved_charge' );


/**
 * Cancel a preapproved payment
 * @since 1.0.0
 * @return void
 * @throws \Paylike\Exception\ApiException
 */
function edd_lunar_process_preapproved_cancel() {
	global $edd_options;
	if ( empty( $_GET['nonce'] ) ) {
		return;
	}
	if ( ! wp_verify_nonce( $_GET['nonce'], 'edd-lunar-process-preapproval' ) ) {
		return;
	}
	$payment_id        = absint( $_GET['payment_id'] );
	$transaction_id    = edd_get_payment_transaction_id( $payment_id );
	$captured_already  = get_post_meta( $payment_id, '_edd_lunar_captured', true );
	$cancelled_already = get_post_meta( $payment_id, '_edd_lunar_preapproval_cancelled', true );
	if ( empty( $transaction_id ) || empty( $payment_id ) || $captured_already || $cancelled_already ) {
		return;
	}
	if ( 'preapproval' !== get_post_status( $payment_id ) ) {
		return;
	}
	$amount     = edd_lunar_get_minor_amount_from_payment( $payment_id );
	$secret_key = edd_is_test_mode() ? trim( $edd_options['lunar_test_secret_key'] ) : trim( $edd_options['lunar_live_secret_key'] );
	edd_debug_log( "Info: Begin canceling payment for payment id {$payment_id} for the amount {$amount}" . PHP_EOL . ' -- ' . __FILE__ . ' - Line:' . __LINE__ );
	$client = new \Paylike\Paylike( $secret_key );
	$data   = array(
		'amount' => $amount
	);
	try {
		$response = $client->transactions()->void( $transaction_id, $data );
		if ( ! edd_lunar_is_successful_response( $response ) ) {
			edd_insert_payment_note( $payment_id, __( "The order was cancelled, but the transaction could not be voided in Lunar.", 'edd-lunar' ) );
			edd_record_gateway_error( __( 'Transaction Void Failed', 'edd-lunar' ), sprintf( __( "\nError: %s", 'edd-lunar' ), edd_lunar_get_response_error( $response ) ) );
		}
		// we cancel the order regardless of the void operation.
		edd_insert_payment_note( $payment_id, __( 'Preapproval cancelled', 'edd-lunar' ) );
		edd_update_payment_status( $payment_id, 'cancelled' );
		// add flag such that we don't try to cancel twice.
		update_post_meta( $payment_id, '_edd_lunar_preapproval_cancelled', true );
		wp_redirect( esc_url_raw( add_query_arg( array( 'edd-message' => 'lunar-preapproval-cancelled' ), admin_url( 'edit.php?post_type=download&page=edd-payment-history' ) ) ) );
		exit;
	} catch ( \Paylike\Exception\ApiException $exception ) {
		edd_lunar_handle_exceptions( $exception, $payment_id, 'Issue: Void Failed!' );
		wp_redirect( esc_url_raw( add_query_arg( array( 'edd-message' => 'lunar-preapproval-cancel-failed' ), admin_url( 'edit.php?post_type=download&page=edd-payment-history' ) ) ) );
		exit;
	}

}

add_action( 'edd_cancel_lunar_preapproval', 'edd_lunar_process_preapproved_cancel' );

/**
 * Charge a preapproved payment
 * @since 1.0.0
 *
 * @param int $payment_id
 *
 * @return bool
 * @throws \Paylike\Exception\ApiException
 */
function edd_lunar_charge_preapproved( $payment_id = 0 ) {
	global $edd_options;
	if ( empty( $payment_id ) ) {
		return false;
	}
	$transaction_id   = edd_get_payment_transaction_id( $payment_id );
	$captured_already = get_post_meta( $payment_id, '_edd_lunar_captured', true );
	if ( empty( $transaction_id ) || empty( $payment_id ) || $captured_already ) {
		return;
	}
	if ( 'preapproval' !== get_post_status( $payment_id ) ) {
		return;
	}
	$secret_key = edd_is_test_mode() ? trim( $edd_options['lunar_test_secret_key'] ) : trim( $edd_options['lunar_live_secret_key'] );
	$client     = new \Paylike\Paylike( $secret_key );
	$amount     = edd_lunar_get_minor_amount_from_payment( $payment_id );
	$data       = array(
		'amount'   => $amount,
		'currency' => edd_get_payment_currency_code( $payment_id )
	);
	edd_debug_log( "Info: Begin capturing payment for payment {$payment_id} for the amount of {$amount}" . PHP_EOL . ' -- ' . __FILE__ . ' - Line:' . __LINE__ );
	try {
		$response = $client->transactions()->capture( $transaction_id, $data );
		if ( edd_lunar_is_successful_response( $response ) ) {
			edd_insert_payment_note( $payment_id, __( 'Captured Preapproved Transaction Successful', 'edd-lunar' ) );
			edd_update_payment_status( $payment_id, 'publish' );
			// remove it such that we can't no longer try to capture.
			update_post_meta( $payment_id, '_edd_lunar_captured', true );

			return true;
		}

		edd_insert_payment_note( $payment_id, __( 'Capturing Preapproved Transaction Failed', 'edd-lunar' ) );
		edd_record_gateway_error( __( 'Capturing Preapproved Transaction Failed', 'edd-lunar' ), sprintf( __( "\nError: %s", 'edd-lunar' ), edd_lunar_get_response_error( $response ) ) );

		return false;
	} catch ( \Paylike\Exception\ApiException $exception ) {
		edd_lunar_handle_exceptions( $exception, $payment_id, 'Issue: Capture Failed!' );

		return false;
	}


}

/**
 * Admin Messages
 * @since 1.0.0
 * @return void
 */
function edd_lunar_admin_messages() {
	if ( isset( $_GET['edd-message'] ) && 'lunar-preapproval-charged' == $_GET['edd-message'] ) {
		add_settings_error( 'edd-lunar-notices', 'edd-lunar-preapproval-charged', __( 'The preapproved payment was successfully charged.', 'edd-lunar' ), 'updated' );
	}
	if ( isset( $_GET['edd-message'] ) && 'lunar-preapproval-failed' == $_GET['edd-message'] ) {
		add_settings_error( 'edd-lunar-notices', 'edd-lunar-preapproval-charged', __( 'The preapproved payment failed to be charged. View order details for further details.', 'edd-lunar' ), 'error' );
	}
	if ( isset( $_GET['edd-message'] ) && 'lunar-preapproval-cancel-failed' == $_GET['edd-message'] ) {
		add_settings_error( 'edd-lunar-notices', 'edd-lunar-preapproval-cancel-failed', __( 'The preapproved payment couldn\'t be canceled. View order details for further details.', 'edd-lunar' ), 'updated' );
	}
	if ( isset( $_GET['edd-message'] ) && 'lunar-preapproval-cancelled' == $_GET['edd-message'] ) {
		add_settings_error( 'edd-lunar-notices', 'edd-lunar-preapproval-cancelled', __( 'The preapproved payment was successfully cancelled.', 'edd-lunar' ), 'updated' );
	}
	settings_errors( 'edd-lunar-notices' );
}

add_action( 'admin_notices', 'edd_lunar_admin_messages' );

/**
 * Process refund in Lunar
 *
 * @param $payment_id
 * @param $new_status
 * @param $old_status
 *
 * @access      public
 * @since       1.0.0
 * @return      void
 * @throws \Paylike\Exception\ApiException
 */
function edd_lunar_process_refund( $payment_id, $new_status, $old_status ) {
	global $edd_options;
	if ( empty( $_POST['edd_refund_in_lunar'] ) ) {
		return;
	}
	$should_process_refund = 'publish' != $old_status && 'revoked' != $old_status ? false : true;
	if ( false === $should_process_refund ) {
		return;
	}
	if ( 'refunded' != $new_status ) {
		return;
	}
	// Bail if no transaction ID was found
	$transaction_id = edd_get_payment_transaction_id( $payment_id );
	if ( empty( $transaction_id ) ) {
		return;
	}
	$secret_key = edd_is_test_mode() ? trim( $edd_options['lunar_test_secret_key'] ) : trim( $edd_options['lunar_live_secret_key'] );

	$client   = new \Paylike\Paylike( $secret_key );
	$amount   = edd_lunar_get_minor_amount_from_payment( $payment_id );
	edd_debug_log( "Info: Begin refunding payment for payment {$payment_id} for the amount of {$amount}" . PHP_EOL . ' -- ' . __FILE__ . ' - Line:' . __LINE__ );

	try {
		$response = $client->transactions()->refund( $transaction_id, array( 'amount' => $amount ) );
		if ( edd_lunar_is_successful_response( $response ) ) {
			edd_insert_payment_note( $payment_id, __( 'Transaction refunded in Lunar', 'edd-lunar' ) );
		} else {
			edd_insert_payment_note( $payment_id, __( 'Refunding transaction in Lunar failed', 'edd-lunar' ) );
			edd_record_gateway_error( __( 'Refunding transaction in Lunar failed', 'edd-lunar' ), sprintf( __( "Error: %s", 'edd-lunar' ), edd_lunar_get_response_error( $response ) ) );
		}
	}catch ( \Paylike\Exception\ApiException $exception ) {
		edd_lunar_handle_exceptions( $exception, $payment_id, 'Issue: Refund Failed!' );
	}

}

add_action( 'edd_update_payment_status', 'edd_lunar_process_refund', 200, 3 );


/**
 * Tries to get the error message from Lunar response.
 *
 * @param $response
 *
 * @return string
 */
function edd_lunar_get_response_error( $response ) {
	$error = array();
	// if this is just one error
	if ( isset( $response['text'] ) ) {
		return $response['text'];
	}

	// otherwise this is a multi field error
	if ( $response ) {
		foreach ( $response as $field_error ) {
			$error[] = $field_error['field'] . ':' . $field_error['message'];
		}
	}
	$error_message = implode( ' ', $error );

	return $error_message;
}
