import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _build_welcome_html(name: str, role: str, email: str, dashboard_url: str) -> str:
    role_label = role.replace("_", " ").title()
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 18px 60px rgba(17,24,39,0.06)">
<tr><td style="background:linear-gradient(135deg,#6C4CF1,#3B82F6);padding:40px 32px;text-align:center">
<table align="center" cellpadding="0" cellspacing="0"><tr>
<td style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:14px;text-align:center;vertical-align:middle;font-size:20px;font-weight:900;color:#ffffff;line-height:48px">AI</td>
<td style="padding-left:12px;font-size:22px;font-weight:700;color:#ffffff">CampusOS</td>
</tr></table>
<h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:24px 0 8px">Welcome to AI CampusOS</h1>
<p style="color:rgba(255,255,255,0.9);font-size:16px;margin:0">Your intelligent campus workspace is ready.</p>
</td></tr>
<tr><td style="padding:40px 32px">
<p style="font-size:18px;color:#111827;font-weight:600;margin:0 0 4px">Hi {name},</p>
<p style="font-size:15px;color:#6B7280;line-height:1.6;margin:12px 0 24px">Welcome to <strong style="color:#111827">AI CampusOS</strong>! Your account has been created successfully as a <strong style="color:#6C4CF1">{role_label}</strong>.</p>
<table cellpadding="0" cellspacing="0" style="width:100%;background:#F8FAFC;border-radius:14px;padding:20px;margin:0 0 28px">
<tr><td style="font-size:14px;color:#6B7280;padding-bottom:6px">Registered Role</td></tr>
<tr><td style="font-size:16px;color:#111827;font-weight:600">{role_label}</td></tr>
<tr><td style="font-size:14px;color:#6B7280;padding:12px 0 6px">Email</td></tr>
<tr><td style="font-size:15px;color:#111827">{email}</td></tr>
</table>
<p style="font-size:15px;color:#6B7280;line-height:1.6;margin:0 0 28px">You now have access to AI-powered insights, role-based dashboards, and real-time analytics tailored to your workspace. Start exploring and unlock the full potential of your campus experience.</p>
<table align="center" cellpadding="0" cellspacing="0"><tr>
<td style="background:linear-gradient(135deg,#6C4CF1,#3B82F6);border-radius:12px;padding:0"><a href="{dashboard_url}" style="display:inline-block;padding:14px 36px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">Go to Dashboard</a></td>
</tr></table>
</td></tr>
<tr><td style="background:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E5E7EB">
<p style="font-size:13px;color:#9CA3AF;margin:0">AI CampusOS &mdash; Empowering education with intelligence.</p>
</td></tr>
</table>
</body>
</html>"""


def _build_reset_html(name: str, reset_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 18px 60px rgba(17,24,39,0.06)">
<tr><td style="background:linear-gradient(135deg,#6C4CF1,#3B82F6);padding:40px 32px;text-align:center">
<table align="center" cellpadding="0" cellspacing="0"><tr>
<td style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:14px;text-align:center;vertical-align:middle;font-size:20px;font-weight:900;color:#ffffff;line-height:48px">AI</td>
<td style="padding-left:12px;font-size:22px;font-weight:700;color:#ffffff">CampusOS</td>
</tr></table>
<h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:24px 0 8px">Reset your password</h1>
<p style="color:rgba(255,255,255,0.9);font-size:16px;margin:0">We received your password reset request.</p>
</td></tr>
<tr><td style="padding:40px 32px">
<p style="font-size:18px;color:#111827;font-weight:600;margin:0 0 4px">Hi {name},</p>
<p style="font-size:15px;color:#6B7280;line-height:1.6;margin:12px 0 24px">We received a request to reset the password for your <strong style="color:#111827">AI CampusOS</strong> account. Click the button below to set a new password.</p>
<table align="center" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr>
<td style="background:linear-gradient(135deg,#6C4CF1,#3B82F6);border-radius:12px;padding:0"><a href="{reset_url}" style="display:inline-block;padding:14px 36px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">Reset Password</a></td>
</tr></table>
<table cellpadding="0" cellspacing="0" style="width:100%;background:#FFF7ED;border-radius:14px;padding:16px 20px;margin:0 0 24px">
<tr><td style="font-size:13px;color:#9A3412"><strong>⚠ Expiry notice:</strong> This reset link will expire in <strong>15 minutes</strong>.</td></tr>
</table>
<p style="font-size:14px;color:#9CA3AF;line-height:1.6;margin:0;padding:16px 0 0;border-top:1px solid #E5E7EB">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
</td></tr>
<tr><td style="background:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E5E7EB">
<p style="font-size:13px;color:#9CA3AF;margin:0">AI CampusOS &mdash; Empowering education with intelligence.</p>
</td></tr>
</table>
</body>
</html>"""


def _send_email(to_email: str, subject: str, html: str) -> bool:
    settings = get_settings()

    if not settings.smtp_host:
        logger.error("SMTP_HOST not configured")
        return False
    if not settings.smtp_user:
        logger.error("SMTP_USER not configured")
        return False
    if not settings.smtp_password:
        logger.error("SMTP_PASSWORD not configured - set SMTP_PASSWORD in .env or docker-compose environment")
        return False
    if not settings.smtp_from:
        logger.error("SMTP_FROM not configured")
        return False

    logger.info("Connecting to SMTP %s:%s as %s", settings.smtp_host, settings.smtp_port, settings.smtp_user)

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))

    try:
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30)
        server.set_debuglevel(0)
        if settings.smtp_tls:
            logger.info("Starting TLS...")
            server.starttls()
        logger.info("Logging in to SMTP...")
        server.login(settings.smtp_user, settings.smtp_password)
        logger.info("SMTP login successful, sending email to %s...", to_email)
        server.sendmail(settings.smtp_from, [to_email], msg.as_string())
        server.quit()
        logger.info("Email sent successfully to %s: %s", to_email, subject)
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed for user %s - check SMTP_USER and SMTP_PASSWORD", settings.smtp_user)
        return False
    except smtplib.SMTPConnectError:
        logger.error("SMTP connection failed to %s:%s - check SMTP_HOST and SMTP_PORT", settings.smtp_host, settings.smtp_port)
        return False
    except smtplib.SMTPException as exc:
        logger.error("SMTP error: %s", exc)
        return False
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


def send_welcome_email(email: str, name: str, role: str) -> bool:
    settings = get_settings()
    dashboard_url = f"{settings.frontend_url}/login"
    html = _build_welcome_html(name, role, email, dashboard_url)
    return _send_email(email, "Welcome to AI CampusOS \U0001f680", html)


def send_password_reset_email(email: str, token: str, name: Optional[str] = None) -> bool:
    settings = get_settings()
    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    display_name = name or email.split("@")[0]
    html = _build_reset_html(display_name, reset_url)
    return _send_email(email, "Reset your AI CampusOS password", html)


def send_test_email(email: str) -> bool:
    subject = "AI CampusOS SMTP Test"
    html = """<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 18px 60px rgba(17,24,39,0.06)">
<tr><td style="background:linear-gradient(135deg,#6C4CF1,#3B82F6);padding:40px 32px;text-align:center">
<h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0">SMTP is working.</h1>
</td></tr>
<tr><td style="padding:32px;text-align:center">
<p style="font-size:16px;color:#6B7280;line-height:1.6;margin:0">Your AI CampusOS email configuration is working correctly.</p>
</td></tr>
</table>
</body>
</html>"""
    return _send_email(email, subject, html)
