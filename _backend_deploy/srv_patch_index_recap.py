#!/usr/bin/env python3
"""
Server-side patch: adds /v2/daily-recap route to index.js
Uses lazy-require pattern matching the existing routes.
"""
import sys

APP = '/srv/www/htdocs/swiftapp/server'


def rf(path):
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()


def wf(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('  WRITTEN: {}'.format(path))


print('\n=== Patching index.js: add daily-recap route ===')
path = '{}/index.js'.format(APP)
src = rf(path)

CLAIM_MARKER = (
    "  const { claimV2QuestEndpoint } = require('./endPoints/v1/gamificationV2');\n"
    "  claimV2QuestEndpoint(req, res);\n"
    "});"
)

NEW_BLOCK = (
    "  const { claimV2QuestEndpoint } = require('./endPoints/v1/gamificationV2');\n"
    "  claimV2QuestEndpoint(req, res);\n"
    "});\n"
    "\n"
    "app.get('/swift-app/v1/user/gamification/v2/daily-recap', (req, res) => {\n"
    "  const { getV2DailyRecapEndpoint } = require('./endPoints/v1/gamificationV2');\n"
    "  getV2DailyRecapEndpoint(req, res);\n"
    "});"
)

if '/daily-recap' not in src:
    if CLAIM_MARKER in src:
        src = src.replace(CLAIM_MARKER, NEW_BLOCK, 1)
        print('  + /daily-recap route added')
    else:
        QUESTS_MARKER = (
            "  const { getV2QuestsEndpoint } = require('./endPoints/v1/gamificationV2');\n"
            "  getV2QuestsEndpoint(req, res);\n"
            "});"
        )
        NEW_BLOCK2 = (
            "  const { getV2QuestsEndpoint } = require('./endPoints/v1/gamificationV2');\n"
            "  getV2QuestsEndpoint(req, res);\n"
            "});\n"
            "\n"
            "app.get('/swift-app/v1/user/gamification/v2/daily-recap', (req, res) => {\n"
            "  const { getV2DailyRecapEndpoint } = require('./endPoints/v1/gamificationV2');\n"
            "  getV2DailyRecapEndpoint(req, res);\n"
            "});"
        )
        if QUESTS_MARKER in src:
            src = src.replace(QUESTS_MARKER, NEW_BLOCK2, 1)
            print('  + /daily-recap route added (quests fallback)')
        else:
            print('  ! no suitable marker found in index.js')
            sys.exit(1)
else:
    print('  ~ /daily-recap route already present')

wf(path, src)
print('=== index.js patched ===')
