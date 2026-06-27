package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type SchemaHandler struct {
	usecase *usecase.SchemaUsecase
}

func NewSchemaHandler(uc *usecase.SchemaUsecase) *SchemaHandler {
	return &SchemaHandler{usecase: uc}
}

func (h *SchemaHandler) ListTables(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	result, err := h.usecase.ListTables(c.Context(), id)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(result)
}

func (h *SchemaHandler) GetTableDetail(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	tableName := c.Params("name")
	result, err := h.usecase.GetTableDetail(c.Context(), id, tableName)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(result)
}

func (h *SchemaHandler) PreviewTable(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	tableName := c.Params("name")
	result, err := h.usecase.PreviewTable(c.Context(), id, tableName)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(result)
}

func (h *SchemaHandler) SyncSchema(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	result, err := h.usecase.SyncSchema(c.Context(), id)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(result)
}