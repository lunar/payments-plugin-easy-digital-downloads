<?php

/**
 * Register our settings section
 * @return array
 */
function edd_lunar_settings_section( $sections ) {
	$sections['edd-lunar'] = __( 'Lunar', 'edd-lunar' );

	return $sections;
}

add_filter( 'edd_settings_sections_gateways', 'edd_lunar_settings_section' );
/**
 * Register the gateway settings
 * @access      public
 * @since       1.0.0
 * @return      array
 */
function edd_lunar_add_settings( $settings ) {

	/** Show test fields only if we send a get parameter. */


	$lunar_settings = array(
		array(
			'id'   => 'lunar_settings',
			'name' => '<strong>' . __( 'Lunar Settings', 'edd-lunar' ) . '</strong>',
			'desc' => __( 'Configure the Lunar settings', 'edd-lunar' ),
			'type' => 'header'
		),
		array(
			'id'   => 'lunar_live_publishable_key',
			'name' => __( 'Public Key', 'edd-lunar' ),
			'desc' => __( 'Get it from your Lunar dashboard', 'edd-lunar' ),
			'type' => 'text',
			'size' => 'regular'
		),
		array(
			'id'   => 'lunar_live_secret_key',
			'name' => __( 'App Key', 'edd-lunar' ),
			'desc' => __( 'Get it from your Lunar dashboard', 'edd-lunar' ),
			'type' => 'text',
			'size' => 'regular'
		),
		array(
			'id'   => 'lunar_preapprove_only',
			'name' => __( 'Preapprove Only?', 'edd-lunar' ),
			'desc' => __( 'Check this if you would like to preapprove payments but not charge until a later date.<br/> To capture a preapproved payment use the buttons you will find in the payment history for all approval pending orders.<br/> The buttons are located in the "Preapproval" column.', 'edd-lunar' ),
			'type' => 'checkbox'
		),
		array(
			'id'   => 'lunar_checkout_settings',
			'name' => __( 'Lunar checkout mode', 'edd-lunar' ),
			'type' => 'header'
		),
		array(
			'id'   => 'lunar_disable_checkout',
			'name' => __( 'Disable Lunar Popup', 'edd-lunar' ),
			'desc' => __( 'Check this if you would like to disable the Lunar popup window on the main checkout screen and use the embedded form.', 'edd-lunar' ),
			'type' => 'checkbox'
		),
		array(
			'id'          => 'lunar_popup_title',
			'name'        => __( 'Payment popup title', 'edd-lunar' ),
			'desc'        => __( 'The text shown in the popup where the customer inserts the card details', 'edd-lunar' ),
			'type'        => 'text',
			'placeholder' => get_bloginfo( 'name' ),
			'size'        => 'regular',
			'std'         => get_bloginfo( 'name' ),
		),
		array(
			'id'          => 'lunar_method_title',
			'name'        => __( 'Payment method title', 'edd-lunar' ),
			'desc'        => '',
			'type'        => 'text',
			'size'        => 'regular',
			'placeholder' => __( 'Credit Card', 'edd-lunar' ),
			'std'         => __( 'Credit Card', 'edd-lunar' ),
		)
	);

	if (isset($_GET['debug'])) {
		$test_mode_fields = [
			array(
				'id'   => 'lunar_test_publishable_key',
				'name' => __( 'Test mode Public Key', 'edd-lunar' ),
				'desc' => __( 'Get it from your Lunar dashboard', 'edd-lunar' ),
				'type' => 'text',
				'size' => 'regular',
			),
			array(
				'id'   => 'lunar_test_secret_key',
				'name' => __( 'Test mode App Key', 'edd-lunar' ),
				'desc' => __( 'Get it from your Lunar dashboard', 'edd-lunar' ),
				'type' => 'text',
				'size' => 'regular',
			),
		];
		$lunar_settings = array_merge($lunar_settings, $test_mode_fields);
	}

	$lunar_settings = array( 'edd-lunar' => $lunar_settings );

	return array_merge( $settings, $lunar_settings );
}

add_filter( 'edd_settings_gateways', 'edd_lunar_add_settings' );
/**
 * Register our new payment status labels for EDD
 * @since 1.0.0
 * @return array
 */
function edd_lunar_payment_status_labels( $statuses ) {
	$statuses['preapproval'] = __( 'Preapproved', 'edd-lunar' );
	$statuses['cancelled']   = __( 'Cancelled', 'edd-lunar' );

	return $statuses;
}

add_filter( 'edd_payment_statuses', 'edd_lunar_payment_status_labels' );
/**
 * Display the Preapprove column label
 * @since 1.0.0
 * @return array
 */
function edd_lunar_payments_column( $columns ) {
	global $edd_options;
	$columns['preapproval'] = __( 'Preapproval', 'edd-lunar' );


	return $columns;
}

add_filter( 'edd_payments_table_columns', 'edd_lunar_payments_column' );
/**
 * Display the payment status filters
 * @since 1.0.0
 * @return array
 */
function edd_lunar_payment_status_filters( $views ) {
	$payment_count        = wp_count_posts( 'edd_payment' );
	$preapproval_count    = '&nbsp;<span class="count">(' . $payment_count->preapproval . ')</span>';
	$cancelled_count      = '&nbsp;<span class="count">(' . $payment_count->cancelled . ')</span>';
	$current              = isset( $_GET['status'] ) ? $_GET['status'] : '';
	$views['preapproval'] = sprintf( '<a href="%s"%s>%s</a>', esc_url( add_query_arg( 'status', 'preapproval', admin_url( 'edit.php?post_type=download&page=edd-payment-history' ) ) ), $current === 'preapproval' ? ' class="current"' : '', __( 'Preapproval Pending', 'edd-lunar' ) . $preapproval_count );
	$views['cancelled']   = sprintf( '<a href="%s"%s>%s</a>', esc_url( add_query_arg( 'status', 'cancelled', admin_url( 'edit.php?post_type=download&page=edd-payment-history' ) ) ), $current === 'cancelled' ? ' class="current"' : '', __( 'Cancelled', 'edd-lunar' ) . $cancelled_count );

	return $views;
}

add_filter( 'edd_payments_table_views', 'edd_lunar_payment_status_filters' );
/**
 * Show the Process / Cancel buttons for preapproved payments
 * @since 1.0.0
 * @return string
 */
function edd_lunar_payments_column_data( $value, $payment_id, $column_name ) {
	if ( $column_name == 'preapproval' ) {
		$status           = get_post_status( $payment_id );
		$transaction_id   = edd_get_payment_transaction_id( $payment_id );
		$captured_already = get_post_meta( $payment_id, '_edd_lunar_captured', true );
		if ( ! $transaction_id || $captured_already ) {
			return $value;
		}
		$nonce            = wp_create_nonce( 'edd-lunar-process-preapproval' );
		$preapproval_args = array(
			'payment_id' => $payment_id,
			'nonce'      => $nonce,
			'edd-action' => 'charge_lunar_preapproval'
		);
		$cancel_args      = array(
			'payment_id' => $payment_id,
			'nonce'      => $nonce,
			'edd-action' => 'cancel_lunar_preapproval'
		);
		if ( 'preapproval' === $status ) {
			$value = '<a href="' . esc_url( add_query_arg( $preapproval_args, admin_url( 'edit.php?post_type=download&page=edd-payment-history' ) ) ) . '" class="button-secondary button">' . __( 'Process Payment', 'edd-lunar' ) . '</a>&nbsp;';
			$value .= '<a href="' . esc_url( add_query_arg( $cancel_args, admin_url( 'edit.php?post_type=download&page=edd-payment-history' ) ) ) . '" class="button-secondary button">' . __( 'Cancel Preapproval', 'edd-lunar' ) . '</a>';
		}
	}

	return $value;
}

add_filter( 'edd_payments_table_column', 'edd_lunar_payments_column_data', 10, 3 );
