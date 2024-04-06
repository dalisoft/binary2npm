#!/bin/sh
set -eu

# Exports for binaries access
export PATH="./node_modules/.bin:$PATH"

# CLI app name/prefix
readonly CLI_PREFIX="[lintstaged-sh]"

# Helpers
log() {
  echo "$CLI_PREFIX $1"
}

SH_FILES=""
MARKDOWN_FILES=""
TJSX_FILES=""
JSON_FILES=""
YAML_FILES=""
HTML_FILES=""
CSS_FILES=""

for file in $(git diff --name-only --cached --diff-filter=ACMR); do
  case "$file" in
  *.sh | *.bash)
    SH_FILES="$SH_FILES $file"
    ;;
  *.md)
    MARKDOWN_FILES="$MARKDOWN_FILES $file"
    ;;
  *.js | *.jsx | *.ts | *.tsx)
    TJSX_FILES="$TJSX_FILES $file"
    ;;
  *.json | *.jsonc | *.jsona)
    JSON_FILES="$JSON_FILES $file"
    ;;
  *.yml | *.yaml)
    YAML_FILES="$YAML_FILES $file"
    ;;
  *.html)
    HTML_FILES="$HTML_FILES $file"
    ;;
  *.css | *.scss | *.sass | *.less)
    CSS_FILES="$CSS_FILES $file"
    ;;
  esac
done

SH_FILES=$(echo "$SH_FILES" | awk '{$1=$1}1')
MARKDOWN_FILES=$(echo "$MARKDOWN_FILES" | awk '{$1=$1}1')
TJSX_FILES=$(echo "$TJSX_FILES" | awk '{$1=$1}1')
JSON_FILES=$(echo "$JSON_FILES" | awk '{$1=$1}1')
YAML_FILES=$(echo "$YAML_FILES" | awk '{$1=$1}1')
HTML_FILES=$(echo "$HTML_FILES" | awk '{$1=$1}1')
CSS_FILES=$(echo "$CSS_FILES" | awk '{$1=$1}1')

PRETTIER_FILES=""

# Shell files
if [ ${#SH_FILES} -gt 1 ]; then
  log "Shell linting started"
  if [ "$(command -v shellcheck)" ]; then
    log "Shell [shellcheck] linting..."
    # shellcheck disable=SC2086
    shellcheck ${SH_FILES}
    log "Shell [shellcheck] linting done"
  else
    log "shellcheck binary is not installed"
  fi
  log "Shell linting done\n"
fi

# Markdown files
if [ ${#MARKDOWN_FILES} -gt 1 ]; then
  log "Markdown linting started"

  if [ "$(command -v dprint)" ] && [ -f "./dprint.json" ]; then
    log "Markdown [dprint] linting..."
    # shellcheck disable=SC2086
    dprint check ${MARKDOWN_FILES}
    log "Markdown [dprint] linting done"
  elif [ "$(command -v markdownlint-cli2)" ]; then
    log "dprint binary and/or configuration are not installed but markdownlint-cli2 binary was found"
    log "Markdown [markdownlint-cli2] linting..."
    # shellcheck disable=SC2086
    markdownlint-cli2 ${MARKDOWN_FILES}
    log "Markdown [markdownlint-cli2] done..."
  else
    PRETTIER_FILES="$PRETTIER_FILES $MARKDOWN_FILES"
    log "dprint and markdownlint-cli2 binaries are not installed"
  fi

  log "Markdown linting done\n"
fi

# tsx/ts/jsx/js
if [ ${#TJSX_FILES} -gt 1 ]; then
  log "JS(X)/TS(X) linting started"
  if [ "$(command -v biome)" ] && [ -f "./biome.json" ]; then
    log "JS(X)/TS(X) [biome] linting..."
    # shellcheck disable=SC2086
    biome check ${TJSX_FILES}
    log "JS(X)/TS(X) [biome] linting done"
  else
    PRETTIER_FILES="$PRETTIER_FILES $TJSX_FILES"
    log "biome binary and/or configuration are not installed"
  fi
  log "JS(X)/TS(X) linting done\n"
fi

# json
if [ ${#JSON_FILES} -gt 1 ]; then
  log "JSON linting started"
  if [ "$(command -v jsona)" ]; then
    log "JSON [jsona] linting..."
    # shellcheck disable=SC2086
    jsona fmt --option trailing_newline=true --check ${JSON_FILES}
    log "JSON [jsona] linting done"
  elif [ "$(command -v biome)" ] && [ -f "./biome.json" ]; then
    log "jsona binary is not installed but biome binary was found"
    log "JSON [biome] linting..."
    # shellcheck disable=SC2086
    biome format ${JSON_FILES}
    log "JSON [biome] linting done"
  elif [ "$(command -v dprint)" ] && [ -f "./dprint.json" ]; then
    log "jsona and biome binaries are not installed but dprint binary was found"
    log "JSON [dprint] linting..."
    # shellcheck disable=SC2086
    dprint check ${JSON_FILES}
    log "JSON [dprint] linting done"
  else
    PRETTIER_FILES="$PRETTIER_FILES $JSON_FILES"
    log "jsona, dprint and biome binaries are not installed"
  fi
  log "JSON linting done\n"
fi

# yaml
if [ ${#YAML_FILES} -gt 1 ]; then
  log "YAML linting started"
  if [ "$(command -v spectral)" ]; then
    if [ -f "./.spectral.yaml" ] || [ -f "./.spectral.yml" ]; then
      log "YAML [spectral] linting..."
      # shellcheck disable=SC2086
      spectral lint --ignore-unknown-format ${YAML_FILES}
      log "YAML [spectral] linting done"
    else
      log "YAML [spectral] config not found"
    fi
  else
    log "spectral-lint binary is not installed"
  fi
  PRETTIER_FILES="$PRETTIER_FILES $YAML_FILES"
  log "YAML linting done\n"
fi

# html
if [ ${#HTML_FILES} -gt 1 ]; then
  log "HTML linting started"
  if [ "$(command -v htmllint)" ]; then
    log "HTML [htmllint] linting..."
    # shellcheck disable=SC2086
    htmllint ${HTML_FILES}
    log "HTML [htmllint] linting done"
  else
    log "htmlhint binary is not installed"
  fi
  PRETTIER_FILES="$PRETTIER_FILES $HTML_FILES"
  log "HTML linting done\n"
fi

# css
if [ ${#CSS_FILES} -gt 1 ]; then
  log "CSS linting..."
  if [ "$(command -v stylelint)" ]; then
    log "CSS [stylelint] linting..."
    # shellcheck disable=SC2086
    stylelint --color ${CSS_FILES}
    log "CSS [stylelint] linting done"
  else
    log "stylelint binary is not installed"
  fi
  PRETTIER_FILES="$PRETTIER_FILES $CSS_FILES"
  log "CSS linting done\n"
fi

PRETTIER_FILES=$(echo "${PRETTIER_FILES}" | awk '{$1=$1}1')

if [ ${#PRETTIER_FILES} -gt 4 ]; then
  log "Prettier overall linting..."
  if [ "$(command -v prettier)" ]; then
    log "Prettier overall linting started"
    # shellcheck disable=SC2086
    prettier -c ${PRETTIER_FILES}
    log "Prettier overall linting done\n"
  fi
fi

# Dockerfile
if [ "$(command -v dockerfilelint)" ] && [ -f "./Dockerfile" ]; then
  log "Dockerfile linting..."
  dockerfilelint "Dockerfile"
  log "Dockerfile linting done\n"
fi
