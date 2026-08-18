"""Integration tests for /api/v1/orgs — organizations, members, shared vaults, shared credentials."""

from httpx import AsyncClient

BASE = "/api/v1/orgs"

ORG_PAYLOAD = {"name": "Acme Inc", "slug": "acme"}

SECOND_USER = {
    "username": "bob",
    "email": "bob@example.com",
    "first_name": "Bob",
    "last_name": "Builder",
    "password": "bobpassword",
}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


async def register_and_login(client: AsyncClient, user: dict) -> None:
    """Register a second user and return client with that user's cookie."""
    await client.post("/api/v1/auth/register", json=user)


async def create_org(client: AsyncClient) -> dict:
    resp = await client.post(f"{BASE}/", json=ORG_PAYLOAD)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Organization CRUD
# ---------------------------------------------------------------------------


class TestOrgCrud:
    async def test_create_org(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{BASE}/", json=ORG_PAYLOAD)
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "Acme Inc"
        assert body["slug"] == "acme"
        assert body["plan"] == "free"

    async def test_duplicate_slug_returns_400(self, auth_client: AsyncClient, db_session):
        await auth_client.post(f"{BASE}/", json=ORG_PAYLOAD)
        resp = await auth_client.post(f"{BASE}/", json={"name": "Other", "slug": "acme"})
        assert resp.status_code == 400

    async def test_invalid_slug_returns_422(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{BASE}/", json={"name": "Bad", "slug": "bad slug!"})
        assert resp.status_code == 422

    async def test_list_orgs(self, auth_client: AsyncClient, db_session):
        await create_org(auth_client)
        resp = await auth_client.get(f"{BASE}/")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_get_org(self, auth_client: AsyncClient, db_session):
        org = await create_org(auth_client)
        resp = await auth_client.get(f"{BASE}/{org['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == org["id"]

    async def test_update_org_name(self, auth_client: AsyncClient, db_session):
        org = await create_org(auth_client)
        resp = await auth_client.put(f"{BASE}/{org['id']}", json={"name": "Updated Name"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"

    async def test_delete_org(self, auth_client: AsyncClient, db_session):
        org = await create_org(auth_client)
        resp = await auth_client.delete(f"{BASE}/{org['id']}")
        assert resp.status_code == 204

        resp = await auth_client.get(f"{BASE}/{org['id']}")
        assert resp.status_code == 404  # org deleted

    async def test_non_member_cannot_access_org(self, client: AsyncClient, db_session):
        # Register owner
        await client.post("/api/v1/auth/register", json={
            "username": "alice", "email": "alice@example.com",
            "first_name": "Alice", "last_name": "A", "password": "password123"
        })
        org = (await client.post(f"{BASE}/", json=ORG_PAYLOAD)).json()

        # Register & login as stranger
        await client.post("/api/v1/auth/register", json=SECOND_USER)
        client.cookies.clear()
        await client.post("/api/v1/auth/login", json={"username": "bob", "password": "bobpassword"})

        resp = await client.get(f"{BASE}/{org['id']}")
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Members & invite flow
# ---------------------------------------------------------------------------


class TestMemberInvite:
    async def test_invite_creates_pending_member(self, auth_client: AsyncClient, db_session):
        org = await create_org(auth_client)
        resp = await auth_client.post(f"{BASE}/{org['id']}/invite", json={"email": "bob@example.com", "role": "member"})
        assert resp.status_code == 201
        body = resp.json()
        assert body["invited_email"] == "bob@example.com"
        assert body["invite_accepted_at"] is None

    async def test_list_members_includes_owner(self, auth_client: AsyncClient, db_session):
        org = await create_org(auth_client)
        resp = await auth_client.get(f"{BASE}/{org['id']}/members")
        assert resp.status_code == 200
        members = resp.json()
        assert len(members) == 1
        assert members[0]["role"] == "owner"

    async def test_accept_invite_flow(self, client: AsyncClient, db_session):
        """Owner invites Bob → Bob registers → Bob accepts invite → Bob can access org."""
        from app.models.models import OrganizationMember
        from sqlalchemy import select

        # Alice registers and creates org
        await client.post("/api/v1/auth/register", json={
            "username": "alice", "email": "alice@example.com",
            "first_name": "Alice", "last_name": "A", "password": "password123"
        })
        org = (await client.post(f"{BASE}/", json=ORG_PAYLOAD)).json()

        # Alice invites Bob
        await client.post(f"{BASE}/{org['id']}/invite", json={"email": "bob@example.com", "role": "member"})

        # Get the invite token from DB
        member_row = await db_session.scalar(
            select(OrganizationMember).where(OrganizationMember.invited_email == "bob@example.com")
        )
        token = member_row.invite_token
        assert token is not None

        # Bob registers
        client.cookies.clear()
        await client.post("/api/v1/auth/register", json=SECOND_USER)

        # Bob accepts
        resp = await client.post(f"{BASE}/accept-invite", params={"token": token})
        assert resp.status_code == 200
        assert resp.json()["invite_accepted_at"] is not None

        # Bob can now list org members
        resp = await client.get(f"{BASE}/{org['id']}/members")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    async def test_wrong_user_cannot_accept_invite(self, client: AsyncClient, db_session):
        """An invite sent to alice@example.com cannot be accepted by bob."""
        from app.models.models import OrganizationMember
        from sqlalchemy import select

        await client.post("/api/v1/auth/register", json={
            "username": "alice", "email": "alice@example.com",
            "first_name": "Alice", "last_name": "A", "password": "password123"
        })
        org = (await client.post(f"{BASE}/", json=ORG_PAYLOAD)).json()
        await client.post(f"{BASE}/{org['id']}/invite", json={"email": "other@example.com", "role": "member"})

        member_row = await db_session.scalar(
            select(OrganizationMember).where(OrganizationMember.invited_email == "other@example.com")
        )
        token = member_row.invite_token

        # Bob registers and tries to accept alice's invite
        client.cookies.clear()
        await client.post("/api/v1/auth/register", json=SECOND_USER)

        resp = await client.post(f"{BASE}/accept-invite", params={"token": token})
        assert resp.status_code == 403

    async def test_remove_member(self, auth_client: AsyncClient, db_session):
        """Owner invites Bob (with existing account), accepts invite, owner removes Bob."""
        from app.models.models import OrganizationMember
        from sqlalchemy import select

        # Register Bob in same client session
        # (we need two separate sessions; this is simpler with the shared client)
        # Use direct DB insertion to create Bob as accepted member
        from app.models.models import User as UserModel
        from app.core.security import hash_password
        from datetime import UTC, datetime as dt

        bob = UserModel(
            username="bob", email="bob@example.com",
            first_name="Bob", last_name="B",
            hashed_password=hash_password("bobpassword"),
            vault_salt="a" * 64, vault_key_encrypted="x", vault_key_recovery_encrypted="x",
        )
        db_session.add(bob)
        await db_session.flush()

        org = await create_org(auth_client)

        member = OrganizationMember(
            org_id=org["id"], user_id=bob.id, role="member",
            invited_email=bob.email, invite_accepted_at=dt.now(UTC),
        )
        db_session.add(member)
        await db_session.commit()
        await db_session.refresh(member)

        resp = await auth_client.delete(f"{BASE}/{org['id']}/members/{bob.id}")
        assert resp.status_code == 204

    async def test_cannot_remove_owner(self, auth_client: AsyncClient, db_session):
        from app.models.models import User as UserModel
        from sqlalchemy import select

        org = await create_org(auth_client)
        # Find owner user_id
        me = (await auth_client.get("/api/v1/auth/me")).json()
        resp = await auth_client.delete(f"{BASE}/{org['id']}/members/{me['id']}")
        assert resp.status_code == 400

    async def test_update_member_role(self, auth_client: AsyncClient, db_session):
        from app.models.models import OrganizationMember, User as UserModel
        from app.core.security import hash_password
        from datetime import UTC, datetime as dt

        bob = UserModel(
            username="bob", email="bob@example.com",
            first_name="Bob", last_name="B",
            hashed_password=hash_password("bobpassword"),
            vault_salt="a" * 64, vault_key_encrypted="x", vault_key_recovery_encrypted="x",
        )
        db_session.add(bob)
        await db_session.flush()

        org = await create_org(auth_client)
        member = OrganizationMember(
            org_id=org["id"], user_id=bob.id, role="member",
            invited_email=bob.email, invite_accepted_at=dt.now(UTC),
        )
        db_session.add(member)
        await db_session.commit()

        resp = await auth_client.put(f"{BASE}/{org['id']}/members/{bob.id}/role", json={"role": "admin"})
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"


# ---------------------------------------------------------------------------
# Shared Vaults
# ---------------------------------------------------------------------------


class TestSharedVaults:
    async def test_create_vault(self, auth_client: AsyncClient, db_session):
        org = await create_org(auth_client)
        resp = await auth_client.post(f"{BASE}/{org['id']}/vaults", json={"name": "Dev Secrets"})
        assert resp.status_code == 201
        assert resp.json()["name"] == "Dev Secrets"

    async def test_list_vaults(self, auth_client: AsyncClient, db_session):
        org = await create_org(auth_client)
        await auth_client.post(f"{BASE}/{org['id']}/vaults", json={"name": "Vault A"})
        await auth_client.post(f"{BASE}/{org['id']}/vaults", json={"name": "Vault B"})
        resp = await auth_client.get(f"{BASE}/{org['id']}/vaults")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    async def test_update_vault(self, auth_client: AsyncClient, db_session):
        org = await create_org(auth_client)
        vault = (await auth_client.post(f"{BASE}/{org['id']}/vaults", json={"name": "Old Name"})).json()
        resp = await auth_client.put(f"{BASE}/{org['id']}/vaults/{vault['id']}", json={"name": "New Name"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"

    async def test_delete_vault(self, auth_client: AsyncClient, db_session):
        org = await create_org(auth_client)
        vault = (await auth_client.post(f"{BASE}/{org['id']}/vaults", json={"name": "Temp"})).json()
        resp = await auth_client.delete(f"{BASE}/{org['id']}/vaults/{vault['id']}")
        assert resp.status_code == 204


# ---------------------------------------------------------------------------
# Shared credentials (add → list → detail → remove)
# ---------------------------------------------------------------------------


class TestSharedCredentials:
    async def _setup(self, auth_client: AsyncClient, db_session):
        """Create org + vault + personal credential; return (org, vault, cred) dicts."""
        org = await create_org(auth_client)
        vault = (await auth_client.post(f"{BASE}/{org['id']}/vaults", json={"name": "Team Creds"})).json()
        cred = (await auth_client.post("/api/v1/credentials/", json={
            "label": "GitHub", "type": "website",
            "username": "testuser", "password": "ghtoken123",
        })).json()
        return org, vault, cred

    async def test_add_credential_to_vault(self, auth_client: AsyncClient, db_session):
        org, vault, cred = await self._setup(auth_client, db_session)
        resp = await auth_client.post(
            f"{BASE}/{org['id']}/vaults/{vault['id']}/credentials/{cred['id']}"
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["label"] == "GitHub"
        assert body["credential_id"] == cred["id"]

    async def test_list_shared_credentials(self, auth_client: AsyncClient, db_session):
        org, vault, cred = await self._setup(auth_client, db_session)
        await auth_client.post(f"{BASE}/{org['id']}/vaults/{vault['id']}/credentials/{cred['id']}")
        resp = await auth_client.get(f"{BASE}/{org['id']}/vaults/{vault['id']}/credentials")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_get_shared_credential_detail_decrypts_password(self, auth_client: AsyncClient, db_session):
        org, vault, cred = await self._setup(auth_client, db_session)
        sc = (await auth_client.post(
            f"{BASE}/{org['id']}/vaults/{vault['id']}/credentials/{cred['id']}"
        )).json()
        resp = await auth_client.get(
            f"{BASE}/{org['id']}/vaults/{vault['id']}/credentials/{sc['id']}"
        )
        assert resp.status_code == 200
        assert resp.json()["password"] == "ghtoken123"

    async def test_remove_credential_from_vault(self, auth_client: AsyncClient, db_session):
        org, vault, cred = await self._setup(auth_client, db_session)
        sc = (await auth_client.post(
            f"{BASE}/{org['id']}/vaults/{vault['id']}/credentials/{cred['id']}"
        )).json()
        resp = await auth_client.delete(
            f"{BASE}/{org['id']}/vaults/{vault['id']}/credentials/{sc['id']}"
        )
        assert resp.status_code == 204

        resp = await auth_client.get(f"{BASE}/{org['id']}/vaults/{vault['id']}/credentials")
        assert resp.json() == []


# ---------------------------------------------------------------------------
# RBAC enforcement
# ---------------------------------------------------------------------------


class TestRBAC:
    async def test_viewer_cannot_create_vault(self, client: AsyncClient, db_session):
        """A viewer org member cannot create vaults (requires admin)."""
        from app.models.models import OrganizationMember
        from sqlalchemy import select
        from datetime import UTC, datetime as dt

        # Alice registers and creates org
        await client.post("/api/v1/auth/register", json={
            "username": "alice", "email": "alice@example.com",
            "first_name": "Alice", "last_name": "A", "password": "password123"
        })
        org = (await client.post(f"{BASE}/", json=ORG_PAYLOAD)).json()

        # Bob registers
        client.cookies.clear()
        await client.post("/api/v1/auth/register", json=SECOND_USER)
        bob_me = (await client.get("/api/v1/auth/me")).json()

        # Alice invites Bob (to get a member row), then we directly set role to viewer
        client.cookies.clear()
        await client.post("/api/v1/auth/login", json={"username": "alice", "password": "password123"})
        invite_resp = await client.post(
            f"{BASE}/{org['id']}/invite",
            json={"email": "bob@example.com", "role": "member"},
        )
        member_row = await db_session.scalar(
            select(OrganizationMember).where(OrganizationMember.invited_email == "bob@example.com")
        )
        token = member_row.invite_token

        # Bob accepts
        client.cookies.clear()
        await client.post("/api/v1/auth/login", json={"username": "bob", "password": "bobpassword"})
        await client.post(f"{BASE}/accept-invite", params={"token": token})

        # Change Bob's role to viewer directly in DB
        await db_session.refresh(member_row)
        member_row.role = "viewer"
        await db_session.commit()

        # Bob tries to create a vault (requires admin) → 403
        resp = await client.post(f"{BASE}/{org['id']}/vaults", json={"name": "Secret"})
        assert resp.status_code == 403
