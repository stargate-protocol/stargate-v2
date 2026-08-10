#!/usr/bin/env bash
# check-wiring-parallel.sh
#
# ⚠️  VIBECODED — this script was 100% AI-generated and has not been reviewed by any human.
#     It has only been tested by running it and manually verifying that the results make sense.
#
# Simulates the CI/CD wiring check:
#   - token-messaging and credit-messaging: per-chain, parallelized, proposes via OneSig
#   - assets, feelibs, treasurer, staking, rewarder, oft-wrapper: run once, in parallel
#
# Usage:
#   STAGE=mainnet ./scripts/check-wiring-parallel.sh
#   STAGE=mainnet MAX_PARALLEL=10 ./scripts/check-wiring-parallel.sh
#   STAGE=mainnet CHAINS_FILTER=avalanche-mainnet ./scripts/check-wiring-parallel.sh
#   STAGE=mainnet CHAINS_FILTER=avalanche-mainnet,arbitrum-mainnet,ethereum-mainnet ./scripts/check-wiring-parallel.sh
#
# CHAINS_FILTER: comma-separated chain names to scope per-chain jobs (token/credit messaging).
#                Once-jobs (assets, feelibs, treasurer, etc.) always run regardless of filter.
#
# Logs: /tmp/wiring-check/<job>.log
# Exit: 0 all pass, 1 any fail

set -uo pipefail

STAGE="${STAGE:-mainnet}"
MAX_PARALLEL="${MAX_PARALLEL:-10}"
LOG_DIR="${LOG_DIR:-/tmp/wiring-check}"
CHAINS_FILTER="${CHAINS_FILTER:-}"  # comma-separated chain names to run; empty = all
MAX_RETRIES="${MAX_RETRIES:-3}"     # retry failed jobs up to N times
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HARDHAT="pnpm run hardhat"
CONFIG_BASE_PATH="./devtools/config/mainnet/01"

if [[ "${STAGE}" == "mainnet" ]]; then
    CHAINS_CONFIG_DIR="${REPO_ROOT}/packages/stg-evm-v2/devtools/config/mainnet/01/chainsConfig"
else
    CHAINS_CONFIG_DIR="${REPO_ROOT}/packages/stg-evm-v2/devtools/config/${STAGE}/chainsConfig"
fi

fmt_duration() {
    local secs="$1"
    if (( secs >= 60 )); then echo "$(( secs / 60 ))m$(( secs % 60 ))s"
    else echo "${secs}s"; fi
}

# --- Discover chains ---
CHAINS=()
while IFS= read -r f; do
    chain="$(basename "$f" .yml)"
    [[ "$chain" == "0-template-chain" ]] && continue
    CHAINS+=("$chain")
done < <(ls "${CHAINS_CONFIG_DIR}"/*.yml 2>/dev/null)

if [[ ${#CHAINS[@]} -eq 0 ]]; then
    echo "ERROR: No chains found in ${CHAINS_CONFIG_DIR}" >&2
    exit 1
fi

# Apply CHAINS_FILTER if set
if [[ -n "${CHAINS_FILTER}" ]]; then
    FILTERED=()
    IFS=',' read -r -a FILTER_LIST <<< "${CHAINS_FILTER}"
    for chain in "${CHAINS[@]}"; do
        for f in "${FILTER_LIST[@]}"; do
            if [[ "${chain}" == "${f}" ]]; then
                FILTERED+=("${chain}")
                break
            fi
        done
    done
    CHAINS=("${FILTERED[@]}")
    if [[ ${#CHAINS[@]} -eq 0 ]]; then
        echo "ERROR: CHAINS_FILTER matched no chains: ${CHAINS_FILTER}" >&2
        exit 1
    fi
fi

# Wire commands (--ci skips prompts, --onesig proposes via OneSig)
WIRE_TOKEN="${HARDHAT} stg:wire::token-messaging --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/token-messaging.config.ts"
WIRE_CREDIT="${HARDHAT} stg:wire::credit-messaging --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/credit-messaging.config.ts"
WIRE_ASSET_ETH="${HARDHAT} stg:wire::asset --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/asset.eth.config.ts"
WIRE_ASSET_USDC="${HARDHAT} stg:wire::asset --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/asset.usdc.config.ts"
WIRE_ASSET_USDT="${HARDHAT} stg:wire::asset --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/asset.usdt.config.ts"
WIRE_ASSET_EURC="${HARDHAT} stg:wire::asset --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/asset.eurc.config.ts"
WIRE_ASSET_METH="${HARDHAT} stg:wire::asset --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/asset.meth.config.ts"
WIRE_ASSET_METIS="${HARDHAT} stg:wire::asset --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/asset.metis.config.ts"
WIRE_FEELIB_ETH="${HARDHAT} stg:wire::feelib-v1 --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/feelib-v1.eth.config.ts"
WIRE_FEELIB_METH="${HARDHAT} stg:wire::feelib-v1 --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/feelib-v1.meth.config.ts"
WIRE_FEELIB_METIS="${HARDHAT} stg:wire::feelib-v1 --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/feelib-v1.metis.config.ts"
WIRE_FEELIB_USDC="${HARDHAT} stg:wire::feelib-v1 --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/feelib-v1.usdc.config.ts"
WIRE_FEELIB_USDT="${HARDHAT} stg:wire::feelib-v1 --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/feelib-v1.usdt.config.ts"
WIRE_FEELIB_EURC="${HARDHAT} stg:wire::feelib-v1 --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/feelib-v1.eurc.config.ts"
WIRE_TREASURER="${HARDHAT} stg:wire::treasurer --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/treasurer.config.ts"
WIRE_STAKING="${HARDHAT} stg:wire::staking --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/staking.config.ts"
WIRE_REWARDER="${HARDHAT} stg:wire::rewarder --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/rewarder.config.ts"
WIRE_OFT_WRAPPER="${HARDHAT} stg:wire::oft-wrapper --ci --onesig --signer deployer --oapp-config ${CONFIG_BASE_PATH}/oft-wrapper.config.ts"

# --- Single-run jobs: label:command ---
ONCE_JOBS=(
    "asset-eth:${WIRE_ASSET_ETH}"
    "asset-usdc:${WIRE_ASSET_USDC}"
    "asset-usdt:${WIRE_ASSET_USDT}"
    "asset-eurc:${WIRE_ASSET_EURC}"
    "feelib-eth:${WIRE_FEELIB_ETH}"
    "feelib-usdc:${WIRE_FEELIB_USDC}"
    "feelib-usdt:${WIRE_FEELIB_USDT}"
    "feelib-eurc:${WIRE_FEELIB_EURC}"
    "treasurer:${WIRE_TREASURER}"
    "staking:${WIRE_STAKING}"
    "rewarder:${WIRE_REWARDER}"
)
if [[ "${STAGE}" == "mainnet" ]]; then
    ONCE_JOBS+=("asset-meth:${WIRE_ASSET_METH}")
    ONCE_JOBS+=("asset-metis:${WIRE_ASSET_METIS}")
    ONCE_JOBS+=("feelib-meth:${WIRE_FEELIB_METH}")
    ONCE_JOBS+=("feelib-metis:${WIRE_FEELIB_METIS}")
    ONCE_JOBS+=("oft-wrapper:${WIRE_OFT_WRAPPER}")
fi

TOTAL_CHAINS="${#CHAINS[@]}"
TOTAL_PER_CHAIN=$(( TOTAL_CHAINS * 2 ))
TOTAL_ONCE="${#ONCE_JOBS[@]}"
TOTAL_JOBS=$(( TOTAL_PER_CHAIN + TOTAL_ONCE ))
SCRIPT_START="$(date +%s)"

echo ""
echo "Wiring check — STAGE=${STAGE}"
if [[ -n "${CHAINS_FILTER}" ]]; then
    echo "  chains:    ${TOTAL_CHAINS}  (filtered: ${CHAINS_FILTER})"
else
    echo "  chains:    ${TOTAL_CHAINS}"
fi
echo "  jobs:      ${TOTAL_JOBS}  (${TOTAL_PER_CHAIN} per-chain  +  ${TOTAL_ONCE} global)"
echo "  parallel:  ${MAX_PARALLEL}"
echo "  retries:   ${MAX_RETRIES}"
echo "  logs:      ${LOG_DIR}"
echo "────────────────────────────────────────────────────"
echo ""
mkdir -p "${LOG_DIR}"
find "${LOG_DIR}" -maxdepth 1 \( -name "*.log" -o -name "*.exit" \) -delete

# --- Semaphore ---
SEM_DIR="$(mktemp -d)"
mkfifo "${SEM_DIR}/sem"
exec 3<>"${SEM_DIR}/sem"

trap 'exec 3>&-; rm -rf "${SEM_DIR}"' EXIT

for _ in $(seq 1 "${MAX_PARALLEL}"); do printf '.' >&3; done

declare -a CHILD_PIDS=()
declare -a CHILD_LABELS=()
LAUNCHED=0

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'
HEARTBEAT_INTERVAL=30  # seconds between "still running" updates per job

run_job() {
    local label="$1"
    local log_file="$2"
    local cmd="$3"
    local from_chains="${4:-}"
    local LAUNCH_NUM="${5:-?}"
    local job_start
    job_start="$(date +%s)"

    printf "  →  [${LAUNCH_NUM}/${TOTAL_JOBS}]  ${label} — starting\n"

    (
        # Per-job heartbeat: prints yellow "still running" every HEARTBEAT_INTERVAL seconds
        (
            local_start="${job_start}"
            while true; do
                sleep "${HEARTBEAT_INTERVAL}"
                secs=$(( $(date +%s) - local_start ))
                if (( secs >= 60 )); then elapsed="$(( secs / 60 ))m$(( secs % 60 ))s"
                else elapsed="${secs}s"; fi
                printf "${YELLOW}  ⏳  ${label} — still running (${elapsed})${RESET}\n"
            done
        ) &
        heartbeat_pid=$!

        cd "${REPO_ROOT}/packages/stg-evm-v2"
        exit_code=1
        attempt=0
        while (( attempt < MAX_RETRIES )); do
            attempt=$(( attempt + 1 ))
            if [[ -n "${from_chains}" ]]; then
                FROM_CHAINS="${from_chains}" STAGE="${STAGE}" eval "${cmd}" >"${log_file}" 2>&1
            else
                STAGE="${STAGE}" eval "${cmd}" >"${log_file}" 2>&1
            fi
            exit_code=$?
            [[ "${exit_code}" -eq 0 ]] && break
            if (( attempt < MAX_RETRIES )); then
                printf "${YELLOW}  ↻  ${label} — attempt ${attempt}/${MAX_RETRIES} failed, retrying in $(( attempt * 5 ))s...${RESET}\n"
                sleep $(( attempt * 5 ))
            fi
        done
        kill "${heartbeat_pid}" 2>/dev/null || true
        echo "${exit_code}" >"${log_file}.exit"

        duration="$(
            secs=$(( $(date +%s) - job_start ))
            if (( secs >= 60 )); then echo "$(( secs / 60 ))m$(( secs % 60 ))s"
            else echo "${secs}s"; fi
        )"
        done_count=$(ls "${LOG_DIR}"/*.exit 2>/dev/null | wc -l | tr -d ' ')

        if [[ "${exit_code}" -eq 0 ]]; then
            printf "${GREEN}  ✓  [${done_count}/${TOTAL_JOBS}]  ${label} — done in ${duration}${RESET}\n"
        else
            printf "${RED}  ✗  [${done_count}/${TOTAL_JOBS}]  ${label} — FAILED after ${duration}${RESET}\n"
        fi
    )
}

# launch_capped <label> <log_file> <cmd> [from_chains]
launch_capped() {
    local label="$1"
    local log_file="$2"
    local cmd="$3"
    local from_chains="${4:-}"

    LAUNCHED=$(( LAUNCHED + 1 ))
    local launch_num="${LAUNCHED}"

    read -r -n 1 -u 3  # acquire slot
    (
        run_job "${label}" "${log_file}" "${cmd}" "${from_chains}" "${launch_num}"
        printf '.' >&3  # release slot
    ) &
    CHILD_PIDS+=($!)
    CHILD_LABELS+=("${label}|${log_file}")
}

# --- Launch once-jobs ---
for entry in "${ONCE_JOBS[@]}"; do
    label="${entry%%:*}"
    cmd="${entry#*:}"
    launch_capped "${label}" "${LOG_DIR}/${label}.log" "${cmd}"
done

# --- Launch per-chain jobs ---
for chain in "${CHAINS[@]}"; do
    launch_capped "${chain} (token)"  "${LOG_DIR}/${chain}-token-messaging.log"  "${WIRE_TOKEN}"  "${chain}"
    launch_capped "${chain} (credit)" "${LOG_DIR}/${chain}-credit-messaging.log" "${WIRE_CREDIT}" "${chain}"
done

echo "  All ${TOTAL_JOBS} jobs queued. Results as they complete:"
echo ""

for pid in "${CHILD_PIDS[@]}"; do
    wait "${pid}" 2>/dev/null || true
done


# --- Results ---
PASS=0
FAIL=0
FAILED_ENTRIES=()

for entry in "${CHILD_LABELS[@]}"; do
    label="${entry%%|*}"
    log_file="${entry##*|}"

    exit_code=1
    [[ -f "${log_file}.exit" ]] && exit_code="$(<"${log_file}.exit")"

    if [[ "${exit_code}" -eq 0 ]]; then
        PASS=$(( PASS + 1 ))
    else
        FAIL=$(( FAIL + 1 ))
        FAILED_ENTRIES+=("${label}|${log_file}")
    fi
done

total_elapsed="$(fmt_duration "$(( $(date +%s) - SCRIPT_START ))")"

echo ""
echo "════════════════════════════════════════════════════"
printf "${FAIL_COUNT:-0}" >/dev/null  # unused, just avoid unbound
if [[ "${FAIL}" -eq 0 ]]; then
    printf "${GREEN}  ${PASS} passed  /  ${FAIL} failed  /  ${TOTAL_JOBS} total  —  ${total_elapsed}${RESET}\n"
else
    printf "${RED}  ${PASS} passed  /  ${FAIL} failed  /  ${TOTAL_JOBS} total  —  ${total_elapsed}${RESET}\n"
fi
echo ""

if [[ ${#FAILED_ENTRIES[@]} -gt 0 ]]; then
    echo "Failed jobs:"
    for entry in "${FAILED_ENTRIES[@]}"; do
        label="${entry%%|*}"
        log_file="${entry##*|}"
        echo ""
        echo "  ✗  ${label}"
        echo "     log: ${log_file}"
        grep -i "error\|failed\|reason\|cause\|cannot\|unable\|assert" "${log_file}" | grep -v "^    at " | tail -5 | sed 's/^/     /'
        echo "     --- full log: ${log_file}"
    done
    echo ""

    # Collect unique chain names from failed per-chain jobs (token/credit) for retry
    FAILED_CHAINS=()
    for entry in "${FAILED_ENTRIES[@]}"; do
        label="${entry%%|*}"
        case "${label}" in
            *" (token)")  chain="${label% (token)}" ;;
            *" (credit)") chain="${label% (credit)}" ;;
            *) continue ;;  # once-jobs (assets/feelibs/etc.) are not per-chain
        esac
        already=0
        for c in "${FAILED_CHAINS[@]:-}"; do
            [[ "${c}" == "${chain}" ]] && { already=1; break; }
        done
        (( already == 0 )) && FAILED_CHAINS+=("${chain}")
    done

    if [[ ${#FAILED_CHAINS[@]} -gt 0 ]]; then
        FAILED_CHAINS_CSV="$(IFS=,; echo "${FAILED_CHAINS[*]}")"
        echo "Failed chains: ${FAILED_CHAINS_CSV}"
        echo ""
        echo "To retry them, run:"
        echo ""
        echo "  STAGE=${STAGE} CHAINS_FILTER=${FAILED_CHAINS_CSV} ./scripts/check-wiring-parallel.sh"
        echo ""
    fi

    exit 1
fi

echo "  ✓  All checks passed."
