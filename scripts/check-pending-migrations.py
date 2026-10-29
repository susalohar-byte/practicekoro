#!/usr/bin/env python3
"""
Guards for the automatic migration pipeline (.github/workflows/db-migrations.yml).

  lint   Check supabase/migrations/ filenames: unique versions, and new files
         named <14-digit version>_<name>.sql so the Supabase CLI accepts them.

           check-pending-migrations.py lint supabase/migrations [--new-files added.txt]

  plan   Read the JSON from `supabase db push --dry-run --output-format json`,
         print the migrations that would be applied, and fail when one of them
         is unexpected:
           * its version is at or below --floor (an old migration that was
             applied by hand and never recorded: run the backfill instead of
             letting the CLI apply it a second time), or
           * --added is given (pull requests) and the file was not added by
             this pull request.

           check-pending-migrations.py plan plan.json --floor 20261029110000 [--added added.txt]

Standard library only. Exit code 1 on any problem.
"""

import argparse
import json
import os
import re
import sys

CLI_NAME = re.compile(r"^(\d+)_(.+)\.sql$")
NEW_NAME = re.compile(r"^\d{14}_[a-z0-9_]+\.sql$")


def read_list(path):
    if not path:
        return None
    with open(path) as f:
        return {os.path.basename(line.strip()) for line in f if line.strip()}


def summary(lines):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a") as f:
            f.write("\n".join(lines) + "\n")


def lint(args):
    problems = []
    seen = {}
    for name in sorted(os.listdir(args.dir)):
        if not name.endswith(".sql"):
            continue
        m = CLI_NAME.match(name)
        if not m:
            problems.append(f"{name}: the Supabase CLI skips this file (name must be <version>_<name>.sql)")
            continue
        version = m.group(1)
        if version in seen:
            problems.append(f"{name}: version {version} is also used by {seen[version]}")
        seen[version] = name
    for name in sorted(read_list(args.new_files) or []):
        if name.endswith(".sql") and not NEW_NAME.match(name):
            problems.append(
                f"{name}: new migrations must be named <YYYYMMDDHHMMSS>_<snake_case_name>.sql "
                "(use `supabase migration new <name>`)"
            )
    for p in problems:
        print(f"::error::{p}")
    if problems:
        return 1
    print(f"{len(seen)} migration files, all versions unique.")
    return 0


def plan(args):
    with open(args.plan) as f:
        raw = f.read()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        print(f"::error::Could not parse the dry-run output:\n{raw}")
        return 1
    if "migrations" not in data:
        print(f"::error::Dry run failed: {json.dumps(data.get('error', data), indent=2)}")
        return 1

    pending = data["migrations"] or []
    added = read_list(args.added)
    problems = []
    for name in pending:
        m = CLI_NAME.match(os.path.basename(name))
        version = m.group(1) if m else name
        if not version.isdigit() or int(version) <= args.floor:
            problems.append(
                f"{name}: version is at or below {args.floor}. It was applied by hand before the "
                "pipeline existed and is not recorded in schema_migrations. Record it with the backfill "
                "(supabase/migrations/README.md) after proving its objects exist; do not let CI re-run it."
            )
        if added is not None and os.path.basename(name) not in added:
            problems.append(
                f"{name}: would be applied but is not added by this pull request. Production history "
                "is missing it: find out why before merging."
            )

    title = "Migrations that will be applied to production" if args.added is None else "Migrations this PR will apply on merge"
    lines = [f"### {title}", ""]
    lines += [f"- `{n}`" for n in pending] or ["_None: production is up to date._"]
    print("\n".join(lines))
    summary(lines)

    for p in problems:
        print(f"::error::{p}")
    return 1 if problems else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_lint = sub.add_parser("lint")
    p_lint.add_argument("dir")
    p_lint.add_argument("--new-files")
    p_plan = sub.add_parser("plan")
    p_plan.add_argument("plan")
    p_plan.add_argument("--floor", type=int, required=True)
    p_plan.add_argument("--added")
    args = parser.parse_args()
    return lint(args) if args.cmd == "lint" else plan(args)


if __name__ == "__main__":
    sys.exit(main())
