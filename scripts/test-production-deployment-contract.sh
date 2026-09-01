#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKFLOW_PATH="${PROJECT_ROOT}/.github/workflows/cd.yml"
NGINX_PATH="${PROJECT_ROOT}/nginx/nginx.prod.conf"
FRONTEND_INDEX_PATH="${PROJECT_ROOT}/frontend/index.html"

ruby - "${WORKFLOW_PATH}" "${NGINX_PATH}" "${FRONTEND_INDEX_PATH}" <<'RUBY'
require "yaml"

workflow_path = ARGV.fetch(0)
nginx_path = ARGV.fetch(1)
frontend_index_path = ARGV.fetch(2)
workflow = YAML.load_file(workflow_path)
nginx = File.read(nginx_path)
frontend_index = File.read(frontend_index_path)
steps = workflow.fetch("jobs").fetch("deploy").fetch("steps")
remote_step = steps.find { |step| step["name"] == "Execute Remote Deployment via SSH" }
script = remote_step&.dig("with", "script")

unless script.is_a?(String)
  warn "[FAIL] Remote deployment script was not found"
  exit 1
end

failures = []

def check(failures, condition, message)
  if condition
    puts "[PASS] #{message}"
  else
    warn "[FAIL] #{message}"
    failures << message
  end
end

def function_body(script, name, failures)
  match = script.match(/^#{Regexp.escape(name)}\(\) \{\n(?<body>.*?)^\}/m)
  check(failures, !match.nil?, "#{name} is defined")
  match ? match[:body] : ""
end

deploy_stack = function_body(script, "deploy_stack", failures)
normal_update = "docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --remove-orphans"
nginx_recreate = "docker compose --env-file .env.production -f docker-compose.prod.yml up -d --force-recreate --no-deps nginx"
normal_index = deploy_stack.index(normal_update)
recreate_index = deploy_stack.index(nginx_recreate)

check(failures, !normal_index.nil?, "deploy_stack performs the normal stack update")
check(
  failures,
  !normal_index.nil? && !recreate_index.nil? && recreate_index > normal_index,
  "deploy_stack force-recreates nginx after the normal stack update",
)

verify_csp = function_body(script, "verify_csp", failures)
check(failures, verify_csp.include?("exec -T nginx"), "CSP verification runs inside the nginx service")
check(failures, verify_csp.include?("https://127.0.0.1/"), "CSP verification reads a live HTTPS response")
check(failures, verify_csp.include?("Content-Security-Policy"), "CSP verification selects the response CSP header")
check(failures, verify_csp.include?("https://plausible.io"), "CSP verification requires Plausible")

csp_headers = nginx.scan(/add_header Content-Security-Policy "(?<policy>[^"]+)" always;/).flatten
check(failures, csp_headers.length == 2, "nginx keeps exactly two effective CSP header copies")
frame_sources = csp_headers.map { |policy| policy[/frame-src\s+([^;]+);/, 1] }
maps_frame_origins = %w[https://maps.google.com https://www.google.com]
check(
  failures,
  frame_sources.length == 2 && frame_sources.all? do |sources|
    source_list = sources&.split || []
    maps_frame_origins.all? { |origin| source_list.include?(origin) }
  end,
  "every effective frame-src allows the Google Maps request and redirect origins",
)
policies_without_frame_src = csp_headers.map do |policy|
  policy.sub(/frame-src\s+[^;]+;/, "")
end
check(
  failures,
  policies_without_frame_src.all? do |policy|
    maps_frame_origins.none? { |origin| policy.split.include?(origin) }
  end,
  "Google Maps frame origins are scoped only to frame-src",
)
check(
  failures,
  csp_headers.none? { |policy| policy.include?("readdy.ai") },
  "CSP does not allowlist the dead Readdy widget",
)
check(
  failures,
  !frontend_index.include?("readdy.ai") && !frontend_index.include?("daab4efb-ebe1-4484-a947-b9b911becc35"),
  "frontend index does not load the dead Readdy widget",
)

verify_schema = function_body(script, "verify_schema_readiness", failures)
check(failures, verify_schema.match?(/exec -T backend\s+node/), "schema readiness runs through the backend container")
check(failures, verify_schema.include?("SUPABASE_URL"), "schema readiness uses the backend Supabase URL")
check(failures, verify_schema.include?("SUPABASE_SERVICE_ROLE_KEY"), "schema readiness uses the backend service-role key")
check(failures, verify_schema.include?("/rest/v1/business_account_applications"), "schema readiness queries the required relation")
check(failures, verify_schema.include?("apikey") && verify_schema.include?("Authorization"), "schema readiness authenticates as the service role")
check(
  failures,
  verify_schema.match?(/const maxAttempts = [2-9];/) &&
    verify_schema.match?(/for \(let attempt = 1; attempt <= maxAttempts; attempt \+= 1\)/),
  "schema readiness uses a bounded number of attempts",
)
check(
  failures,
  verify_schema.include?("new AbortController()") &&
    verify_schema.match?(/const timeoutMs = [1-9][0-9]{2,4};/) &&
    verify_schema.include?("setTimeout(() => controller.abort(), timeoutMs)") &&
    verify_schema.include?("signal: controller.signal") &&
    verify_schema.include?("clearTimeout(timeout)"),
  "each schema readiness attempt has an explicit AbortController timeout",
)
check(
  failures,
  verify_schema.include?("response.status === 408") &&
    verify_schema.include?("response.status === 429") &&
    verify_schema.include?("response.status >= 500") &&
    verify_schema.match?(/if \(!isTransient\).*?return false;/m),
  "schema readiness retries only transient HTTP failures",
)
check(
  failures,
  verify_schema.include?("process.exit(1)"),
  "schema readiness exits nonzero when the REST relation is unavailable or retries are exhausted",
)
check(
  failures,
  !verify_schema.match?(/console\.(?:log|error|warn)\([^)]*(?:serviceRoleKey|SUPABASE_SERVICE_ROLE_KEY)/m),
  "schema readiness never logs the service-role key",
)
check(
  failures,
  !verify_schema.match?(/response\.(?:text|json|arrayBuffer|blob)\s*\(/),
  "schema readiness never reads or prints the raw response body",
)

verify_post_deploy = function_body(script, "verify_post_deploy", failures)
verification_calls = %w[verify_health verify_csp].map do |name|
  verify_post_deploy.index(name)
end
check(
  failures,
  verification_calls.all? && verification_calls.each_cons(2).all? { |left, right| left < right } &&
    !verify_post_deploy.include?("verify_schema_readiness"),
  "post-deploy verification preserves health and CSP without classifying schema drift as rollbackable",
)

schema_preflight = script.index("if ! verify_schema_readiness; then")
first_deploy = script.index(/^deploy_stack$/)
check(
  failures,
  !schema_preflight.nil? && !first_deploy.nil? && schema_preflight < first_deploy,
  "schema readiness is a fail-closed preflight before the first stack mutation",
)
preflight_block = if schema_preflight && first_deploy
  script[schema_preflight...first_deploy]
else
  ""
end
check(
  failures,
  preflight_block.include?("exit 1") && !preflight_block.match?(/rollback/i),
  "schema preflight failure exits without entering rollback",
)
check(
  failures,
  script.scan(/\bverify_schema_readiness\b/).length == 2,
  "schema readiness is invoked only by the preflight and never by rollback",
)
check(failures, script.include?("if ! verify_post_deploy; then"), "post-deploy verification failure enters the rollback path")
check(failures, script.include?('git reset --hard "$PREVIOUS_COMMIT"'), "rollback still restores the previous commit")
check(failures, script.scan(/^\s*deploy_stack\s*$/).length >= 2, "rollback still redeploys the restored stack")
check(failures, script.include?("if verify_health; then"), "rollback still verifies restored service health")

if failures.any?
  warn "#{failures.length} production deployment contract assertion(s) failed"
  exit 1
end

puts "Production deployment contract assertions passed"
RUBY
