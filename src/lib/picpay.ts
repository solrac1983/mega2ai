export interface PicPayPaymentRequest {
    referenceId: string;
    callbackUrl: string;
    returnUrl: string;
    value: number;
    buyer: {
        firstName: string;
        lastName: string;
        document: string;
        email: string;
        phone: string;
    };
}

export async function getPicPayToken() {
    const clientId = process.env.PICPAY_CLIENT_ID;
    const clientSecret = process.env.PICPAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("PicPay credentials missing in .env");
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'checkout:payments'); // Standard scope for payments

    const response = await fetch('https://checkout-api.picpay.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ PicPay Auth Error:", data);
        throw new Error(data.error_description || "Failed to get PicPay token");
    }

    return data.access_token;
}

export async function createPicPayPayment(request: PicPayPaymentRequest) {
    const accessToken = await getPicPayToken();

    const body = {
        referenceId: request.referenceId,
        callbackUrl: request.callbackUrl,
        returnUrl: request.returnUrl,
        value: request.value,
        expiresIn: 3600, // 1 hour
        buyer: request.buyer,
        // We force standard Pix/Wallet flow for now
        paymentMethod: {
            type: "wallet"
        }
    };

    const response = await fetch('https://checkout-api.picpay.com/v1/payments', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ PicPay Payment Error:", data);
        throw new Error(data.message || "Failed to create PicPay payment");
    }

    return data;
}
