#!/usr/bin/env python3
"""Wisp slice snapshot and contract identity (Linux replacement).

Historical tool path ../../work/loop-state/identity.py is not present on this
host. This recreation follows LOOP.md and the BUILD snapshot rules. Historical
hashes remain historical; they cannot be reproduced without the original tool
and Mac working tree. Do not treat a matching digest as proof of those records.

Coverage (candidate file manifest):
  Include every tracked and non-ignored untracked file under the repository
  root (git ls-files -co --exclude-standard when Git is available; otherwise
  a filesystem walk). Record relative POSIX path, type (file or symlink),
  owner/group/other executable bits as a three-character 0/1 string, SHA-256
  of regular-file bytes, and symlink target.
  BUILD.md and SLICES.md contribute canonicalized bytes (bookkeeping stripped)
  so Status/Proof/Review/Loop-state/Next/run-status/release-evidence/placement
  /ledger/backlog writes do not change the candidate.
Exclude from the manifest:
  .git/
  this identity.py file (hashed only into contract identity)
  the manifest store directory if it is inside the repository
  names that begin with .git (the Git directory)

Contract identity covers:
  BUILD from Slice through Tests, plus the Loop-state snapshot capture line
  SLICES product/users/target/open-decisions/engine-reference/release-gates
    and every mapped slice body with target membership, ordered by slice ID
    (Shipped/Now/Later/Implemented-verification-pending placement headings,
    Implementation ledger and Verification backlog omitted)
  full AGENTS.md, LOOP.md, BUILDER.md, REVIEWER.md
  this identity.py file bytes

Manifest JSON is written outside coverage (WISP_LOOP_STATE, default
$HOME/wisp-work/loop-state).
"""
from __future__ import annotations

import hashlib
import json
import os
import stat
import subprocess
import sys
from pathlib import Path

PROTOCOL_FILES = ("AGENTS.md", "LOOP.md", "BUILDER.md", "REVIEWER.md")
SLICE_HEADING_SKIP = {
    "run status",
    "release evidence",
    "shipped",
    "now",
    "later",
    "implemented, verification pending",
    "implementation ledger",
    "verification backlog",
}
BUILD_STOP = "## Proof"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def posix_rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def git_covered_paths(root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-co", "--exclude-standard"],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    )
    paths = [line for line in result.stdout.splitlines() if line]
    paths.sort()
    return paths


def walk_covered_paths(root: Path) -> list[str]:
    paths: list[str] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [name for name in dirnames if name != ".git"]
        for name in filenames:
            full = Path(dirpath) / name
            paths.append(posix_rel(full, root))
    paths.sort()
    return paths


def executable_bits(mode: int) -> str:
    return "".join("1" if mode & bit else "0" for bit in (stat.S_IXUSR, stat.S_IXGRP, stat.S_IXOTH))


def section_after(text: str, heading: str) -> str | None:
    marker = f"## {heading}"
    start = text.find(marker)
    if start < 0:
        return None
    rest = text[start + len(marker) :]
    nxt = rest.find("\n## ")
    body = rest if nxt < 0 else rest[:nxt]
    return body.strip("\n")


def strip_build(text: str) -> str:
    idx = text.find(f"\n{BUILD_STOP}")
    if idx < 0:
        idx = text.find(BUILD_STOP)
        if idx == 0:
            return ""
        if idx < 0:
            return text
    return text[:idx].rstrip() + "\n"


def snapshot_line(build_text: str) -> str:
    loop = section_after(build_text, "Loop state")
    if loop is None:
        raise SystemExit("BUILD.md missing Loop state section")
    for line in loop.splitlines():
        if line.startswith("Snapshot capture and recheck commands"):
            return line.rstrip()
    raise SystemExit("BUILD.md Loop state missing snapshot capture line")


def slices_core_and_bodies(text: str) -> tuple[str, list[tuple[str, str]]]:
    lines = text.splitlines(keepends=True)
    core: list[str] = []
    bodies: list[tuple[str, str]] = []
    i = 0
    current_heading = None
    skip = False
    collecting_slice = False
    slice_id = ""
    slice_buf: list[str] = []

    def flush_slice() -> None:
        nonlocal collecting_slice, slice_id, slice_buf
        if collecting_slice:
            bodies.append((slice_id, "".join(slice_buf).rstrip() + "\n"))
        collecting_slice = False
        slice_id = ""
        slice_buf = []

    while i < len(lines):
        line = lines[i]
        if line.startswith("## ") and not line.startswith("### "):
            flush_slice()
            current_heading = line[3:].strip().lower()
            skip = current_heading in SLICE_HEADING_SKIP
            if not skip:
                core.append(line)
            i += 1
            continue
        if line.startswith("### "):
            flush_slice()
            collecting_slice = True
            slice_id = line[4:].strip()
            slice_buf = [line]
            i += 1
            continue
        if collecting_slice:
            slice_buf.append(line)
            i += 1
            continue
        if not skip:
            core.append(line)
        i += 1
    flush_slice()
    return "".join(core).rstrip() + "\n", bodies


def canonicalize_slices(text: str) -> str:
    core, bodies = slices_core_and_bodies(text)
    bodies.sort(key=lambda item: item[0])
    mapped = "".join(body for _, body in bodies)
    return core.rstrip() + "\n\n## Mapped slices\n\n" + mapped


def contract_slices(text: str) -> str:
    return canonicalize_slices(text)


def contract_payload(root: Path, identity_bytes: bytes) -> bytes:
    build = (root / "BUILD.md").read_text(encoding="utf-8")
    slices = (root / "SLICES.md").read_text(encoding="utf-8")
    parts = {
        "build_through_tests": strip_build(build),
        "snapshot_commands": snapshot_line(build),
        "slices_contract": contract_slices(slices),
    }
    for name in PROTOCOL_FILES:
        parts[name] = (root / name).read_text(encoding="utf-8")
    document = {
        "build_through_tests": parts["build_through_tests"],
        "snapshot_commands": parts["snapshot_commands"],
        "slices_contract": parts["slices_contract"],
        "AGENTS.md": parts["AGENTS.md"],
        "LOOP.md": parts["LOOP.md"],
        "BUILDER.md": parts["BUILDER.md"],
        "REVIEWER.md": parts["REVIEWER.md"],
        "identity.py_sha256": sha256_bytes(identity_bytes),
        "identity.py": identity_bytes.decode("utf-8"),
    }
    return json.dumps(document, ensure_ascii=True, indent=2, sort_keys=True).encode("utf-8") + b"\n"


def file_record(root: Path, rel: str, identity_rel: str, store: Path | None) -> dict | None:
    if rel == identity_rel:
        return None
    path = root / rel
    if store is not None:
        try:
            path.resolve().relative_to(store.resolve())
            return None
        except ValueError:
            pass
    if not path.exists() and not path.is_symlink():
        return None
    if path.is_symlink():
        return {
            "path": rel,
            "type": "symlink",
            "mode": executable_bits(path.lstat().st_mode),
            "sha256": None,
            "symlink_target": os.readlink(path),
        }
    if not path.is_file():
        return None
    data = path.read_bytes()
    if rel == "BUILD.md":
        data = strip_build(data.decode("utf-8")).encode("utf-8")
    elif rel == "SLICES.md":
        data = canonicalize_slices(data.decode("utf-8")).encode("utf-8")
    return {
        "path": rel,
        "type": "file",
        "mode": executable_bits(path.stat().st_mode),
        "sha256": sha256_bytes(data),
        "symlink_target": None,
        "bytes": len(data),
    }


def candidate_manifest(root: Path, identity_rel: str, store: Path | None) -> list[dict]:
    if (root / ".git").exists():
        rels = git_covered_paths(root)
    else:
        rels = walk_covered_paths(root)
    records = []
    for rel in rels:
        record = file_record(root, rel, identity_rel, store)
        if record:
            records.append(record)
    records.sort(key=lambda item: item["path"])
    return records


def store_dir() -> Path:
    override = os.environ.get("WISP_LOOP_STATE")
    if override:
        return Path(override)
    return Path.home() / "wisp-work" / "loop-state"


def write_outputs(store: Path, candidate: str, contract: str, manifest: list[dict], contract_bytes: bytes) -> None:
    store.mkdir(parents=True, exist_ok=True)
    os.chmod(store, 0o700)
    manifest_path = store / "candidate-manifest.json"
    hashes_path = store / "identities.json"
    contract_path = store / "contract.json"
    payload = json.dumps({"files": manifest}, ensure_ascii=True, indent=2, sort_keys=True).encode("utf-8") + b"\n"
    manifest_path.write_bytes(payload)
    os.chmod(manifest_path, 0o600)
    contract_path.write_bytes(contract_bytes)
    os.chmod(contract_path, 0o600)
    hashes_path.write_text(
        json.dumps(
            {
                "candidate": candidate,
                "contract": contract,
                "manifest": str(manifest_path),
                "contract_document": str(contract_path),
                "file_count": len(manifest),
                "tool": "tools/identity.py",
                "historical_note": "Does not reproduce Mac-era hashes.",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    os.chmod(hashes_path, 0o600)


def self_test(root: Path, identity_path: Path) -> None:
    identity_rel = posix_rel(identity_path, root)
    identity_bytes = identity_path.read_bytes()
    store = store_dir()
    first = candidate_manifest(root, identity_rel, store)
    contract = contract_payload(root, identity_bytes)
    cand = sha256_bytes(json.dumps({"files": first}, ensure_ascii=True, indent=2, sort_keys=True).encode("utf-8") + b"\n")
    con = sha256_bytes(contract)
    if not first:
        raise SystemExit("self-test: empty manifest")
    if cand == con:
        raise SystemExit("self-test: candidate and contract must differ")
    paths = {item["path"] for item in first}
    if identity_rel in paths:
        raise SystemExit("self-test: identity.py leaked into candidate coverage")
    if "BUILD.md" not in paths or "SLICES.md" not in paths:
        raise SystemExit("self-test: protocol files missing from candidate")
    expected_skip = {
        "run status",
        "release evidence",
        "shipped",
        "now",
        "later",
        "implemented, verification pending",
        "implementation ledger",
        "verification backlog",
    }
    if SLICE_HEADING_SKIP != expected_skip:
        raise SystemExit(f"self-test: SLICE_HEADING_SKIP mismatch {SLICE_HEADING_SKIP!r}")
    print("self-test ok")
    print(f"candidate {cand}")
    print(f"contract {con}")
    print(f"files {len(first)}")


def main(argv: list[str]) -> int:
    args = argv[1:]
    repo = Path.cwd()
    identity_path = Path(__file__).resolve()
    if args and args[0] not in {"--self-test", "--repo"}:
        repo = Path(args[0]).resolve()
    if "--repo" in args:
        repo = Path(args[args.index("--repo") + 1]).resolve()
    if "--self-test" in args:
        self_test(repo, identity_path)
        return 0
    identity_rel = posix_rel(identity_path, repo) if identity_path.is_relative_to(repo) else "tools/identity.py"
    identity_bytes = identity_path.read_bytes()
    store = store_dir()
    manifest = candidate_manifest(repo, identity_rel, store)
    manifest_bytes = json.dumps({"files": manifest}, ensure_ascii=True, indent=2, sort_keys=True).encode("utf-8") + b"\n"
    candidate = sha256_bytes(manifest_bytes)
    contract_bytes = contract_payload(repo, identity_bytes)
    contract = sha256_bytes(contract_bytes)
    write_outputs(store, candidate, contract, manifest, contract_bytes)
    print(f"candidate {candidate}")
    print(f"contract {contract}")
    print(f"files {len(manifest)}")
    print(f"manifest {store / 'candidate-manifest.json'}")
    print(f"identities {store / 'identities.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
