"""Integration tests for /api/v1/credentials endpoints."""

from httpx import AsyncClient

BASE = "/api/v1/credentials"

CRED = {
    "label": "GitHub",
    "type": "website",
    "website_url": "https://github.com",
    "username": "alice",
    "password": "ghp_secret123",
}


class TestCreateCredential:
    async def test_success_returns_201(self, auth_client: AsyncClient):
        resp = await auth_client.post(BASE + "/", json=CRED)
        assert resp.status_code == 201
        body = resp.json()
        assert body["label"] == "GitHub"
        assert body["type"] == "website"

    async def test_password_not_returned_in_list_response(self, auth_client: AsyncClient):
        await auth_client.post(BASE + "/", json=CRED)
        resp = await auth_client.get(BASE + "/")
        assert resp.status_code == 200
        item = resp.json()["items"][0]
        assert "password" not in item

    async def test_unauthenticated_returns_401(self, client: AsyncClient):
        resp = await client.post(BASE + "/", json=CRED)
        assert resp.status_code == 401


class TestListCredentials:
    async def test_empty_list(self, auth_client: AsyncClient):
        resp = await auth_client.get(BASE + "/")
        assert resp.status_code == 200
        body = resp.json()
        assert body["items"] == []
        assert body["total"] == 0

    async def test_returns_created_credentials(self, auth_client: AsyncClient):
        await auth_client.post(BASE + "/", json=CRED)
        await auth_client.post(BASE + "/", json={**CRED, "label": "GitLab"})
        resp = await auth_client.get(BASE + "/")
        assert resp.status_code == 200
        assert resp.json()["total"] == 2

    async def test_filter_by_type(self, auth_client: AsyncClient):
        await auth_client.post(BASE + "/", json=CRED)
        await auth_client.post(BASE + "/", json={**CRED, "label": "API Key", "type": "api"})
        resp = await auth_client.get(BASE + "/", params={"type": "api"})
        body = resp.json()
        assert body["total"] == 1
        assert body["items"][0]["label"] == "API Key"

    async def test_filter_by_search_query(self, auth_client: AsyncClient):
        await auth_client.post(BASE + "/", json=CRED)
        await auth_client.post(BASE + "/", json={**CRED, "label": "AWS S3"})
        resp = await auth_client.get(BASE + "/", params={"q": "aws"})
        assert resp.json()["total"] == 1

    async def test_filter_favorites_only(self, auth_client: AsyncClient):
        r1 = await auth_client.post(BASE + "/", json=CRED)
        r2 = await auth_client.post(BASE + "/", json={**CRED, "label": "GitLab"})
        cred_id = r1.json()["id"]
        await auth_client.post(f"{BASE}/{cred_id}/favorite")

        resp = await auth_client.get(BASE + "/", params={"favorites_only": True})
        body = resp.json()
        assert body["total"] == 1
        assert body["items"][0]["id"] == cred_id

        _ = r2  # GitLab not favorited, not in results


class TestGetCredentialDetail:
    async def test_returns_decrypted_password(self, auth_client: AsyncClient):
        create_resp = await auth_client.post(BASE + "/", json=CRED)
        cred_id = create_resp.json()["id"]

        resp = await auth_client.get(f"{BASE}/{cred_id}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["password"] == "ghp_secret123"
        assert body["label"] == "GitHub"

    async def test_not_found_returns_404(self, auth_client: AsyncClient):
        resp = await auth_client.get(f"{BASE}/99999")
        assert resp.status_code == 404

    async def test_other_users_credential_returns_404(self, client: AsyncClient):
        """User A cannot access User B's credential."""
        # Register and create as User B
        await client.post("/api/v1/auth/register", json={
            "username": "userb", "email": "b@example.com",
            "first_name": "B", "last_name": "User", "password": "password123",
        })
        r = await client.post(BASE + "/", json=CRED)
        cred_id = r.json()["id"]

        # Register and log in as User A
        client.cookies.clear()
        await client.post("/api/v1/auth/register", json={
            "username": "usera", "email": "a@example.com",
            "first_name": "A", "last_name": "User", "password": "password123",
        })

        resp = await client.get(f"{BASE}/{cred_id}")
        assert resp.status_code == 404


class TestUpdateCredential:
    async def test_updates_label(self, auth_client: AsyncClient):
        r = await auth_client.post(BASE + "/", json=CRED)
        cred_id = r.json()["id"]

        resp = await auth_client.put(f"{BASE}/{cred_id}", json={"label": "GitHub (work)"})
        assert resp.status_code == 200
        assert resp.json()["label"] == "GitHub (work)"

    async def test_not_found_returns_404(self, auth_client: AsyncClient):
        resp = await auth_client.put(f"{BASE}/99999", json={"label": "X"})
        assert resp.status_code == 404


class TestDeleteCredential:
    async def test_deletes_and_returns_204(self, auth_client: AsyncClient):
        r = await auth_client.post(BASE + "/", json=CRED)
        cred_id = r.json()["id"]

        resp = await auth_client.delete(f"{BASE}/{cred_id}")
        assert resp.status_code == 204

        resp = await auth_client.get(f"{BASE}/{cred_id}")
        assert resp.status_code == 404

    async def test_not_found_returns_404(self, auth_client: AsyncClient):
        resp = await auth_client.delete(f"{BASE}/99999")
        assert resp.status_code == 404


class TestToggleFavorite:
    async def test_toggles_is_favorite(self, auth_client: AsyncClient):
        r = await auth_client.post(BASE + "/", json=CRED)
        cred_id = r.json()["id"]
        assert r.json()["is_favorite"] is False

        resp = await auth_client.post(f"{BASE}/{cred_id}/favorite")
        assert resp.status_code == 200
        assert resp.json()["is_favorite"] is True

        resp = await auth_client.post(f"{BASE}/{cred_id}/favorite")
        assert resp.json()["is_favorite"] is False
