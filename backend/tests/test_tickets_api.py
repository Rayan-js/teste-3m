import pytest

VALID_PAYLOAD = {
    "title": "Impressora sem conexão",
    "description": "A impressora do 2º andar não aparece mais na rede.",
    "category": "it",
    "priority": "medium",
}


def create_ticket(client, **overrides):
    response = client.post("/api/tickets", json={**VALID_PAYLOAD, **overrides})
    assert response.status_code == 201, response.text
    return response.json()


def change_status(client, ticket_id, status):
    return client.patch(f"/api/tickets/{ticket_id}/status", json={"status": status})


def list_ids(client, **params):
    response = client.get("/api/tickets", params=params)
    assert response.status_code == 200, response.text
    return [ticket["id"] for ticket in response.json()["items"]]


class TestCreateTicket:
    def test_new_ticket_starts_open_with_creation_in_history(self, client):
        ticket = create_ticket(client)

        assert ticket["status"] == "open"
        assert ticket["allowed_transitions"] == ["in_progress"]
        assert [(h["from_status"], h["to_status"]) for h in ticket["history"]] == [(None, "open")]

    def test_ticket_is_persisted_and_location_header_points_to_it(self, client):
        response = client.post("/api/tickets", json=VALID_PAYLOAD)
        location = response.headers["location"]

        fetched = client.get(location)

        assert fetched.status_code == 200
        assert fetched.json()["title"] == VALID_PAYLOAD["title"]

    def test_timestamps_are_returned_in_utc(self, client):
        ticket = create_ticket(client)

        assert ticket["created_at"].endswith("Z")

    def test_surrounding_whitespace_is_trimmed(self, client):
        ticket = create_ticket(client, title="   Monitor piscando   ")

        assert ticket["title"] == "Monitor piscando"

    @pytest.mark.parametrize(
        ("field", "value"),
        [
            ("title", "   "),
            ("title", "x" * 121),
            ("description", "curta"),
            ("category", "marketing"),
            ("priority", "critical"),
        ],
    )
    def test_rejects_invalid_payload(self, client, field, value):
        response = client.post("/api/tickets", json={**VALID_PAYLOAD, field: value})

        assert response.status_code == 422
        assert response.json()["detail"][0]["loc"][-1] == field


class TestListTickets:
    def test_filters_by_status_category_and_priority(self, client):
        it_high = create_ticket(client, category="it", priority="high")
        hr_high = create_ticket(client, category="hr", priority="high")
        it_low = create_ticket(client, category="it", priority="low")
        change_status(client, it_low["id"], "in_progress")

        assert set(list_ids(client, category="it")) == {it_high["id"], it_low["id"]}
        assert set(list_ids(client, priority="high")) == {it_high["id"], hr_high["id"]}
        assert list_ids(client, status="in_progress") == [it_low["id"]]
        assert list_ids(client, category="it", priority="high") == [it_high["id"]]

    def test_sorts_by_priority_using_urgency_not_alphabetical_order(self, client):
        for priority in ["medium", "urgent", "low", "high"]:
            create_ticket(client, priority=priority)

        response = client.get("/api/tickets", params={"sort_by": "priority", "order": "desc"})

        priorities = [ticket["priority"] for ticket in response.json()["items"]]
        assert priorities == ["urgent", "high", "medium", "low"]

    def test_same_priority_lists_oldest_ticket_first(self, client):
        older = create_ticket(client, priority="high")
        newer = create_ticket(client, priority="high")

        assert list_ids(client, sort_by="priority", order="desc") == [older["id"], newer["id"]]

    def test_sorts_by_creation_date(self, client):
        first = create_ticket(client)
        second = create_ticket(client)

        assert list_ids(client) == [second["id"], first["id"]]
        assert list_ids(client, sort_by="created_at", order="asc") == [first["id"], second["id"]]

    def test_paginates_results(self, client):
        for _ in range(5):
            create_ticket(client)

        body = client.get("/api/tickets", params={"page": 3, "page_size": 2}).json()

        assert body["total"] == 5
        assert body["page"] == 3
        assert len(body["items"]) == 1

    @pytest.mark.parametrize(
        "params",
        [{"status": "archived"}, {"sort_by": "title"}, {"page": 0}, {"page_size": 500}],
    )
    def test_rejects_invalid_query_params(self, client, params):
        assert client.get("/api/tickets", params=params).status_code == 422


class TestTicketDetail:
    def test_returns_404_for_unknown_ticket(self, client):
        response = client.get("/api/tickets/999")

        assert response.status_code == 404
        assert "999" in response.json()["detail"]


class TestStatusWorkflow:
    def test_full_workflow_is_recorded_in_history(self, client):
        ticket = create_ticket(client)

        for status in ["in_progress", "resolved", "closed"]:
            response = change_status(client, ticket["id"], status)
            assert response.status_code == 200, response.text

        detail = client.get(f"/api/tickets/{ticket['id']}").json()
        assert detail["status"] == "closed"
        assert detail["allowed_transitions"] == []
        assert [(h["from_status"], h["to_status"]) for h in detail["history"]] == [
            (None, "open"),
            ("open", "in_progress"),
            ("in_progress", "resolved"),
            ("resolved", "closed"),
        ]

    def test_status_change_updates_timestamp(self, client):
        ticket = create_ticket(client)

        updated = change_status(client, ticket["id"], "in_progress").json()

        assert updated["updated_at"] > ticket["updated_at"]

    @pytest.mark.parametrize("target", ["open", "resolved", "closed"])
    def test_rejects_transitions_outside_the_workflow(self, client, target):
        ticket = create_ticket(client)

        response = change_status(client, ticket["id"], target)

        assert response.status_code == 409
        detail = client.get(f"/api/tickets/{ticket['id']}").json()
        assert detail["status"] == "open"
        assert len(detail["history"]) == 1

    def test_cannot_move_back_to_a_previous_status(self, client):
        ticket = create_ticket(client)
        change_status(client, ticket["id"], "in_progress")

        assert change_status(client, ticket["id"], "open").status_code == 409

    def test_rejects_unknown_status(self, client):
        ticket = create_ticket(client)

        assert change_status(client, ticket["id"], "archived").status_code == 422

    def test_returns_404_for_unknown_ticket(self, client):
        assert change_status(client, 999, "in_progress").status_code == 404
