"""Unit tests for pure backend logic (no database needed).

Dummy Mongo env vars are set before importing server; the Motor client is lazy
so no real connection is made.
"""
import os
import sys
from datetime import date, timedelta

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_db")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import types
import pytest
from fastapi import HTTPException

import server  # noqa: E402


def _next_weekday(target):
    d = date(2026, 1, 1)
    while d.weekday() != target:
        d += timedelta(days=1)
    return d.strftime("%Y-%m-%d")


def test_time_to_minutes():
    assert server._time_to_minutes("13:30") == 13 * 60 + 30
    assert server._time_to_minutes("00:00") == 0
    assert server._time_to_minutes("not-a-time") is None
    assert server._time_to_minutes("") is None


def test_hours_within_working_day():
    monday = _next_weekday(0)          # Mon 13:00-18:00
    assert server._hours_problem(monday, "14:00", 60) is None
    saturday = _next_weekday(5)        # Sat 10:00-13:00
    assert server._hours_problem(saturday, "10:00", 60) is None


def test_hours_closed_and_out_of_range():
    sunday = _next_weekday(6)          # closed
    assert server._hours_problem(sunday, "12:00", 60) is not None
    monday = _next_weekday(0)
    assert server._hours_problem(monday, "09:00", 60) is not None   # before opening
    assert server._hours_problem(monday, "17:30", 60) is not None   # runs past 18:00
    assert server._hours_problem(monday, "bad", 60) is not None     # invalid time
    assert server._hours_problem("nope", "14:00", 60) is not None   # invalid date


def test_rate_limit_allows_then_blocks():
    req = types.SimpleNamespace(headers={"x-forwarded-for": "9.9.9.9"}, client=None)
    for _ in range(3):
        server.rate_limit(req, "unit-test", max_requests=3, window_seconds=100)
    with pytest.raises(HTTPException) as exc:
        server.rate_limit(req, "unit-test", max_requests=3, window_seconds=100)
    assert exc.value.status_code == 429


def test_client_ip_prefers_forwarded():
    req = types.SimpleNamespace(headers={"x-forwarded-for": "1.2.3.4, 5.6.7.8"}, client=None)
    assert server._client_ip(req) == "1.2.3.4"


def test_content_type_map():
    assert server.CONTENT_TYPE_BY_EXT[".png"] == "image/png"
    assert server.CONTENT_TYPE_BY_EXT[".jpg"] == "image/jpeg"
    assert ".exe" not in server.CONTENT_TYPE_BY_EXT


def test_is_valid_location():
    assert server._is_valid_location("voorburg") is True
    assert server._is_valid_location("the_hague_centre") is True
    assert server._is_valid_location("amsterdam") is False
    assert server._is_valid_location("") is False
    assert server._is_valid_location(None) is False


def test_location_name():
    assert server._location_name("voorburg") == "Voorburg"
    assert server._location_name("the_hague_centre") == "The Hague Centre"
    assert server._location_name("amsterdam") == "amsterdam"
    assert server._location_name(None) == "Unknown"


def test_appointment_model_tolerates_missing_location():
    """Records created before this feature shipped have no location_id at all —
    the response model must not reject them (would 500 the whole list endpoint)."""
    doc = {
        "appointment_id": "appt_x",
        "user_id": "u_x",
        "items": [],
        "total_amount": 0.0,
        "total_duration": 0,
        "booking_date": "2026-01-01",
        "booking_time": "14:00",
        "status": "pending",
        "created_at": server.datetime.now(server.timezone.utc),
    }
    appt = server.Appointment(**doc)
    assert appt.location_id is None


def test_blocked_slot_model_tolerates_missing_location():
    doc = {
        "block_id": "block_x",
        "date": "2026-01-01",
        "created_at": server.datetime.now(server.timezone.utc),
    }
    block = server.BlockedSlot(**doc)
    assert block.location_id is None
