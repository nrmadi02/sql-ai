# ============================================================
#  SQL AI — Backend Makefile
# ============================================================

-include .env
export

# ── Variabel ─────────────────────────────────────────────────
BINARY_NAME=sqlai-server
MIGRATION_DIR=migrations
DATABASE_URL?=postgres://user:password@localhost:5432/sqlai?sslmode=disable

# ── Aplikasi ─────────────────────────────────────────────────

## run: Jalankan server development
run:
	go run cmd/server/main.go

## build: Build binary production
build:
	go build -o bin/$(BINARY_NAME) cmd/server/main.go

## test: Jalankan semua unit test
test:
	go test ./... -v -count=1

## test-coverage: Jalankan test dengan coverage report
test-coverage:
	go test ./... -v -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html

## lint: Jalankan linter
lint:
	golangci-lint run ./...

# ── Database Migration ───────────────────────────────────────

## migrate-up: Jalankan semua migrasi yang belum dijalankan
migrate-up:
	migrate -path $(MIGRATION_DIR) -database "$(DATABASE_URL)" up

## migrate-down: Rollback migrasi terakhir
migrate-down:
	migrate -path $(MIGRATION_DIR) -database "$(DATABASE_URL)" down 1

## migrate-down-all: Rollback semua migrasi
migrate-down-all:
	migrate -path $(MIGRATION_DIR) -database "$(DATABASE_URL)" down

## migrate-status: Cek versi migrasi saat ini
migrate-status:
	migrate -path $(MIGRATION_DIR) -database "$(DATABASE_URL)" version

## migrate-create: Buat file migrasi baru (usage: make migrate-create name=nama_migrasi)
migrate-create:
	migrate create -ext sql -dir $(MIGRATION_DIR) -seq $(name)

## migrate-force: Force set versi migrasi (usage: make migrate-force version=1)
migrate-force:
	migrate -path $(MIGRATION_DIR) -database "$(DATABASE_URL)" force $(version)

# ── SQLC ─────────────────────────────────────────────────────

## sqlc-generate: Generate Go code dari SQL queries
sqlc-generate:
	sqlc generate

## sqlc-verify: Verifikasi query SQL valid tanpa generate
sqlc-verify:
	sqlc vet

## sqlc-diff: Lihat perubahan yang akan di-generate
sqlc-diff:
	sqlc diff

# ── Kombinasi ────────────────────────────────────────────────

## setup: Setup awal proyek (install tools + migrasi + generate)
setup: install-tools migrate-up sqlc-generate

## reset-db: Reset database (drop semua + migrasi ulang + generate ulang)
reset-db: migrate-down-all migrate-up sqlc-generate

## generate: Jalankan migrasi + generate sqlc (workflow harian)
generate: migrate-up sqlc-generate

# ── Tools ────────────────────────────────────────────────────

## install-tools: Install CLI tools yang dibutuhkan
install-tools:
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

## tidy: Rapikan Go modules
tidy:
	go mod tidy

# ── Help ─────────────────────────────────────────────────────

## help: Tampilkan daftar command yang tersedia
help:
	@echo "Perintah yang tersedia:"
	@echo ""
	@sed -n 's/^## //p' $(MAKEFILE_LIST) | column -t -s ':'

.PHONY: run build test test-coverage lint \
        migrate-up migrate-down migrate-down-all migrate-status \
        migrate-create migrate-force \
        sqlc-generate sqlc-verify sqlc-diff \
        setup reset-db generate install-tools tidy help

.DEFAULT_GOAL := help