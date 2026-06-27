package http

import (
	"github.com/gofiber/fiber/v2"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/handler"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/middleware"
)

type RouterConfig struct {
	CORSOrigin          string
	DatasourceHandler   *handler.DatasourceHandler
	SchemaHandler       *handler.SchemaHandler
	AIProviderHandler   *handler.AIProviderHandler
	GeneratorHandler    *handler.GeneratorHandler
	QueryHandler        *handler.QueryHandler
	SavedQueryHandler   *handler.SavedQueryHandler
	QueryHistoryHandler *handler.QueryHistoryHandler
}

func NewRouter(cfg RouterConfig) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})

	app.Use(middleware.RequestLogger())
	app.Use(middleware.CORS(cfg.CORSOrigin))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	api := app.Group("/api/v1")

	datasources := api.Group("/datasources")
	datasources.Post("/test", cfg.DatasourceHandler.TestConnectionWithBody)
	datasources.Post("/", cfg.DatasourceHandler.Create)
	datasources.Get("/", cfg.DatasourceHandler.List)
	datasources.Get("/:id", cfg.DatasourceHandler.GetByID)
	datasources.Put("/:id", cfg.DatasourceHandler.Update)
	datasources.Delete("/:id", cfg.DatasourceHandler.Delete)
	datasources.Post("/:id/test", cfg.DatasourceHandler.TestConnection)
	datasources.Post("/:id/sync", cfg.SchemaHandler.SyncSchema)
	datasources.Get("/:id/tables", cfg.SchemaHandler.ListTables)
	datasources.Get("/:id/tables/:name/preview", cfg.SchemaHandler.PreviewTable)
	datasources.Get("/:id/tables/:name", cfg.SchemaHandler.GetTableDetail)

	aiProviders := api.Group("/ai-providers")
	aiProviders.Post("/test", cfg.AIProviderHandler.TestConnectionWithBody)
	aiProviders.Post("/", cfg.AIProviderHandler.Create)
	aiProviders.Get("/", cfg.AIProviderHandler.List)
	aiProviders.Put("/:id", cfg.AIProviderHandler.Update)
	aiProviders.Delete("/:id", cfg.AIProviderHandler.Delete)
	aiProviders.Post("/:id/test", cfg.AIProviderHandler.TestConnection)

	generator := api.Group("/generator")
	sessions := generator.Group("/sessions")
	sessions.Post("/", cfg.GeneratorHandler.CreateSession)
	sessions.Get("/", cfg.GeneratorHandler.ListSessions)
	sessions.Get("/:id", cfg.GeneratorHandler.GetSessionByID)
	sessions.Delete("/:id", cfg.GeneratorHandler.DeleteSession)
	sessions.Post("/:id/messages", cfg.GeneratorHandler.SendMessage)

	query := api.Group("/query")
	query.Post("/execute", cfg.QueryHandler.Execute)
	query.Post("/explain", cfg.QueryHandler.Explain)

	savedQueries := api.Group("/saved-queries")
	savedQueries.Post("/", cfg.SavedQueryHandler.Create)
	savedQueries.Get("/", cfg.SavedQueryHandler.List)
	savedQueries.Get("/:id", cfg.SavedQueryHandler.GetByID)
	savedQueries.Put("/:id", cfg.SavedQueryHandler.Update)
	savedQueries.Delete("/:id", cfg.SavedQueryHandler.Delete)

	queryHistory := api.Group("/query-history")
	queryHistory.Get("/", cfg.QueryHistoryHandler.List)
	queryHistory.Get("/:id", cfg.QueryHistoryHandler.GetByID)

	return app
}