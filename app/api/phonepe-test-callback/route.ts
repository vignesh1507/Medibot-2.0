import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('PhonePe Test Callback received:', body);

    // For testing, just redirect with success
    const redirectUrl = new URL('/pricing', req.url);
    redirectUrl.searchParams.set('status', 'success');
    redirectUrl.searchParams.set('transactionId', 'TEST-' + Date.now());
    redirectUrl.searchParams.set('message', 'Test payment completed');

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('PhonePe test callback error:', error);
    
    const redirectUrl = new URL('/pricing', req.url);
    redirectUrl.searchParams.set('status', 'failed');
    redirectUrl.searchParams.set('message', 'Test callback error');

    return NextResponse.redirect(redirectUrl);
  }
}

export async function GET(req: NextRequest) {
  // Handle GET redirects as well
  const url = new URL(req.url);
  const status = url.searchParams.get('code') === 'PAYMENT_SUCCESS' ? 'success' : 'failed';
  
  const redirectUrl = new URL('/pricing', req.url);
  redirectUrl.searchParams.set('status', status);
  redirectUrl.searchParams.set('transactionId', 'TEST-' + Date.now());

  return NextResponse.redirect(redirectUrl);
}
