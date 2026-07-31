"""Hadith catalogue API tests."""
from fastapi.testclient import TestClient

from app.main import app


def test_list_collections():
    client = TestClient(app)
    resp = client.get("/api/v1/hadith/collections")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2
    slugs = {c["slug"] for c in data}
    assert "bukhari" in slugs
    assert "muslim" in slugs
    assert "nawawi40" in slugs
    bukhari = next(c for c in data if c["slug"] == "bukhari")
    assert bukhari["hadith_count"] > 0
    assert bukhari["chapter_count"] > 0
    assert bukhari["name_english"]


def test_list_chapters_and_hadiths():
    client = TestClient(app)
    chapters = client.get("/api/v1/hadith/collections/bukhari/chapters")
    assert chapters.status_code == 200
    chapter_list = chapters.json()
    assert len(chapter_list) >= 1
    chapter_id = chapter_list[0]["chapter_id"]

    items = client.get(
        f"/api/v1/hadith/collections/bukhari/chapters/{chapter_id}"
    )
    assert items.status_code == 200
    hadiths = items.json()
    assert len(hadiths) >= 1
    h = hadiths[0]
    assert h["collection_slug"] == "bukhari"
    assert h["arabic_text"]
    assert h["translation"]
    assert h["grade"]
    assert h["hadith_number"]
    assert h["chapter_name_english"]


def test_get_hadith_by_id():
    client = TestClient(app)
    items = client.get("/api/v1/hadith/collections/bukhari/chapters/1").json()
    hadith_id = items[0]["id"]
    resp = client.get(f"/api/v1/hadith/{hadith_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == hadith_id


def test_search_hadiths():
    client = TestClient(app)
    resp = client.get("/api/v1/hadith/search", params={"q": "intention"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any("intention" in r["translation"].lower() for r in data["results"])


def test_search_can_filter_by_collection():
    client = TestClient(app)
    resp = client.get(
        "/api/v1/hadith/search",
        params={"q": "intention", "collection": "nawawi40"},
    )
    assert resp.status_code == 200
    assert all(r["collection_slug"] == "nawawi40" for r in resp.json()["results"])


def test_unknown_collection_404():
    client = TestClient(app)
    assert client.get("/api/v1/hadith/collections/unknown").status_code == 404
