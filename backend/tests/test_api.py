import pytest
import re
from fastapi.testclient import TestClient
from main import app
from monitor import _build_ping_args, TARGETS, ping_target

client = TestClient(app)


def test_list_targets():
    response = client.get("/api/targets")
    assert response.status_code == 200
    data = response.json()
    assert "targets" in data
    assert len(data["targets"]) == len(TARGETS)
    ips = [t["ip"] for t in data["targets"]]
    assert "8.8.8.8" in ips
    assert "1.1.1.1" in ips


def test_build_ping_args():
    args = _build_ping_args("8.8.8.8")
    assert isinstance(args, list)
    assert args[0] == "ping"
    assert "8.8.8.8" in args


def test_ping_regex_parser_linux():
    output = "64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=14.2 ms"
    match = re.search(r"(?:time|tempo)[=<]([\d\.]+)\s*ms", output, re.IGNORECASE)
    assert match is not None
    assert float(match.group(1)) == 14.2


def test_ping_regex_parser_windows():
    output = "Resposta de 8.8.8.8: bytes=32 tempo=12ms TTL=118"
    match = re.search(r"(?:time|tempo)[=<]([\d\.]+)\s*ms", output, re.IGNORECASE)
    assert match is not None
    assert float(match.group(1)) == 12.0


def test_read_metrics():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data
    assert isinstance(data["data"], dict)


def test_read_summary():
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data
    assert isinstance(data["data"], list)


def test_get_topology():
    response = client.get("/api/topology")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0


@pytest.mark.asyncio
async def test_ping_target_timeout_handling(monkeypatch):
    import asyncio

    class FakeProcess:
        async def communicate(self):
            return b"", b""

        def kill(self):
            pass

        async def wait(self):
            return 0

    async def fake_exec(*args, **kwargs):
        return FakeProcess()

    async def fake_wait_for(coro, timeout):
        if hasattr(coro, "close"):
            coro.close()
        raise asyncio.TimeoutError()

    monkeypatch.setattr(asyncio, "create_subprocess_exec", fake_exec)
    monkeypatch.setattr(asyncio, "wait_for", fake_wait_for)

    await ping_target("192.0.2.1")


@pytest.mark.asyncio
async def test_ping_target_exception_handling(monkeypatch):
    import asyncio

    async def fake_exec(*args, **kwargs):
        raise OSError("Ping binary not found")

    monkeypatch.setattr(asyncio, "create_subprocess_exec", fake_exec)

    await ping_target("192.0.2.1")


def test_simulate_chaos():
    response = client.post("/api/chaos", json={"intensity": 50})
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
