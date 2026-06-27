package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	deliveryhttp "github.com/nrmadi02/sql-ai/internal/delivery/http"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/handler"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/adapter"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/ai"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/config"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/database"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/encryption"
	"github.com/nrmadi02/sql-ai/internal/infrastructure/repository"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	defer pool.Close()

	enc, err := encryption.NewService(cfg.EncryptionKey)
	if err != nil {
		log.Fatalf("failed to initialize encryption: %v", err)
	}

	adapterRegistry := adapter.NewRegistry()
	aiClient := ai.NewClient()

	datasourceRepo := repository.NewDatasourceRepository(pool, enc)
	aiProviderRepo := repository.NewAIProviderRepository(pool, enc)

	datasourceUsecase := usecase.NewDatasourceUsecase(datasourceRepo, adapterRegistry)
	schemaUsecase := usecase.NewSchemaUsecase(datasourceRepo, adapterRegistry)
	aiProviderUsecase := usecase.NewAIProviderUsecase(aiProviderRepo, aiClient)

	generatorRepo := repository.NewGeneratorRepository(pool)
	savedQueryRepo := repository.NewSavedQueryRepository(pool)
	queryHistoryRepo := repository.NewQueryHistoryRepository(pool)
	aiGateway := ai.NewGateway()
	generatorUsecase := usecase.NewGeneratorUsecase(generatorRepo, datasourceRepo, aiProviderRepo, aiGateway)
	queryHistoryUsecase := usecase.NewQueryHistoryUsecase(queryHistoryRepo)
	savedQueryUsecase := usecase.NewSavedQueryUsecase(savedQueryRepo)
	queryUsecase := usecase.NewQueryUsecase(datasourceRepo, generatorRepo, queryHistoryUsecase, adapterRegistry)

	datasourceHandler := handler.NewDatasourceHandler(datasourceUsecase)
	schemaHandler := handler.NewSchemaHandler(schemaUsecase)
	aiProviderHandler := handler.NewAIProviderHandler(aiProviderUsecase)
	generatorHandler := handler.NewGeneratorHandler(generatorUsecase)
	queryHandler := handler.NewQueryHandler(queryUsecase)
	savedQueryHandler := handler.NewSavedQueryHandler(savedQueryUsecase)
	queryHistoryHandler := handler.NewQueryHistoryHandler(queryHistoryUsecase)

	app := deliveryhttp.NewRouter(deliveryhttp.RouterConfig{
		CORSOrigin:          cfg.CORSOrigin,
		DatasourceHandler:   datasourceHandler,
		SchemaHandler:       schemaHandler,
		AIProviderHandler:   aiProviderHandler,
		GeneratorHandler:    generatorHandler,
		QueryHandler:        queryHandler,
		SavedQueryHandler:   savedQueryHandler,
		QueryHistoryHandler: queryHistoryHandler,
	})

	go func() {
		addr := fmt.Sprintf(":%d", cfg.BackendPort)
		log.Printf("server running at http://localhost%s", addr)
		if err := app.Listen(addr); err != nil {
			log.Fatalf("server stopped: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		log.Printf("failed to shutdown server: %v", err)
	}
}