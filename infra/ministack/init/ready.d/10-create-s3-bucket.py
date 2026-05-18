#!/usr/bin/env python3
"""Create the Licitadoc development S3 bucket inside MiniStack."""

from __future__ import annotations

import os
import sys
import time
from urllib import error, request

BUCKET_EXISTS_STATUS = {200, 301, 403}
BUCKET_MISSING_STATUS = {400, 404}
BUCKET_ALREADY_OWNED_STATUS = {409}


def send(method: str, url: str) -> int | None:
    data = b"" if method == "PUT" else None
    req = request.Request(url, data=data, method=method)

    try:
        with request.urlopen(req, timeout=10) as response:
            return response.status
    except error.HTTPError as exc:
        return exc.code
    except error.URLError as exc:
        print(f"MiniStack bucket bootstrap waiting for S3 endpoint: {exc}", file=sys.stderr)
        return None


def bucket_exists(url: str) -> bool:
    return send("HEAD", url) in BUCKET_EXISTS_STATUS


def main() -> int:
    bucket = os.getenv("STORAGE_S3_BUCKET", "licitadoc-expense-requests")
    endpoint = os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566").rstrip("/")
    bucket_url = f"{endpoint}/{bucket}"

    for attempt in range(1, 31):
        status = send("HEAD", bucket_url)

        if status in BUCKET_EXISTS_STATUS:
            print(f"MiniStack S3 bucket already ready: {bucket}")
            return 0

        if status not in BUCKET_MISSING_STATUS and status is not None:
            print(
                f"Unexpected bucket check status for {bucket} at {endpoint}: {status}",
                file=sys.stderr,
            )

        create_status = send("PUT", bucket_url)

        if create_status in BUCKET_EXISTS_STATUS or bucket_exists(bucket_url):
            print(f"MiniStack S3 bucket created: {bucket}")
            return 0

        if create_status in BUCKET_ALREADY_OWNED_STATUS and bucket_exists(bucket_url):
            print(f"MiniStack S3 bucket already owned: {bucket}")
            return 0

        print(
            f"MiniStack S3 bucket bootstrap attempt {attempt}/30 failed for {bucket} "
            f"at {endpoint}; create status: {create_status}",
            file=sys.stderr,
        )
        time.sleep(1)

    print(
        f"Could not create MiniStack S3 bucket {bucket} at {endpoint}.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
