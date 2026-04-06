#!/usr/bin/env python3
"""
Injecte les champs modular_template_id, billing_mode, flat_rate_*, return_trip_minutes
dans createJob.js (destructuring du body + addField avant INSERT)
"""
import sys

FILE = '/srv/www/htdocs/swiftapp/server/endPoints/v1/createJob.js'

with open(FILE, 'r') as f:
    content = f.read()

# 1. Add destructuring fields after time_rounding_margin
OLD_DESTRUCTURE = """      time_rounding_minutes,
      time_rounding_margin
    } = req.body;"""

NEW_DESTRUCTURE = """      time_rounding_minutes,
      time_rounding_margin,
      // ✅ Champs template modulaire (Mar 2026)
      modular_template_id,
      billing_mode,
      flat_rate_amount,
      flat_rate_max_hours,
      flat_rate_overage_rate,
      return_trip_minutes
    } = req.body;"""

if OLD_DESTRUCTURE not in content:
    print("ERROR: Could not find destructuring block to patch")
    sys.exit(1)

content = content.replace(OLD_DESTRUCTURE, NEW_DESTRUCTURE)

# 2. Add addField calls before the INSERT query
OLD_INSERT = """    const insertQuery = `INSERT INTO jobs"""

NEW_INSERT = """    // ✅ Champs template modulaire (Mar 2026)
    if (modular_template_id !== undefined && modular_template_id !== null) {
      const tmplId = parseInt(modular_template_id);
      if (!isNaN(tmplId) && tmplId > 0) {
        addField(fields, values, placeholders, 'modular_template_id', tmplId);
      }
    }

    if (billing_mode !== undefined && billing_mode !== null) {
      const validModes = ['location_to_location', 'depot_to_depot', 'flat_rate', 'packing_only', 'unpacking_only'];
      if (validModes.includes(billing_mode)) {
        addField(fields, values, placeholders, 'billing_mode', billing_mode);
      }
    }

    if (flat_rate_amount !== undefined && flat_rate_amount !== null) {
      const amt = parseFloat(flat_rate_amount);
      if (!isNaN(amt) && amt >= 0) {
        addField(fields, values, placeholders, 'flat_rate_amount', amt);
      }
    }

    if (flat_rate_max_hours !== undefined && flat_rate_max_hours !== null) {
      const hrs = parseFloat(flat_rate_max_hours);
      if (!isNaN(hrs) && hrs > 0) {
        addField(fields, values, placeholders, 'flat_rate_max_hours', hrs);
      }
    }

    if (flat_rate_overage_rate !== undefined && flat_rate_overage_rate !== null) {
      const rate = parseFloat(flat_rate_overage_rate);
      if (!isNaN(rate) && rate >= 0) {
        addField(fields, values, placeholders, 'flat_rate_overage_rate', rate);
      }
    }

    if (return_trip_minutes !== undefined && return_trip_minutes !== null) {
      const rtm = parseInt(return_trip_minutes);
      if (!isNaN(rtm) && rtm >= 0) {
        addField(fields, values, placeholders, 'return_trip_minutes', rtm);
      }
    }

    const insertQuery = `INSERT INTO jobs"""

if OLD_INSERT not in content:
    print("ERROR: Could not find INSERT block to patch")
    sys.exit(1)

content = content.replace(OLD_INSERT, NEW_INSERT, 1)

with open(FILE, 'w') as f:
    f.write(content)

print("OK: Template fields injected into createJob.js")
