#!/usr/bin/env bash
URL="http://localhost:6006"                               # static Storybook
MAX=50                                                   # how many attempts

for i in $(seq 1 $MAX); do
  echo "===== run $i ====="

  # DEBUG=pw:api prints every Playwright API call + console.* message
  DEBUG=pw:api npx test-storybook \
    --ci \
    --verbose \
    --index-json \
    --url "$URL"  2>&1 | tee run.log

  if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌  failure captured on run $i → flaky-log.txt"
    mv run.log flaky-log.txt
    exit 1
  fi

  rm run.log
done

echo "✅  $MAX consecutive green runs"
