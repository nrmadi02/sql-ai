package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/dto"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type DatasourceHandler struct {
	usecase *usecase.DatasourceUsecase
}

func NewDatasourceHandler(uc *usecase.DatasourceUsecase) *DatasourceHandler {
	return &DatasourceHandler{usecase: uc}
}

func (h *DatasourceHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateDatasourceRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	ds, err := h.usecase.Create(c.Context(), usecase.CreateDatasourceInput{
		Name:           req.Name,
		DBType:         req.DBType,
		Host:           req.Host,
		Port:           req.Port,
		DatabaseName:   req.DatabaseName,
		Username:       req.Username,
		Password:       req.Password,
		SSLMode:        req.SSLMode,
		MaxConnections: req.MaxConnections,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(dto.ToDatasourceResponse(ds))
}

func (h *DatasourceHandler) List(c *fiber.Ctx) error {
	items, err := h.usecase.List(c.Context())
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToDatasourceResponses(items))
}

func (h *DatasourceHandler) GetByID(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	ds, err := h.usecase.GetByID(c.Context(), id)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToDatasourceResponse(ds))
}

func (h *DatasourceHandler) Update(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	var req dto.UpdateDatasourceRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	ds, err := h.usecase.Update(c.Context(), id, usecase.UpdateDatasourceInput{
		Name:           req.Name,
		DBType:         req.DBType,
		Host:           req.Host,
		Port:           req.Port,
		DatabaseName:   req.DatabaseName,
		Username:       req.Username,
		Password:       req.Password,
		SSLMode:        req.SSLMode,
		MaxConnections: req.MaxConnections,
		IsActive:       req.IsActive,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToDatasourceResponse(ds))
}

func (h *DatasourceHandler) Delete(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	if err := h.usecase.Delete(c.Context(), id); err != nil {
		return mapDomainError(err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *DatasourceHandler) TestConnection(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	result, err := h.usecase.TestConnection(c.Context(), id)
	if err != nil {
		return mapDomainError(err)
	}

	return respondTestConnection(c, result)
}

func (h *DatasourceHandler) TestConnectionWithBody(c *fiber.Ctx) error {
	var req dto.CreateDatasourceRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	result, err := h.usecase.TestConnectionWithInput(c.Context(), usecase.CreateDatasourceInput{
		Name:           req.Name,
		DBType:         req.DBType,
		Host:           req.Host,
		Port:           req.Port,
		DatabaseName:   req.DatabaseName,
		Username:       req.Username,
		Password:       req.Password,
		SSLMode:        req.SSLMode,
		MaxConnections: req.MaxConnections,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return respondTestConnection(c, result)
}

func respondTestConnection(c *fiber.Ctx, result *usecase.TestConnectionResult) error {
	status := fiber.StatusOK
	if !result.Success {
		status = fiber.StatusBadGateway
	}
	return c.Status(status).JSON(result)
}

