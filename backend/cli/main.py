"""
pusaka — PUSAKA CLI

Usage:
  pusaka login                    Authenticate and store an API key
  pusaka list [--env ENV]         List credentials
  pusaka get <label>              Print the password for a credential
  pusaka set <label> <password>   Create or update a credential
  pusaka expiring [--days N]      List expiring credentials

Configuration is stored in ~/.pusaka/config.json.
"""

import json
import sys
from pathlib import Path

import click
import httpx

CONFIG_DIR = Path.home() / ".pusaka"
CONFIG_FILE = CONFIG_DIR / "config.json"

DEFAULT_API_URL = "http://localhost:8000"


# ---------------------------------------------------------------------------
# Config helpers
# ---------------------------------------------------------------------------


def load_config() -> dict:
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text())
    return {}


def save_config(data: dict) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(data, indent=2))
    CONFIG_FILE.chmod(0o600)


def get_api_url(cfg: dict) -> str:
    return cfg.get("api_url", DEFAULT_API_URL)


def auth_headers(cfg: dict) -> dict:
    key = cfg.get("api_key")
    if not key:
        click.echo("Not logged in. Run: pusaka login", err=True)
        sys.exit(1)
    return {"Authorization": f"Bearer {key}"}


# ---------------------------------------------------------------------------
# CLI group
# ---------------------------------------------------------------------------


@click.group()
@click.version_option("1.0.0", prog_name="pusaka")
def cli():
    """PUSAKA CLI — manage your vault credentials from the terminal."""
    pass


# ---------------------------------------------------------------------------
# login
# ---------------------------------------------------------------------------


@cli.command()
@click.option("--api-url", default=DEFAULT_API_URL, help="Backend API URL")
@click.option("--name", default="CLI key", help="Name for the generated API key")
@click.option("--scope", default="read", type=click.Choice(["read", "write"]), help="Key scope")
def login(api_url: str, name: str, scope: str):
    """Authenticate and store an API key locally."""
    username = click.prompt("Username")
    password = click.prompt("Password", hide_input=True)

    with httpx.Client(base_url=api_url) as client:
        # Log in to get a session cookie
        resp = client.post("/api/v1/auth/login", json={"username": username, "password": password})
        if resp.status_code != 200:
            click.echo(f"Login failed: {resp.json().get('detail', resp.text)}", err=True)
            sys.exit(1)

        # Create an API key using the session cookie
        cookie = resp.cookies.get("access_token")
        resp2 = client.post(
            "/api/v1/api-keys/",
            json={"name": name, "scope": scope},
            cookies={"access_token": cookie} if cookie else {},
        )
        if resp2.status_code != 201:
            click.echo(f"Failed to create API key: {resp2.json().get('detail', resp2.text)}", err=True)
            sys.exit(1)

        data = resp2.json()
        cfg = load_config()
        cfg["api_url"] = api_url
        cfg["api_key"] = data["key"]
        cfg["key_prefix"] = data["key_prefix"]
        cfg["scope"] = data["scope"]
        save_config(cfg)

    click.echo(f"Logged in. API key stored: {data['key_prefix']}… (scope: {scope})")
    click.echo(f"Config saved to {CONFIG_FILE}")


# ---------------------------------------------------------------------------
# list
# ---------------------------------------------------------------------------


@cli.command("list")
@click.option("--env", default=None, help="Filter by environment (dev/staging/prod/global)")
@click.option("--type", "cred_type", default=None, help="Filter by type")
@click.option("--limit", default=50, help="Max results")
def list_credentials(env: str | None, cred_type: str | None, limit: int):
    """List credentials in your vault."""
    cfg = load_config()
    params: dict = {"limit": limit}
    if env:
        params["env"] = env
    if cred_type:
        params["type"] = cred_type

    with httpx.Client(base_url=get_api_url(cfg)) as client:
        resp = client.get("/api/v1/credentials/", params=params, headers=auth_headers(cfg))
        if resp.status_code != 200:
            click.echo(f"Error: {resp.json().get('detail', resp.text)}", err=True)
            sys.exit(1)

        data = resp.json()
        items = data.get("items", [])

    if not items:
        click.echo("No credentials found.")
        return

    # Determine column widths
    max_label = max(len(c["label"]) for c in items)
    max_type = max(len(c["type"]) for c in items)
    max_env = max(len(c.get("env", "global")) for c in items)

    header = f"{'ID':>4}  {'LABEL':<{max_label}}  {'TYPE':<{max_type}}  {'ENV':<{max_env}}  USERNAME"
    click.echo(header)
    click.echo("-" * len(header))

    for c in items:
        username = c.get("username") or c.get("email") or ""
        click.echo(
            f"{c['id']:>4}  {c['label']:<{max_label}}  {c['type']:<{max_type}}  "
            f"{c.get('env', 'global'):<{max_env}}  {username}"
        )

    click.echo(f"\n{data['total']} total credential(s)")


# ---------------------------------------------------------------------------
# get
# ---------------------------------------------------------------------------


@cli.command()
@click.argument("label")
@click.option("--field", default="password", type=click.Choice(["password", "secret_key", "username", "email"]),
              help="Which field to output")
@click.option("--id", "cred_id", default=None, type=int, help="Use credential ID instead of label search")
def get(label: str, field: str, cred_id: int | None):
    """Print the password (or other field) for a credential. Suitable for scripting."""
    cfg = load_config()

    with httpx.Client(base_url=get_api_url(cfg)) as client:
        if cred_id:
            resp = client.get(f"/api/v1/credentials/{cred_id}", headers=auth_headers(cfg))
            if resp.status_code != 200:
                click.echo(f"Error: {resp.json().get('detail', resp.text)}", err=True)
                sys.exit(1)
            cred = resp.json()
        else:
            # Search by label
            resp = client.get(
                "/api/v1/credentials/",
                params={"q": label, "limit": 10},
                headers=auth_headers(cfg),
            )
            items = resp.json().get("items", [])
            matches = [c for c in items if c["label"].lower() == label.lower()]
            if not matches:
                matches = items  # fuzzy fallback

            if not matches:
                click.echo(f"No credential found matching '{label}'", err=True)
                sys.exit(1)

            if len(matches) > 1:
                click.echo(f"Multiple credentials match '{label}':", err=True)
                for c in matches:
                    click.echo(f"  {c['id']:>4}  {c['label']}", err=True)
                click.echo("Use --id to specify one.", err=True)
                sys.exit(1)

            # Fetch detail (includes decrypted fields)
            resp2 = client.get(f"/api/v1/credentials/{matches[0]['id']}", headers=auth_headers(cfg))
            if resp2.status_code != 200:
                click.echo(f"Error: {resp2.json().get('detail', resp2.text)}", err=True)
                sys.exit(1)
            cred = resp2.json()

    value = cred.get(field)
    if value is None:
        click.echo(f"Field '{field}' is empty for this credential.", err=True)
        sys.exit(1)

    # Print without trailing newline so it's pipe-friendly: eval $(cm get MY_KEY)
    click.echo(value, nl=False)


# ---------------------------------------------------------------------------
# set
# ---------------------------------------------------------------------------


@cli.command()
@click.argument("label")
@click.argument("password")
@click.option("--type", "cred_type", default="other", help="Credential type")
@click.option("--env", default="global", type=click.Choice(["dev", "staging", "prod", "global"]))
@click.option("--username", default=None)
@click.option("--url", default=None, help="Website URL")
def set(label: str, password: str, cred_type: str, env: str, username: str | None, url: str | None):
    """Create a new credential. Use 'cm get' to read it back."""
    cfg = load_config()

    if cfg.get("scope") == "read":
        click.echo("Error: your API key has read-only scope. Re-run 'pusaka login --scope write'.", err=True)
        sys.exit(1)

    payload = {
        "label": label,
        "password": password,
        "type": cred_type,
        "env": env,
    }
    if username:
        payload["username"] = username
    if url:
        payload["website_url"] = url

    with httpx.Client(base_url=get_api_url(cfg)) as client:
        resp = client.post("/api/v1/credentials/", json=payload, headers=auth_headers(cfg))
        if resp.status_code == 201:
            click.echo(f"Created: {resp.json()['label']} (id={resp.json()['id']})")
        else:
            click.echo(f"Error: {resp.json().get('detail', resp.text)}", err=True)
            sys.exit(1)


# ---------------------------------------------------------------------------
# expiring
# ---------------------------------------------------------------------------


@cli.command()
@click.option("--days", default=30, help="Look ahead this many days")
def expiring(days: int):
    """List credentials expiring within the next N days."""
    cfg = load_config()

    with httpx.Client(base_url=get_api_url(cfg)) as client:
        resp = client.get(
            "/api/v1/credentials/expiring",
            params={"days": days},
            headers=auth_headers(cfg),
        )
        if resp.status_code != 200:
            click.echo(f"Error: {resp.json().get('detail', resp.text)}", err=True)
            sys.exit(1)

        items = resp.json()

    if not items:
        click.echo(f"No credentials expiring within {days} days.")
        return

    click.echo(f"Credentials expiring within {days} days:\n")
    for c in items:
        click.echo(f"  {c['id']:>4}  {c['label']:<30}  expires: {c['expires_at'][:10]}")


if __name__ == "__main__":
    cli()
