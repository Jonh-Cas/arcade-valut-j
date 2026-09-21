import { NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { name, email, msg } = (await request.json()) as {
    name?: string;
    email?: string;
    msg?: string;
  };

  if (!name?.trim() || !email?.trim() || !msg?.trim()) {
    return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: "El correo electrónico no es válido." }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.ADMIN_EMAIL!,
      subject: "Nuevo mensaje de contacto — Arcade Vault",
      text: `Nombre: ${name.trim()}\nCorreo: ${email.trim()}\n\nMensaje:\n${msg.trim()}`,
    });

    if (error) {
      return NextResponse.json({ error: "No se pudo enviar el mensaje." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo enviar el mensaje." }, { status: 500 });
  }
}
