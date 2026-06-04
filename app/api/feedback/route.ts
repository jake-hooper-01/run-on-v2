import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'edge'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const message = (body as Record<string, unknown>)?.message
  if (typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }
  if (message.length > 1000) {
    return NextResponse.json({ error: 'Message exceeds 1000 characters' }, { status: 400 })
  }

  const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'jake@hotboxdesign.com.au',
      subject: 'Run-On Feedback',
      text: `${message.trim()}\n\n---\nSent: ${timestamp}`,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
