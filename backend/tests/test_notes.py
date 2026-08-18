"""Integration tests for /api/v1/notes endpoints."""

from httpx import AsyncClient

BASE = "/api/v1/notes"

NOTE = {
    "title": "SSH Keys",
    "type": "technical",
    "content": "ssh-rsa AAAA... secret key content",
    "tags": "ssh,infra",
}


class TestCreateNote:
    async def test_success_returns_201(self, auth_client: AsyncClient):
        resp = await auth_client.post(BASE + "/", json=NOTE)
        assert resp.status_code == 201
        body = resp.json()
        assert body["title"] == "SSH Keys"
        assert body["type"] == "technical"

    async def test_content_not_returned_in_list_response(self, auth_client: AsyncClient):
        await auth_client.post(BASE + "/", json=NOTE)
        resp = await auth_client.get(BASE + "/")
        assert resp.status_code == 200
        item = resp.json()["items"][0]
        assert "content" not in item

    async def test_unauthenticated_returns_401(self, client: AsyncClient):
        resp = await client.post(BASE + "/", json=NOTE)
        assert resp.status_code == 401


class TestListNotes:
    async def test_empty_list(self, auth_client: AsyncClient):
        resp = await auth_client.get(BASE + "/")
        body = resp.json()
        assert body["items"] == []
        assert body["total"] == 0

    async def test_returns_created_notes(self, auth_client: AsyncClient):
        await auth_client.post(BASE + "/", json=NOTE)
        await auth_client.post(BASE + "/", json={**NOTE, "title": "DB Passwords"})
        resp = await auth_client.get(BASE + "/")
        assert resp.json()["total"] == 2

    async def test_filter_by_search_query(self, auth_client: AsyncClient):
        await auth_client.post(BASE + "/", json=NOTE)
        await auth_client.post(BASE + "/", json={**NOTE, "title": "DB Passwords"})
        resp = await auth_client.get(BASE + "/", params={"q": "db"})
        assert resp.json()["total"] == 1

    async def test_filter_favorites_only(self, auth_client: AsyncClient):
        r = await auth_client.post(BASE + "/", json=NOTE)
        await auth_client.post(BASE + "/", json={**NOTE, "title": "Other Note"})
        note_id = r.json()["id"]
        await auth_client.post(f"{BASE}/{note_id}/favorite")

        resp = await auth_client.get(BASE + "/", params={"favorites_only": True})
        body = resp.json()
        assert body["total"] == 1
        assert body["items"][0]["id"] == note_id


class TestGetNoteDetail:
    async def test_returns_decrypted_content(self, auth_client: AsyncClient):
        r = await auth_client.post(BASE + "/", json=NOTE)
        note_id = r.json()["id"]

        resp = await auth_client.get(f"{BASE}/{note_id}")
        assert resp.status_code == 200
        assert resp.json()["content"] == "ssh-rsa AAAA... secret key content"

    async def test_not_found_returns_404(self, auth_client: AsyncClient):
        resp = await auth_client.get(f"{BASE}/99999")
        assert resp.status_code == 404


class TestUpdateNote:
    async def test_updates_title(self, auth_client: AsyncClient):
        r = await auth_client.post(BASE + "/", json=NOTE)
        note_id = r.json()["id"]

        resp = await auth_client.put(f"{BASE}/{note_id}", json={"title": "SSH Keys (updated)"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "SSH Keys (updated)"

    async def test_not_found_returns_404(self, auth_client: AsyncClient):
        resp = await auth_client.put(f"{BASE}/99999", json={"title": "X"})
        assert resp.status_code == 404


class TestDeleteNote:
    async def test_deletes_and_returns_204(self, auth_client: AsyncClient):
        r = await auth_client.post(BASE + "/", json=NOTE)
        note_id = r.json()["id"]

        resp = await auth_client.delete(f"{BASE}/{note_id}")
        assert resp.status_code == 204

        resp = await auth_client.get(f"{BASE}/{note_id}")
        assert resp.status_code == 404

    async def test_not_found_returns_404(self, auth_client: AsyncClient):
        resp = await auth_client.delete(f"{BASE}/99999")
        assert resp.status_code == 404


class TestToggleFavoriteNote:
    async def test_toggles_is_favorite(self, auth_client: AsyncClient):
        r = await auth_client.post(BASE + "/", json=NOTE)
        note_id = r.json()["id"]
        assert r.json()["is_favorite"] is False

        resp = await auth_client.post(f"{BASE}/{note_id}/favorite")
        assert resp.status_code == 200
        assert resp.json()["is_favorite"] is True

        resp = await auth_client.post(f"{BASE}/{note_id}/favorite")
        assert resp.json()["is_favorite"] is False
