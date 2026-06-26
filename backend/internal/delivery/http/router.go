package http

import (
	"github.com/gofiber/fiber/v2"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/handler"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/middleware"
)

type RouterConfig struct {
	CORSOrigin        string
	DatasourceHandler *handler.DatasourceHandler
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
	datasources.Post("/", cfg.DatasourceHandler.Create)
	datasources.Get("/", cfg.DatasourceHandler.List)
	datasources.Get("/:id", cfg.DatasourceHandler.GetByID)
	datasources.Put("/:id", cfg.DatasourceHandler.Update)
	datasources.Delete("/:id", cfg.DatasourceHandler.Delete)
	datasources.Post("/:id/test", cfg.DatasourceHandler.TestConnection)

	return app
}