import { Resend } from 'resend'

const resend = new Resend(process.env['RESEND_API_KEY'])
const FROM = process.env['RESEND_FROM'] ?? 'Creators Link <noreply@creatorslink.org>'

// ─── Payment link (sent when subscription is created) ────────────────────────

export async function sendCryptoPaymentLink(params: {
  to: string
  creatorName: string
  planTitle: string
  paymentLink: string
  expireDate?: string
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Seu link de pagamento — ${params.creatorName}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5">
  <div style="max-width:480px;margin:40px auto;padding:32px;background:#141414;border-radius:16px;border:1px solid #222">
    <div style="margin-bottom:28px">
      <span style="font-size:24px;font-weight:800;color:#fff">Creators Link</span>
    </div>

    <h1 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px">
      Acesso VIP — ${params.planTitle}
    </h1>
    <p style="color:#888;font-size:14px;margin:0 0 28px">
      Canal da ${params.creatorName}
    </p>

    <p style="font-size:15px;color:#ccc;margin:0 0 24px;line-height:1.6">
      Clique no botão abaixo para realizar o pagamento em crypto e liberar seu acesso ao canal VIP.
    </p>

    <a href="${params.paymentLink}"
       style="display:inline-block;background:#3b82f6;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-bottom:24px">
      Pagar agora →
    </a>

    ${params.expireDate ? `<p style="font-size:12px;color:#555;margin:0 0 24px">Link válido até ${new Date(params.expireDate).toLocaleDateString('pt-BR')}.</p>` : ''}

    <hr style="border:none;border-top:1px solid #222;margin:24px 0">
    <p style="font-size:12px;color:#444;margin:0">
      Aceitamos Bitcoin, Ethereum, USDT e +100 criptomoedas.<br>
      Powered by Creators Link
    </p>
  </div>
</body>
</html>`,
  })
}

// ─── Payment confirmed + Telegram invite link ─────────────────────────────────

export async function sendCryptoAccessGranted(params: {
  to: string
  creatorName: string
  planTitle: string
  inviteLink: string
  periodEnd: Date
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `✅ Acesso liberado — ${params.creatorName}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5">
  <div style="max-width:480px;margin:40px auto;padding:32px;background:#141414;border-radius:16px;border:1px solid #222">
    <div style="margin-bottom:28px">
      <span style="font-size:24px;font-weight:800;color:#fff">Creators Link</span>
    </div>

    <h1 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px">
      Pagamento confirmado! 🎉
    </h1>
    <p style="color:#888;font-size:14px;margin:0 0 28px">
      ${params.planTitle} — ${params.creatorName}
    </p>

    <p style="font-size:15px;color:#ccc;margin:0 0 24px;line-height:1.6">
      Seu acesso foi liberado. Use o link abaixo para entrar no canal VIP do Telegram.
      O link é de uso único — não compartilhe.
    </p>

    <a href="${params.inviteLink}"
       style="display:inline-block;background:#22c55e;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-bottom:24px">
      Entrar no canal VIP →
    </a>

    <p style="font-size:13px;color:#666;margin:0 0 24px">
      Acesso válido até <strong style="color:#aaa">${params.periodEnd.toLocaleDateString('pt-BR')}</strong>.<br>
      Você receberá um novo link de renovação antes dessa data.
    </p>

    <hr style="border:none;border-top:1px solid #222;margin:24px 0">
    <p style="font-size:12px;color:#444;margin:0">Powered by Creators Link</p>
  </div>
</body>
</html>`,
  })
}

// ─── Renewal reminder (sent X days before expiry) ────────────────────────────

export async function sendCryptoRenewalLink(params: {
  to: string
  creatorName: string
  planTitle: string
  paymentLink: string
  expireDate: Date
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Renove seu acesso VIP — ${params.creatorName}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5">
  <div style="max-width:480px;margin:40px auto;padding:32px;background:#141414;border-radius:16px;border:1px solid #222">
    <div style="margin-bottom:28px">
      <span style="font-size:24px;font-weight:800;color:#fff">Creators Link</span>
    </div>

    <h1 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px">
      Seu acesso vence em breve ⏰
    </h1>
    <p style="color:#888;font-size:14px;margin:0 0 28px">
      ${params.planTitle} — ${params.creatorName}
    </p>

    <p style="font-size:15px;color:#ccc;margin:0 0 24px;line-height:1.6">
      Seu acesso ao canal VIP expira em <strong style="color:#fff">${params.expireDate.toLocaleDateString('pt-BR')}</strong>.
      Renove agora para não perder o acesso.
    </p>

    <a href="${params.paymentLink}"
       style="display:inline-block;background:#f59e0b;color:#000;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-bottom:24px">
      Renovar acesso →
    </a>

    <hr style="border:none;border-top:1px solid #222;margin:24px 0">
    <p style="font-size:12px;color:#444;margin:0">Powered by Creators Link</p>
  </div>
</body>
</html>`,
  })
}

// ─── Access expired ───────────────────────────────────────────────────────────

export async function sendAccessExpired(params: {
  to: string
  creatorName: string
  planTitle: string
  renewLink: string
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Seu acesso expirou — ${params.creatorName}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5">
  <div style="max-width:480px;margin:40px auto;padding:32px;background:#141414;border-radius:16px;border:1px solid #222">
    <div style="margin-bottom:28px">
      <span style="font-size:24px;font-weight:800;color:#fff">Creators Link</span>
    </div>

    <h1 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px">
      Acesso encerrado
    </h1>
    <p style="color:#888;font-size:14px;margin:0 0 28px">
      ${params.planTitle} — ${params.creatorName}
    </p>

    <p style="font-size:15px;color:#ccc;margin:0 0 24px;line-height:1.6">
      Seu acesso ao canal VIP foi encerrado por falta de renovação.
      Você foi removido do canal. Para voltar, renove sua assinatura.
    </p>

    <a href="${params.renewLink}"
       style="display:inline-block;background:#3b82f6;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-bottom:24px">
      Renovar assinatura →
    </a>

    <hr style="border:none;border-top:1px solid #222;margin:24px 0">
    <p style="font-size:12px;color:#444;margin:0">Powered by Creators Link</p>
  </div>
</body>
</html>`,
  })
}
