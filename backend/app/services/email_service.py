def send_password_reset_email(email: str, token: str) -> None:
    print(f"Password reset for {email}: {token}")
