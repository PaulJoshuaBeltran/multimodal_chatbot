import { email } from '@/lib/toolcall/message'
import { SendMailOptions } from "nodemailer";

export async function POST(req: Request) {
    const { from, to, subject, text, html } = await req.json()
    try {
        if (!from) return new Response(JSON.stringify({ error: 'Sending email JSON missing: sender' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
        if (!to) return new Response(JSON.stringify({ error: 'Sending email JSON missing: recipient' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
        if (!subject) return new Response(JSON.stringify({ error: 'Sending email JSON missing: subject' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
        if (!text) return new Response(JSON.stringify({ error: 'Sending email JSON missing: text' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )

        const emailContent: SendMailOptions = {
            from: from,
            to: to,
            subject: subject,
            text: text,
            html: html ?? "",
        }
        await email(emailContent);
        return new Response(
            JSON.stringify({
                url: `/api/notification/email`,
                action: 'email_send'
            }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
    } catch (err: unknown) {
        const error = err as NodeJS.ErrnoException
        if (error?.code === 'ENOENT') {
            return new Response(JSON.stringify({ error: 'File not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            })
        }
        return new Response(JSON.stringify({ error: 'Failed to retrieve file' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}