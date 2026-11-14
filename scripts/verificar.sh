#!/bin/bash
# Replica localmente lo que hace el CI: lint, formato, build y pruebas.
set -e

echo "🔍 Verificando código..."
echo ""

echo "1/4 — Lint..."
npm run lint 2>&1 || { echo "❌ Lint falló"; exit 1; }
echo "✅ Lint OK"
echo ""

echo "2/4 — Formato..."
npm run format:check 2>&1 || { echo "❌ Formato incorrecto. Ejecuta: npm run format"; exit 1; }
echo "✅ Formato OK"
echo ""

echo "3/4 — Build..."
VITE_SUPABASE_URL=http://localhost:54321 \
VITE_SUPABASE_ANON_KEY=test \
npm run build --workspace=apps/web 2>&1 || { echo "❌ Build falló"; exit 1; }
echo "✅ Build OK"
echo ""

echo "4/4 — Pruebas..."
npm run test --workspaces -- --run 2>&1 || { echo "❌ Pruebas fallaron"; exit 1; }
echo "✅ Pruebas OK"
echo ""

echo "═══════════════════════"
echo "✅ Todo verificado"
echo "═══════════════════════"
